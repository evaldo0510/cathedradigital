/**
 * Sprint B — EXPLAIN sob demanda a partir de trace OpenTelemetry
 * ---------------------------------------------------------------
 * Dado um `trace_id` do APM, busca no backend OTLP as spans `db:*`
 * pertencentes à trace, extrai os `db.query_id` correlatos e roda
 * `EXPLAIN (ANALYZE, BUFFERS)` **na hora** contra o banco alvo.
 *
 * O objetivo é encurtar o loop de investigação:
 *   alerta → trace_id → planos atuais lado a lado com o baseline.
 *
 * Uso:
 *   PG_URL=... OTEL_QUERY_URL=https://tempo/api/traces \
 *     bunx tsx scripts/perf-explain-from-trace.ts <trace_id> \
 *       [--env=staging] [--out=.perf/trace-<id>.md]
 *
 * Requisitos:
 *   - Backend OTLP-compatível que responda `GET {OTEL_QUERY_URL}/<trace_id>`
 *     no formato Tempo/Jaeger (batches → resourceSpans → scopeSpans → spans).
 *   - Spans instrumentadas com `db.query_id` conforme docs/OBSERVABILITY-OTEL.md.
 *
 * Se `OTEL_QUERY_URL` não estiver definido, o script aceita um dump JSON
 * local via `--trace-file=path/to/trace.json` para uso offline.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PG_URL =
  process.env.PG_URL ?? process.env.SUPABASE_DB_URL ?? '';
const OTEL_QUERY_URL = process.env.OTEL_QUERY_URL ?? '';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
);
const traceId = process.argv.slice(2).find((a) => !a.startsWith('--'));

if (!traceId) {
  console.error('uso: perf-explain-from-trace.ts <trace_id> [--env=...] [--out=...] [--trace-file=...]');
  process.exit(2);
}
if (!PG_URL) {
  console.error('[explain-trace] PG_URL não definido.');
  process.exit(2);
}

/** Mapeamento query_id → SQL reproduzível (deve espelhar snapshot). */
const QUERY_MAP: Record<string, string> = {
  'app_metrics:window30d':
    `SELECT metric_type, created_at FROM public.app_metrics
     WHERE created_at >= now() - interval '30 days' LIMIT 5000`,
  'app_metrics:latest100':
    `SELECT * FROM public.app_metrics ORDER BY created_at DESC LIMIT 100`,
  'user_management_stats:page0':
    `SELECT id, email, classification, reflections_count, current_journey, last_activity
     FROM public.user_management_stats LIMIT 20 OFFSET 0`,
  'user_management_stats:page5':
    `SELECT id, email, classification, reflections_count, current_journey, last_activity
     FROM public.user_management_stats LIMIT 20 OFFSET 100`,
  'get_latest_journey_title':
    `SELECT j.title FROM public.journey_progress jp
     JOIN public.journeys j ON jp.journey_id = j.id
     WHERE jp.user_id = (SELECT id FROM public.profiles LIMIT 1)
     ORDER BY jp.completed_at DESC NULLS LAST LIMIT 1`,
};

type SpanInfo = { name: string; query_id: string; duration_ms: number; attrs: Record<string, any> };

