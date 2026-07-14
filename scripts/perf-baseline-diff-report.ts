/**
 * Sprint B — Diff de baseline vs plano atual (gera relatório MD)
 * ---------------------------------------------------------------
 * Lê `docs/perf-baselines/<env>/latest.json` (ou o caminho passado
 * em --baseline) e um snapshot "atual" (--current), gera um
 * relatório Markdown destacando:
 *
 *   - Índices ganhos / perdidos por query
 *   - Operadores proibidos que apareceram (Seq Scan, Sort)
 *   - Variações percentuais de custo e tempo
 *
 * Uso:
 *   bunx tsx scripts/perf-baseline-diff-report.ts \
 *     --baseline=docs/perf-baselines/staging/latest.json \
 *     --current=.perf/current-baseline.json \
 *     --out=docs/perf-diff.md
 *
 * O relatório é intencionalmente auto-contido para colar no PR ou
 * publicar em docs.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FORBIDDEN = ['Seq Scan on app_metrics', 'Seq Scan on journey_progress', 'Sort'];

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
);

const basePath = String(args.baseline ?? 'docs/perf-baselines/latest.json');
const curPath = String(args.current ?? '.perf/current-baseline.json');
const outPath = String(args.out ?? 'docs/perf-diff.md');

for (const p of [basePath, curPath]) {
  if (!existsSync(p)) {
    console.error(`[diff] arquivo ausente: ${p}`);
    process.exit(2);
  }
}

const base = JSON.parse(readFileSync(basePath, 'utf8'));
const cur = JSON.parse(readFileSync(curPath, 'utf8'));

function indices(sig: string): Set<string> {
  return new Set(
    Array.from(sig.matchAll(/idx=([^\s|]+)/g)).map((m) => m[1]),
  );
}

function containsForbidden(sig: string): string[] {
  return FORBIDDEN.filter((f) => sig.includes(f));
}

function pctDelta(a: number, b: number): number {
  return ((b - a) / Math.max(0.001, a)) * 100;
}

function severity(delta: number, kind: 'cost' | 'time'): string {
  const thresholds = kind === 'cost' ? [30, 100] : [50, 200];
  if (delta > thresholds[1]) return '🔴 crítica';
  if (delta > thresholds[0]) return '🟠 alta';
  if (delta > 10) return '🟡 leve';
  if (delta < -10) return '🟢 melhora';
  return '⚪ estável';
}

const baseMap = new Map<string, any>(base.entries.map((e: any) => [e.name, e]));
const rows: string[] = [];
const alerts: string[] = [];

rows.push(`# Diff de baseline · ${base.env ?? 'raiz'} → atual`);
rows.push('');
rows.push(`- **Baseline:** commit \`${base.commit?.slice(0, 12) ?? '?'}\` (${base.generated_at}) — catalog_hash \`${base.catalog_hash ?? '?'}\``);
rows.push(`- **Atual:**    commit \`${cur.commit?.slice(0, 12) ?? '?'}\` (${cur.generated_at}) — catalog_hash \`${cur.catalog_hash ?? '?'}\``);
if (base.catalog_hash && cur.catalog_hash && base.catalog_hash !== cur.catalog_hash) {
  rows.push('');
  rows.push('> ⚠️ **Catalog hash divergente:** schema/índices/reltuples mudaram entre os dois snapshots. Diffs de custo/tempo devem ser lidos com essa mudança em mente.');
}
rows.push('');
rows.push('## Resumo por query');
rows.push('');
rows.push('| Query | Δ custo | Δ tempo | Índices perdidos | Índices ganhos | Proibidos novos |');
rows.push('|---|---:|---:|---|---|---|');

for (const c of cur.entries) {
  const b = baseMap.get(c.name);
  if (!b) {
    rows.push(`| \`${c.name}\` | (novo) | (novo) | — | — | — |`);
    continue;
  }
  const dCost = pctDelta(b.total_cost, c.total_cost);
  const dTime = pctDelta(b.execution_ms, c.execution_ms);
  const idxB = indices(b.signature);
  const idxC = indices(c.signature);
  const lost = [...idxB].filter((i) => !idxC.has(i));
  const gained = [...idxC].filter((i) => !idxB.has(i));
  const fBefore = containsForbidden(b.signature);
  const fAfter = containsForbidden(c.signature);
  const newForbidden = fAfter.filter((f) => !fBefore.includes(f));

  rows.push(
    `| \`${c.name}\` | ${severity(dCost, 'cost')} ${dCost.toFixed(1)}% | ${severity(dTime, 'time')} ${dTime.toFixed(1)}% | ${lost.length ? lost.map((i) => `\`${i}\``).join(', ') : '—'} | ${gained.length ? gained.map((i) => `\`${i}\``).join(', ') : '—'} | ${newForbidden.length ? newForbidden.map((f) => `\`${f}\``).join(', ') : '—'} |`,
  );

  if (lost.length) alerts.push(`- **${c.name}**: índice(s) perdido(s): ${lost.join(', ')}`);
  if (newForbidden.length) alerts.push(`- **${c.name}**: operador proibido apareceu: ${newForbidden.join(', ')}`);
  if (dCost > 30) alerts.push(`- **${c.name}**: custo +${dCost.toFixed(1)}% acima do limite de 30%`);
  if (dTime > 50) alerts.push(`- **${c.name}**: tempo +${dTime.toFixed(1)}% acima do limite de 50%`);
}

rows.push('');
if (alerts.length) {
  rows.push('## 🚨 Alertas');
  rows.push('');
  rows.push(...alerts);
} else {
  rows.push('## ✅ Sem regressões acima dos limites (30% custo · 50% tempo · zero operadores proibidos novos).');
}

rows.push('');
rows.push('## Assinaturas completas de plano');
rows.push('');
for (const c of cur.entries) {
  const b = baseMap.get(c.name);
  rows.push(`### \`${c.name}\``);
  rows.push('');
  rows.push('**Antes:**');
  rows.push('```');
  rows.push(b?.signature ?? '(sem baseline)');
  rows.push('```');
  rows.push('**Depois:**');
  rows.push('```');
  rows.push(c.signature);
  rows.push('```');
  rows.push('');
}

writeFileSync(outPath, rows.join('\n'));
console.log(`[diff] relatório em ${outPath}`);
if (alerts.length) {
  console.error(`[diff] ${alerts.length} alerta(s).`);
  process.exit(1);
}
