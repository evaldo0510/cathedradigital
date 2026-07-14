/**
 * Sprint B — Diff de baseline vs plano atual (Markdown + JSON + annotations)
 * ---------------------------------------------------------------
 * Emite três saídas coordenadas:
 *
 *   --out=docs/perf-diff.md       relatório humano
 *   --json=.perf/diff.json        estrutura consumível por ferramentas externas
 *                                 (métricas por query ao longo do tempo)
 *   --annotations=.perf/annot.json  GitHub Actions annotations (checks + inline)
 *
 * Também imprime linhas `::error::` / `::warning::` no stdout quando
 * rodado dentro do GitHub Actions, produzindo checks inline no PR.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const FORBIDDEN = ['Seq Scan on app_metrics', 'Seq Scan on journey_progress', 'Sort'];
const COST_LIMIT = Number(process.env.DIFF_COST_PCT ?? 30);
const TIME_LIMIT = Number(process.env.DIFF_TIME_PCT ?? 50);

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
const jsonPath = args.json ? String(args.json) : null;
const annotPath = args.annotations ? String(args.annotations) : null;
// Arquivo "fonte" a que atribuir as annotations inline (path + linha aproximada).
const sourceHintPath = String(args['source-hint'] ?? 'docs/perf-baselines/README.md');

for (const p of [basePath, curPath]) {
  if (!existsSync(p)) {
    console.error(`[diff] arquivo ausente: ${p}`);
    process.exit(2);
  }
}

const base = JSON.parse(readFileSync(basePath, 'utf8'));
const cur = JSON.parse(readFileSync(curPath, 'utf8'));

function indices(sig: string): Set<string> {
  return new Set(Array.from(sig.matchAll(/idx=([^\s|]+)/g)).map((m) => m[1]));
}
function containsForbidden(sig: string): string[] {
  return FORBIDDEN.filter((f) => sig.includes(f));
}
function pctDelta(a: number, b: number): number {
  return ((b - a) / Math.max(0.001, a)) * 100;
}
function severity(delta: number, kind: 'cost' | 'time'): string {
  const t = kind === 'cost' ? [COST_LIMIT, COST_LIMIT * 3] : [TIME_LIMIT, TIME_LIMIT * 3];
  if (delta > t[1]) return '🔴 crítica';
  if (delta > t[0]) return '🟠 alta';
  if (delta > 10) return '🟡 leve';
  if (delta < -10) return '🟢 melhora';
  return '⚪ estável';
}

type Violation = {
  query: string;
  kind: 'lost_index' | 'new_forbidden' | 'cost_regression' | 'time_regression';
  level: 'error' | 'warning';
  message: string;
  detail: Record<string, any>;
};

const baseMap = new Map<string, any>(base.entries.map((e: any) => [e.name, e]));
const violations: Violation[] = [];
const perQuery: any[] = [];

for (const c of cur.entries) {
  const b = baseMap.get(c.name);
  if (!b) {
    perQuery.push({ query: c.name, status: 'new', current: pluck(c) });
    continue;
  }
  const dCost = pctDelta(b.total_cost, c.total_cost);
  const dTime = pctDelta(b.execution_ms, c.execution_ms);
  const idxB = indices(b.signature);
  const idxC = indices(c.signature);
  const lost = [...idxB].filter((i) => !idxC.has(i));
  const gained = [...idxC].filter((i) => !idxB.has(i));
  const newForbidden = containsForbidden(c.signature).filter(
    (f) => !containsForbidden(b.signature).includes(f),
  );

  perQuery.push({
    query: c.name,
    status: 'compared',
    delta_cost_pct: +dCost.toFixed(2),
    delta_time_pct: +dTime.toFixed(2),
    lost_indexes: lost,
    gained_indexes: gained,
    new_forbidden_operators: newForbidden,
    baseline: pluck(b),
    current: pluck(c),
  });

  if (lost.length) {
    violations.push({
      query: c.name, kind: 'lost_index', level: 'error',
      message: `${c.name}: índice esperado sumiu do plano: ${lost.join(', ')}`,
      detail: { lost, baseline_signature: b.signature, current_signature: c.signature },
    });
  }
  if (newForbidden.length) {
    violations.push({
      query: c.name, kind: 'new_forbidden', level: 'error',
      message: `${c.name}: operador proibido apareceu: ${newForbidden.join(', ')}`,
      detail: { forbidden: newForbidden, current_signature: c.signature },
    });
  }
  if (dCost > COST_LIMIT) {
    violations.push({
      query: c.name, kind: 'cost_regression',
      level: dCost > COST_LIMIT * 3 ? 'error' : 'warning',
      message: `${c.name}: custo +${dCost.toFixed(1)}% (limite ${COST_LIMIT}%)`,
      detail: { baseline_cost: b.total_cost, current_cost: c.total_cost, delta_pct: dCost },
    });
  }
  if (dTime > TIME_LIMIT) {
    violations.push({
      query: c.name, kind: 'time_regression',
      level: dTime > TIME_LIMIT * 3 ? 'error' : 'warning',
      message: `${c.name}: tempo +${dTime.toFixed(1)}% (limite ${TIME_LIMIT}%)`,
      detail: { baseline_ms: b.execution_ms, current_ms: c.execution_ms, delta_pct: dTime },
    });
  }
}

function pluck(e: any) {
  return {
    total_cost: e.total_cost,
    execution_ms: e.execution_ms,
    planning_ms: e.planning_ms,
    signature: e.signature,
    shared_hit: e.shared_hit,
    shared_read: e.shared_read,
  };
}

// -------------------- Markdown --------------------
const rows: string[] = [];
rows.push(`# Diff de baseline · ${base.env ?? 'raiz'} → atual`);
rows.push('');
rows.push(`- **Baseline:** commit \`${base.commit?.slice(0, 12) ?? '?'}\` (${base.generated_at}) — catalog_hash \`${base.catalog_hash ?? '?'}\` — pg \`${base.pg_env?.server_version ?? '?'}\``);
rows.push(`- **Atual:**    commit \`${cur.commit?.slice(0, 12) ?? '?'}\` (${cur.generated_at}) — catalog_hash \`${cur.catalog_hash ?? '?'}\` — pg \`${cur.pg_env?.server_version ?? '?'}\``);
if (base.pg_env && cur.pg_env) {
  const diffs = Object.keys({ ...base.pg_env.settings, ...cur.pg_env.settings })
    .filter((k) => base.pg_env.settings[k] !== cur.pg_env.settings[k])
    .map((k) => `\`${k}\`: ${base.pg_env.settings[k]} → ${cur.pg_env.settings[k]}`);
  if (diffs.length) {
    rows.push('');
    rows.push('> ⚠️ **Parâmetros PG divergentes** — comparação injusta possível:');
    rows.push(...diffs.map((d) => `> - ${d}`));
  }
}
if (base.catalog_hash && cur.catalog_hash && base.catalog_hash !== cur.catalog_hash) {
  rows.push('', '> ⚠️ **Catalog hash divergente:** schema/índices/reltuples mudaram entre os dois snapshots.');
}
if (cur.cache_stats?.cache_hit_ratio_pct != null) {
  rows.push('', `> Cache hit ratio da corrida atual: **${cur.cache_stats.cache_hit_ratio_pct}%** (warm=${cur.warmup?.pg_prewarm ?? false}).`);
}
rows.push('', '## Resumo por query', '');
rows.push('| Query | Δ custo | Δ tempo | Índices perdidos | Índices ganhos | Proibidos novos |');
rows.push('|---|---:|---:|---|---|---|');
for (const q of perQuery) {
  if (q.status === 'new') {
    rows.push(`| \`${q.query}\` | (novo) | (novo) | — | — | — |`);
    continue;
  }
  rows.push(
    `| \`${q.query}\` | ${severity(q.delta_cost_pct, 'cost')} ${q.delta_cost_pct.toFixed(1)}% | ${severity(q.delta_time_pct, 'time')} ${q.delta_time_pct.toFixed(1)}% | ${q.lost_indexes.length ? q.lost_indexes.map((i: string) => `\`${i}\``).join(', ') : '—'} | ${q.gained_indexes.length ? q.gained_indexes.map((i: string) => `\`${i}\``).join(', ') : '—'} | ${q.new_forbidden_operators.length ? q.new_forbidden_operators.map((f: string) => `\`${f}\``).join(', ') : '—'} |`,
  );
}
rows.push('');
if (violations.length) {
  rows.push('## 🚨 Alertas', '');
  for (const v of violations) rows.push(`- **${v.level.toUpperCase()}** — ${v.message}`);
} else {
  rows.push(`## ✅ Sem regressões acima dos limites (${COST_LIMIT}% custo · ${TIME_LIMIT}% tempo · zero operadores proibidos novos).`);
}
rows.push('', '## Assinaturas de plano', '');
for (const q of perQuery) {
  rows.push(`### \`${q.query}\``, '');
  rows.push('**Antes:**', '```', q.baseline?.signature ?? '(sem baseline)', '```');
  rows.push('**Depois:**', '```', q.current?.signature ?? '(sem plano)', '```', '');
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, rows.join('\n'));
console.log(`[diff] markdown → ${outPath}`);

// -------------------- JSON estruturado --------------------
if (jsonPath) {
  const payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    limits: { cost_pct: COST_LIMIT, time_pct: TIME_LIMIT, forbidden_operators: FORBIDDEN },
    baseline: {
      commit: base.commit, env: base.env, catalog_hash: base.catalog_hash,
      pg_version: base.pg_env?.server_version, pg_settings: base.pg_env?.settings,
    },
    current: {
      commit: cur.commit, env: cur.env, catalog_hash: cur.catalog_hash,
      pg_version: cur.pg_env?.server_version, pg_settings: cur.pg_env?.settings,
      cache_hit_ratio_pct: cur.cache_stats?.cache_hit_ratio_pct ?? null,
      warmup: cur.warmup ?? null,
    },
    queries: perQuery,
    violations,
    summary: {
      total_queries: perQuery.length,
      regressions: violations.filter((v) => v.level === 'error').length,
      warnings: violations.filter((v) => v.level === 'warning').length,
    },
  };
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  console.log(`[diff] json → ${jsonPath}`);
}

// -------------------- GitHub annotations --------------------
if (annotPath || process.env.GITHUB_ACTIONS === 'true') {
  const annotations = violations.map((v) => ({
    path: sourceHintPath,
    start_line: 1,
    end_line: 1,
    annotation_level: v.level === 'error' ? 'failure' : 'warning',
    title: `perf: ${v.kind} · ${v.query}`,
    message: v.message,
    raw_details: JSON.stringify(v.detail, null, 2),
  }));
  if (annotPath) {
    mkdirSync(dirname(annotPath), { recursive: true });
    writeFileSync(annotPath, JSON.stringify(annotations, null, 2));
    console.log(`[diff] annotations → ${annotPath}`);
  }
  // Workflow-command inline (mostra no PR na aba Files changed).
  if (process.env.GITHUB_ACTIONS === 'true') {
    for (const v of violations) {
      const cmd = v.level === 'error' ? 'error' : 'warning';
      const msg = v.message.replace(/\n/g, '%0A');
      console.log(`::${cmd} file=${sourceHintPath},line=1,title=perf: ${v.query}::${msg}`);
    }
  }
}

if (violations.some((v) => v.level === 'error')) {
  console.error(`[diff] ${violations.length} violação(ões), ${violations.filter(v => v.level === 'error').length} bloqueante(s).`);
  process.exit(1);
}
console.log('[diff] sem regressões bloqueantes.');