async function fetchTrace(id: string): Promise<any> {
  if (args['trace-file']) {
    return JSON.parse(readFileSync(String(args['trace-file']), 'utf8'));
  }
  if (!OTEL_QUERY_URL) {
    throw new Error('nem OTEL_QUERY_URL nem --trace-file fornecidos.');
  }
  const url = `${OTEL_QUERY_URL.replace(/\/$/, '')}/${id}`;
  const res = await fetch(url, {
    headers: process.env.OTEL_QUERY_TOKEN
      ? { Authorization: `Bearer ${process.env.OTEL_QUERY_TOKEN}` }
      : {},
  });
  if (!res.ok) throw new Error(`OTLP query falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Extrai spans com atributo `db.query_id` do payload OTLP/Tempo. */
function extractDbSpans(payload: any): SpanInfo[] {
  const spans: SpanInfo[] = [];
  const batches = payload?.batches ?? payload?.resourceSpans ?? [];
  for (const batch of batches) {
    const scopes = batch.scopeSpans ?? batch.instrumentationLibrarySpans ?? [];
    for (const scope of scopes) {
      for (const s of scope.spans ?? []) {
        const attrs: Record<string, any> = {};
        for (const kv of s.attributes ?? []) {
          attrs[kv.key] =
            kv.value?.stringValue ??
            kv.value?.intValue ??
            kv.value?.doubleValue ??
            kv.value?.boolValue;
        }
        const qid = attrs['db.query_id'];
        if (!qid) continue;
        const startNs = Number(s.startTimeUnixNano ?? 0);
        const endNs = Number(s.endTimeUnixNano ?? 0);
        spans.push({
          name: s.name,
          query_id: String(qid),
          duration_ms: (endNs - startNs) / 1e6,
          attrs,
        });
      }
    }
  }
  return spans;
}

async function explain(sql: string): Promise<any> {
  const dyn = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
  const { Client } = await dyn('pg');
  const client = new Client({ connectionString: PG_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
    );
    return rows[0]['QUERY PLAN'][0];
  } finally {
    await client.end();
  }
}

function renderMarkdown(traceId: string, spans: SpanInfo[], plans: Array<{ query_id: string; plan: any; baseline?: any }>): string {
  const lines: string[] = [];
  lines.push(`# Trace ${traceId} — EXPLAIN sob demanda`, '');
  lines.push(`Gerado em: ${new Date().toISOString()}`, '');
  lines.push('## Spans DB correlatos', '');
  lines.push('| span | query_id | duração observada (ms) | baseline_ms |');
  lines.push('|---|---|---:|---:|');
  for (const s of spans) {
    lines.push(
      `| \`${s.name}\` | \`${s.query_id}\` | ${s.duration_ms.toFixed(1)} | ${s.attrs['perf.baseline_ms'] ?? '—'} |`,
    );
  }
  lines.push('', '## Planos capturados agora', '');
  for (const p of plans) {
    const root = p.plan.Plan;
    lines.push(`### ${p.query_id}`, '');
    lines.push(`- **Total Cost:** ${root['Total Cost']}`);
    lines.push(`- **Execution Time:** ${p.plan['Execution Time']} ms`);
    if (p.baseline) {
      const dCost = ((root['Total Cost'] - p.baseline.total_cost) / p.baseline.total_cost) * 100;
      const dTime = ((p.plan['Execution Time'] - p.baseline.execution_ms) / p.baseline.execution_ms) * 100;
      lines.push(
        `- **Δ vs baseline:** cost ${dCost.toFixed(1)}% · exec ${dTime.toFixed(1)}%`,
      );
    }
    lines.push('', '```json');
    lines.push(JSON.stringify(p.plan, null, 2));
    lines.push('```', '');
  }
  return lines.join('\n');
}

async function main() {
  console.log(`[explain-trace] baixando trace ${traceId}…`);
  const payload = await fetchTrace(traceId);
  const spans = extractDbSpans(payload);
  if (!spans.length) {
    console.error('[explain-trace] nenhuma span com db.query_id encontrada.');
    process.exit(1);
  }
  console.log(`[explain-trace] ${spans.length} span(s) DB; rodando EXPLAIN…`);

  // Carrega baseline do env, se disponível, para diff inline.
  const envName = String(args.env ?? '');
  const baselinePath = envName
    ? join('docs', 'perf-baselines', envName, 'latest.json')
    : join('docs', 'perf-baselines', 'latest.json');
  const baseline = existsSync(baselinePath)
    ? JSON.parse(readFileSync(baselinePath, 'utf8'))
    : null;
  const baseMap = new Map<string, any>(
    (baseline?.entries ?? []).map((e: any) => [e.name, e]),
  );

  const uniqIds = [...new Set(spans.map((s) => s.query_id))];
  const plans: Array<{ query_id: string; plan: any; baseline?: any }> = [];
  for (const id of uniqIds) {
    const sql = QUERY_MAP[id];
    if (!sql) {
      console.warn(`[explain-trace] sem SQL mapeado para "${id}", pulando.`);
      continue;
    }
    const plan = await explain(sql);
    plans.push({ query_id: id, plan, baseline: baseMap.get(id) });
  }

  const md = renderMarkdown(traceId, spans, plans);
  const out = String(args.out ?? `.perf/trace-${traceId}.md`);
  writeFileSync(out, md);
  console.log(`[explain-trace] relatório em ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
