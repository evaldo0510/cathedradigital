#!/usr/bin/env node
/**
 * Lê audit.json (saída de `bun audit --json`) e gera:
 *  - REPORTS/audit/summary.md — resumo humano com tabela de vulns
 *  - REPORTS/audit/findings.json — lista normalizada { name, version, severity, url, title, fixed_in }
 *  - Diff vs. execução anterior (baseline em REPORTS/audit/previous-findings.json), gravado em summary.md
 *
 * Uso: node scripts/audit-summary.mjs [audit.json] [--baseline previous-findings.json]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const auditPath = resolve(args.find((a) => !a.startsWith('--')) || 'audit.json');
const baselineIdx = args.indexOf('--baseline');
const baselinePath = baselineIdx >= 0 ? resolve(args[baselineIdx + 1]) : resolve('REPORTS/audit/previous-findings.json');

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
  if (sev && name && (sev === 'high' || sev === 'critical' || sev === 'moderate' || sev === 'low')) {
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

const bySev = { critical: [], high: [], moderate: [], low: [] };
for (const f of findings) (bySev[f.severity] ||= []).push(f);

writeFileSync(resolve(outDir, 'findings.json'), JSON.stringify(findings, null, 2));

// Diff vs baseline
let diff = { added: [], removed: [], unchanged: 0 };
if (existsSync(baselinePath)) {
  const prev = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const key = (f) => `${f.name}::${f.vulnerable_range}::${f.url}`;
  const prevKeys = new Set(prev.map(key));
  const currKeys = new Set(findings.map(key));
  diff.added = findings.filter((f) => !prevKeys.has(key(f)));
  diff.removed = prev.filter((f) => !currKeys.has(key(f)));
  diff.unchanged = findings.length - diff.added.length;
}

const table = (rows) =>
  rows.length === 0
    ? '_nenhuma_'
    : ['| Pacote | Sev | Instalada | Corrige em | Advisory |', '|---|---|---|---|---|',
       ...rows.map((f) => `| \`${f.name}\` | **${f.severity}** | ${f.installed || '—'} | ${f.fixed_in || '—'} | ${f.url ? `[link](${f.url})` : '—'} |`)].join('\n');

const lines = [];
lines.push('## 🔒 Dependency Audit');
lines.push('');
lines.push(`- **Critical:** ${bySev.critical.length}`);
lines.push(`- **High:** ${bySev.high.length}`);
lines.push(`- **Moderate:** ${bySev.moderate.length}`);
lines.push(`- **Low:** ${bySev.low.length}`);
lines.push('');
if (bySev.critical.length + bySev.high.length > 0) {
  lines.push('### ❌ High / Critical (bloqueiam o build)');
  lines.push(table([...bySev.critical, ...bySev.high]));
  lines.push('');
}
if (bySev.moderate.length > 0) {
  lines.push('<details><summary>Moderate</summary>');
  lines.push('');
  lines.push(table(bySev.moderate));
  lines.push('</details>');
  lines.push('');
}
lines.push('### 📈 Diferença vs. execução anterior');
if (!existsSync(baselinePath)) {
  lines.push('_sem baseline — esta é a primeira execução registrada_');
} else {
  lines.push(`- Novas: **${diff.added.length}** · Resolvidas: **${diff.removed.length}** · Mantidas: ${diff.unchanged}`);
  if (diff.added.length) {
    lines.push('');
    lines.push('**➕ Novas vulnerabilidades:**');
    lines.push(table(diff.added));
  }
  if (diff.removed.length) {
    lines.push('');
    lines.push('**✅ Resolvidas:**');
    lines.push(table(diff.removed));
  }
}
lines.push('');
lines.push(`_Gerado por \`scripts/audit-summary.mjs\` em ${new Date().toISOString()}_`);

writeFileSync(resolve(outDir, 'summary.md'), lines.join('\n'));

// GITHUB_OUTPUT
if (process.env.GITHUB_OUTPUT) {
  const out = process.env.GITHUB_OUTPUT;
  const append = (k, v) => writeFileSync(out, `${k}=${v}\n`, { flag: 'a' });
  append('critical', bySev.critical.length);
  append('high', bySev.high.length);
  append('moderate', bySev.moderate.length);
  append('added', diff.added.length);
  append('removed', diff.removed.length);
}

console.log(`summary.md: ${bySev.critical.length} crítica(s), ${bySev.high.length} alta(s), Δ +${diff.added.length}/-${diff.removed.length}`);
