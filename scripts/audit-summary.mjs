#!/usr/bin/env node
/**
 * Lê audit.json (saída de `bun audit --json`) e gera:
 *  - REPORTS/audit/summary.md — resumo humano (comentário PR / job summary)
 *  - REPORTS/audit/summary.html — versão compartilhável (revisões, e-mail)
 *  - REPORTS/audit/findings.json — lista normalizada
 *  - REPORTS/audit/blockers.json — high/critical enriquecidos (versão-alvo)
 *  - REPORTS/audit/ignored.json — findings suprimidos por .dependency-audit.json
 *  - REPORTS/audit/pr-body.md — corpo do PR de auto-update
 *  - REPORTS/audit/pr-commands.sh — sequência `bun add` executada pelo PR
 *
 * Uso: node scripts/audit-summary.mjs [audit.json]
 *      [--baseline previous-findings.json] [--artifact-url URL] [--config .dependency-audit.json]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const posArg = args.find((a) => !a.startsWith('--'));
const auditPath = resolve(posArg || 'audit.json');
const flag = (name, fallback = '') => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const baselinePath = resolve(flag('baseline', 'REPORTS/audit/previous-findings.json'));
const artifactUrl = flag('artifact-url', '');
const configPath = resolve(flag('config', '.dependency-audit.json'));

const outDir = resolve('REPORTS/audit');
mkdirSync(outDir, { recursive: true });

// ---------- Configuração de ignore ----------
let ignoreCfg = { packages: [], advisories: [], reason: {} };
if (existsSync(configPath)) {
  try {
    const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
    ignoreCfg = { packages: [], advisories: [], reason: {}, ...(cfg.ignore || {}) };
  } catch (err) {
    console.warn(`⚠️  Falha ao ler ${configPath}: ${err.message}`);
  }
}
const isIgnored = (f) => {
  if (ignoreCfg.packages.includes(f.name)) return { by: 'package', key: f.name };
  const hay = `${f.url || ''} ${f.title || ''}`.toLowerCase();
  const hit = (ignoreCfg.advisories || []).find((id) => hay.includes(String(id).toLowerCase()));
  if (hit) return { by: 'advisory', key: hit };
  return null;
};

if (!existsSync(auditPath)) {
  console.error(`audit.json não encontrado em ${auditPath}`);
  process.exit(0);
}

const raw = JSON.parse(readFileSync(auditPath, 'utf8'));

// Normaliza — bun audit pode emitir formatos ligeiramente diferentes.
const rawFindings = [];
const seen = new Set();
const walk = (node) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(walk);
  const sev = node.severity;
  const name = node.module_name || node.name || node.package;
  if (sev && name && ['critical', 'high', 'moderate', 'low'].includes(sev)) {
    const key = `${name}@${node.vulnerable_versions || node.range || ''}::${node.url || node.advisory || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      rawFindings.push({
        name,
        severity: sev,
        installed: node.version || node.installed_version || '',
        vulnerable_range: node.vulnerable_versions || node.range || '',
        fixed_in: node.patched_versions || node.fix_available?.version || node.fixed_in || '',
        title: node.title || node.overview || '',
        url: node.url || node.advisory || '',
      });
    }
  }
  for (const v of Object.values(node)) walk(v);
};
walk(raw);

const ignored = [];
const findings = [];
for (const f of rawFindings) {
  const hit = isIgnored(f);
  if (hit) {
    ignored.push({ ...f, ignored_by: hit.by, ignored_key: hit.key, reason: ignoreCfg.reason?.[hit.key] || '' });
  } else {
    findings.push(f);
  }
}

// ---------- Recomendação de versão via registry ----------
const cmp = (a, b) => {
  const A = String(a).replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const B = String(b).replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) - (B[i] || 0);
  return 0;
};
const minPatched = (patched) => {
  if (!patched) return '';
  const versions = [...String(patched).matchAll(/(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
  if (!versions.length) return '';
  return versions.sort(cmp)[0];
};
async function recommend(name, patchedHint) {
  const min = minPatched(patchedHint);
  try {
    const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}`, {
      headers: { accept: 'application/json' },
    });
    if (!r.ok) return { latest: '', recommended: min, source: 'advisory' };
    const meta = await r.json();
    const latest = meta['dist-tags']?.latest || '';
    if (!min) return { latest, recommended: latest, source: 'latest' };
    const candidates = Object.keys(meta.versions || {})
      .filter((v) => !/-/.test(v) && cmp(v, min) >= 0)
      .sort(cmp);
    return { latest, recommended: candidates[0] || latest || min, source: candidates[0] ? 'registry' : 'latest' };
  } catch {
    return { latest: '', recommended: min, source: 'advisory' };
  }
}

const critical = findings.filter((f) => f.severity === 'critical');
const high = findings.filter((f) => f.severity === 'high');
const moderate = findings.filter((f) => f.severity === 'moderate');
const low = findings.filter((f) => f.severity === 'low');

const enrichedBlockers = await Promise.all(
  [...critical, ...high].map(async (f) => ({ ...f, ...(await recommend(f.name, f.fixed_in)) })),
);

writeFileSync(resolve(outDir, 'findings.json'), JSON.stringify(findings, null, 2));
writeFileSync(resolve(outDir, 'blockers.json'), JSON.stringify(enrichedBlockers, null, 2));
writeFileSync(resolve(outDir, 'ignored.json'), JSON.stringify(ignored, null, 2));

// ---------- Diff vs baseline ----------
let diff = { added: [], removed: [], unchanged: 0 };
const keyOf = (f) => `${f.name}::${f.vulnerable_range}::${f.url}`;
if (existsSync(baselinePath)) {
  const prev = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const prevKeys = new Set(prev.map(keyOf));
  const currKeys = new Set(findings.map(keyOf));
  diff.added = findings.filter((f) => !prevKeys.has(keyOf(f)));
  diff.removed = prev.filter((f) => !currKeys.has(keyOf(f)));
  diff.unchanged = findings.length - diff.added.length;
}

const blockerSig = (list) =>
  list
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .map(keyOf)
    .sort()
    .join('|');
const currentBlockerSig = blockerSig(findings);
let previousBlockerSig = '';
if (existsSync(baselinePath)) previousBlockerSig = blockerSig(JSON.parse(readFileSync(baselinePath, 'utf8')));
const blockersChanged = currentBlockerSig !== previousBlockerSig;

// ---------- Tabelas Markdown ----------
const tableBlockers = (rows) =>
  rows.length === 0
    ? '_nenhuma_'
    : ['| Pacote | Sev | Instalada | Faixa vulnerável | Versão-alvo | Advisory |', '|---|---|---|---|---|---|',
       ...rows.map((f) => {
         const rec = f.recommended ? `\`${f.recommended}\`${f.source === 'registry' ? '' : ` _(${f.source})_`}` : '—';
         return `| \`${f.name}\` | **${f.severity}** | ${f.installed || '—'} | ${f.vulnerable_range || '—'} | ${rec} | ${f.url ? `[link](${f.url})` : '—'} |`;
       })].join('\n');

const tableSimple = (rows) =>
  rows.length === 0
    ? '_nenhuma_'
    : ['| Pacote | Sev | Instalada | Corrige em | Advisory |', '|---|---|---|---|---|',
       ...rows.map((f) => `| \`${f.name}\` | ${f.severity} | ${f.installed || '—'} | ${f.fixed_in || '—'} | ${f.url ? `[link](${f.url})` : '—'} |`)].join('\n');

// ---------- summary.md ----------
const lines = [];
lines.push('## 🔒 Dependency Audit');
lines.push('');
lines.push(`- **Critical:** ${critical.length} · **High:** ${high.length} · **Moderate:** ${moderate.length} · **Low:** ${low.length}`);
if (artifactUrl) lines.push(`- [📦 Baixar relatório completo do \`bun audit\`](${artifactUrl})`);
if (ignored.length) lines.push(`- 🙈 ${ignored.length} finding(s) suprimido(s) por \`.dependency-audit.json\``);
lines.push('');
if (enrichedBlockers.length > 0) {
  lines.push('### ❌ High / Critical (bloqueiam o build)');
  lines.push(tableBlockers(enrichedBlockers));
  lines.push('');
  lines.push('**Como aplicar as correções sugeridas:**');
  lines.push('```bash');
  for (const f of enrichedBlockers) {
    if (f.recommended) lines.push(`bun add ${f.name}@${f.recommended}   # ou via overrides se for transitiva`);
  }
  lines.push('```');
  lines.push('');
}
if (moderate.length > 0) {
  lines.push('<details><summary>Moderate</summary>');
  lines.push('');
  lines.push(tableSimple(moderate));
  lines.push('</details>');
  lines.push('');
}
lines.push('### 📈 Diferença vs. execução anterior');
if (!existsSync(baselinePath)) {
  lines.push('_sem baseline — esta é a primeira execução registrada_');
} else {
  lines.push(`- Novas: **${diff.added.length}** · Resolvidas: **${diff.removed.length}** · Mantidas: ${diff.unchanged}`);
  lines.push(`- Conjunto de high/critical ${blockersChanged ? '**mudou**' : 'permanece igual ao anterior'}.`);
  if (diff.added.length) {
    lines.push('');
    lines.push('**➕ Novas vulnerabilidades:**');
    lines.push(tableSimple(diff.added));
  }
  if (diff.removed.length) {
    lines.push('');
    lines.push('**✅ Resolvidas:**');
    lines.push(tableSimple(diff.removed));
  }
}
if (ignored.length) {
  lines.push('');
  lines.push('<details><summary>🙈 Ignorados por configuração</summary>');
  lines.push('');
  lines.push('| Pacote | Sev | Motivo | Regra |');
  lines.push('|---|---|---|---|');
  for (const f of ignored) {
    lines.push(`| \`${f.name}\` | ${f.severity} | ${f.reason || '_sem justificativa_'} | ${f.ignored_by}:\`${f.ignored_key}\` |`);
  }
  lines.push('</details>');
}
lines.push('');
lines.push(`_Gerado por \`scripts/audit-summary.mjs\` em ${new Date().toISOString()}_`);

writeFileSync(resolve(outDir, 'summary.md'), lines.join('\n'));

// ---------- summary.html (compartilhável) ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sevBadge = (s) => {
  const bg = { critical: '#7f1d1d', high: '#b91c1c', moderate: '#b45309', low: '#374151' }[s] || '#374151';
  return `<span style="background:${bg};color:#fff;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">${esc(s)}</span>`;
};
const htmlRow = (f, withRec) => {
  const advisory = f.url ? `<a href="${esc(f.url)}">${esc(f.title || f.url)}</a>` : '—';
  const rec = withRec
    ? `<td><code>${esc(f.recommended || '—')}</code>${f.source && f.source !== 'registry' ? ` <em>(${esc(f.source)})</em>` : ''}</td>`
    : `<td>${esc(f.fixed_in || '—')}</td>`;
  return `<tr><td><code>${esc(f.name)}</code></td><td>${sevBadge(f.severity)}</td><td>${esc(f.installed || '—')}</td><td>${esc(f.vulnerable_range || '—')}</td>${rec}<td>${advisory}</td></tr>`;
};
const htmlTable = (rows, withRec) => rows.length === 0 ? '<p><em>nenhuma</em></p>' : `
<table style="border-collapse:collapse;width:100%;font-size:14px">
  <thead style="background:#f3f4f6;text-align:left">
    <tr><th style="padding:6px 8px">Pacote</th><th>Sev</th><th>Instalada</th><th>Faixa vulnerável</th><th>${withRec ? 'Versão-alvo' : 'Corrige em'}</th><th>Advisory</th></tr>
  </thead>
  <tbody>${rows.map((r) => htmlRow(r, withRec)).join('')}</tbody>
</table>`;

const html = `<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8"><title>Dependency Audit — ${esc(new Date().toISOString().slice(0, 10))}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;color:#111827}
  h1{border-bottom:2px solid #e5e7eb;padding-bottom:8px}
  h2{margin-top:32px}
  table td,table th{border-bottom:1px solid #e5e7eb;padding:8px}
  code{background:#f3f4f6;padding:2px 4px;border-radius:4px;font-size:13px}
  .kpi{display:inline-block;margin-right:16px;padding:8px 12px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb}
  .kpi strong{display:block;font-size:22px}
</style></head><body>
<h1>🔒 Dependency Audit</h1>
<p>
  <span class="kpi"><strong>${critical.length}</strong>Critical</span>
  <span class="kpi"><strong>${high.length}</strong>High</span>
  <span class="kpi"><strong>${moderate.length}</strong>Moderate</span>
  <span class="kpi"><strong>${low.length}</strong>Low</span>
</p>
${artifactUrl ? `<p>📦 <a href="${esc(artifactUrl)}">Baixar relatório completo do <code>bun audit</code></a></p>` : ''}
${ignored.length ? `<p>🙈 ${ignored.length} finding(s) suprimido(s) por <code>.dependency-audit.json</code></p>` : ''}

<h2>❌ High / Critical (bloqueiam o build)</h2>
${htmlTable(enrichedBlockers, true)}

<h2>Moderate</h2>
${htmlTable(moderate, false)}

<h2>📈 Diferença vs. execução anterior</h2>
${existsSync(baselinePath)
  ? `<p>Novas: <strong>${diff.added.length}</strong> · Resolvidas: <strong>${diff.removed.length}</strong> · Mantidas: ${diff.unchanged}<br>
     Conjunto de high/critical ${blockersChanged ? '<strong>mudou</strong>' : 'permanece igual'}.</p>
     ${diff.added.length ? `<h3>➕ Novas</h3>${htmlTable(diff.added, false)}` : ''}
     ${diff.removed.length ? `<h3>✅ Resolvidas</h3>${htmlTable(diff.removed, false)}` : ''}`
  : '<p><em>sem baseline — primeira execução registrada</em></p>'}

<hr><p style="color:#6b7280;font-size:12px">Gerado por <code>scripts/audit-summary.mjs</code> em ${esc(new Date().toISOString())}</p>
</body></html>`;
writeFileSync(resolve(outDir, 'summary.html'), html);

// ---------- Arquivos para auto-PR ----------
const prCommands = enrichedBlockers
  .filter((f) => f.recommended)
  .map((f) => `bun add ${f.name}@${f.recommended}`)
  .join('\n');
if (prCommands) {
  writeFileSync(resolve(outDir, 'pr-commands.sh'), `#!/usr/bin/env bash\nset -euo pipefail\n${prCommands}\n`);
}
const prBody = [
  '# 🔒 Atualização automática de dependências (high/critical)',
  '',
  'Este PR foi aberto automaticamente pelo workflow `dependency-audit.yml` porque o conjunto de vulnerabilidades high/critical mudou.',
  '',
  '## Alterações propostas',
  tableBlockers(enrichedBlockers),
  '',
  '## Checklist antes de mergear',
  '- [ ] `bun audit` sem findings high/critical',
  '- [ ] `bun run typecheck` / `bun run build` OK',
  '- [ ] Sem regressões visuais ou de tipos',
  '',
  artifactUrl ? `📦 [Relatório completo do bun audit](${artifactUrl})` : '',
].join('\n');
writeFileSync(resolve(outDir, 'pr-body.md'), prBody);

// ---------- Outputs para GitHub Actions ----------
if (process.env.GITHUB_OUTPUT) {
  const out = process.env.GITHUB_OUTPUT;
  const append = (k, v) => writeFileSync(out, `${k}=${v}\n`, { flag: 'a' });
  append('critical', critical.length);
  append('high', high.length);
  append('moderate', moderate.length);
  append('low', low.length);
  append('added', diff.added.length);
  append('removed', diff.removed.length);
  append('ignored', ignored.length);
  append('blockers_changed', blockersChanged ? 'true' : 'false');
  append('has_blockers', critical.length + high.length > 0 ? 'true' : 'false');
  append('has_pr_commands', prCommands ? 'true' : 'false');
  append('short', `crit=${critical.length} high=${high.length} mod=${moderate.length} Δ +${diff.added.length}/-${diff.removed.length}`);
}

console.log(
  `summary.md/html: ${critical.length} crítica(s), ${high.length} alta(s), ${ignored.length} ignorada(s), Δ +${diff.added.length}/-${diff.removed.length}, blockers_changed=${blockersChanged}`,
);
