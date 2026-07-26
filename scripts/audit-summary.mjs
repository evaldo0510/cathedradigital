#!/usr/bin/env node
/**
 * Lê audit.json (saída de `bun audit --json`) e gera:
 *  - REPORTS/audit/summary.md — resumo humano com tabela de vulns e recomendação de versão-alvo
 *  - REPORTS/audit/findings.json — lista normalizada
 *  - Diff vs. execução anterior (baseline em REPORTS/audit/previous-findings.json)
 *  - Assinatura de "changed" (novo/removido/alterado em high/critical) para o workflow decidir notificar
 *
 * Uso: node scripts/audit-summary.mjs [audit.json] [--baseline previous-findings.json] [--artifact-url URL]
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

const outDir = resolve('REPORTS/audit');
mkdirSync(outDir, { recursive: true });

if (!existsSync(auditPath)) {
  console.error(`audit.json não encontrado em ${auditPath}`);
  process.exit(0);
}

const raw = JSON.parse(readFileSync(auditPath, 'utf8'));

// Normaliza — bun audit pode emitir formatos ligeiramente diferentes.
const findings = [];
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
      findings.push({
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

// Consulta registry npm para recomendar versão-alvo para cada high/critical.
const cmp = (a, b) => {
  const A = String(a).replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const B = String(b).replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) - (B[i] || 0);
  return 0;
};

// Extrai a menor versão fixa a partir da string `patched_versions` (ex: ">=7.5.15", "^1.2.3 || >=2.0.0").
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
    // recomenda a menor versão publicada >= min
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

// Enriquece high+critical com recomendação
const enrichedBlockers = await Promise.all(
  [...critical, ...high].map(async (f) => ({ ...f, ...(await recommend(f.name, f.fixed_in)) })),
);

writeFileSync(resolve(outDir, 'findings.json'), JSON.stringify(findings, null, 2));
writeFileSync(resolve(outDir, 'blockers.json'), JSON.stringify(enrichedBlockers, null, 2));

// Diff vs baseline
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

// Assinatura de high/critical para decidir notificação — comparamos apenas os blockers.
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

const lines = [];
lines.push('## 🔒 Dependency Audit');
lines.push('');
lines.push(`- **Critical:** ${critical.length} · **High:** ${high.length} · **Moderate:** ${moderate.length} · **Low:** ${low.length}`);
if (artifactUrl) lines.push(`- [📦 Baixar relatório completo do \`bun audit\`](${artifactUrl})`);
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
lines.push('');
lines.push(`_Gerado por \`scripts/audit-summary.mjs\` em ${new Date().toISOString()}_`);

writeFileSync(resolve(outDir, 'summary.md'), lines.join('\n'));

if (process.env.GITHUB_OUTPUT) {
  const out = process.env.GITHUB_OUTPUT;
  const append = (k, v) => writeFileSync(out, `${k}=${v}\n`, { flag: 'a' });
  append('critical', critical.length);
  append('high', high.length);
  append('moderate', moderate.length);
  append('low', low.length);
  append('added', diff.added.length);
  append('removed', diff.removed.length);
  append('blockers_changed', blockersChanged ? 'true' : 'false');
  append('has_blockers', critical.length + high.length > 0 ? 'true' : 'false');
  // Uma linha resumida para o Check
  append('short', `crit=${critical.length} high=${high.length} mod=${moderate.length} Δ +${diff.added.length}/-${diff.removed.length}`);
}

console.log(
  `summary.md: ${critical.length} crítica(s), ${high.length} alta(s), Δ +${diff.added.length}/-${diff.removed.length}, blockers_changed=${blockersChanged}`,
);
