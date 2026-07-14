/**
 * Sprint B — Baseline snapshot versionado por commit + ambiente
 * ---------------------------------------------------------------
 * Captura EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) das queries
 * críticas de B2 e grava:
 *
 *   docs/perf-baselines/<env>/<git-sha>.json
 *   docs/perf-baselines/<env>/latest.json
 *
 * Também inclui um hash dos catálogos relevantes (schema + estatísticas
 * de `pg_class.reltuples` das tabelas alvo) para que revalidações só
 * comparem snapshots com o mesmo shape.
 *
 * Uso:
 *   PG_URL=... PERF_BASELINE=1 \
 *     bunx tsx scripts/perf-baseline-snapshot.ts --env=staging
 *
 * Compat retro: sem --env, grava em docs/perf-baselines/ (raiz).
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const PG_URL =
  process.env.PG_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  '';

if (!PG_URL || process.env.PERF_BASELINE !== '1') {
  console.error('[baseline] requer PG_URL + PERF_BASELINE=1 (opt-in explícito).');
  process.exit(2);
}

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
);
const ENV_NAME = String(args.env ?? process.env.BENCH_ENV ?? '');

const QUERIES: Array<{ name: string; sql: string }> = [
  {
    name: 'app_metrics:window30d',
    sql: `SELECT metric_type, created_at FROM public.app_metrics
          WHERE created_at >= now() - interval '30 days' LIMIT 5000`,
  },
  {
    name: 'app_metrics:latest100',
    sql: `SELECT * FROM public.app_metrics
          ORDER BY created_at DESC LIMIT 100`,
  },
  {
    name: 'get_latest_journey_title',
    sql: `SELECT j.title
          FROM public.journey_progress jp
          JOIN public.journeys j ON jp.journey_id = j.id
          WHERE jp.user_id = (SELECT id FROM public.profiles LIMIT 1)
          ORDER BY jp.completed_at DESC NULLS LAST LIMIT 1`,
  },
];

const CATALOG_TABLES = ['app_metrics', 'journey_progress', 'journeys', 'profiles'];

async function withClient<T>(fn: (c: any) => Promise<T>): Promise<T> {
  const dyn = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
  const { Client } = await dyn('pg');
  const client = new Client({ connectionString: PG_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function flatten(node: any, acc: any[] = []): any[] {
  acc.push(node);
  for (const c of node.Plans ?? []) flatten(c, acc);
  return acc;
}

function signature(plan: any) {
  return flatten(plan.Plan)
    .map((n) => {
      const parts = [n['Node Type']];
      if (n['Index Name']) parts.push(`idx=${n['Index Name']}`);
      if (n['Relation Name']) parts.push(`rel=${n['Relation Name']}`);
      if (n['Sort Key'])
        parts.push(`sort=${(n['Sort Key'] as string[]).join(',')}`);
      return parts.join(' ');
    })
    .join(' | ');
}

async function catalogHash(client: any): Promise<string> {
  const { rows } = await client.query(
    `SELECT c.relname,
            c.reltuples::bigint AS reltuples,
            pg_get_indexdef(i.indexrelid) AS indexdef
       FROM pg_class c
       LEFT JOIN pg_index i ON i.indrelid = c.oid
       WHERE c.relname = ANY($1)
       ORDER BY c.relname, indexdef`,
    [CATALOG_TABLES],
  );
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 12);
}

async function main() {
  const commit = execSync('git rev-parse HEAD').toString().trim();
  const short = commit.slice(0, 12);

  const { entries, catalog_hash } = await withClient(async (client) => {
    const ch = await catalogHash(client);
    const results = [];
    for (const q of QUERIES) {
      const runs: any[] = [];
      for (let i = 0; i < 4; i++) {
        const { rows } = await client.query(
          `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${q.sql}`,
        );
        runs.push(rows[0]['QUERY PLAN'][0]);
      }
      const samples = runs.slice(1);
      samples.sort(
        (a, b) => (a['Execution Time'] as number) - (b['Execution Time'] as number),
      );
      const median = samples[Math.floor(samples.length / 2)];
      results.push({
        name: q.name,
        total_cost: median.Plan['Total Cost'],
        execution_ms: median['Execution Time'],
        planning_ms: median['Planning Time'],
        signature: signature(median),
        plan: median, // preserva plano completo para diff em página de docs
      });
    }
    return { entries: results, catalog_hash: ch };
  });

  const dir = ENV_NAME
    ? join(process.cwd(), 'docs', 'perf-baselines', ENV_NAME)
    : join(process.cwd(), 'docs', 'perf-baselines');
  mkdirSync(dir, { recursive: true });

  const payload = {
    commit,
    env: ENV_NAME || null,
    generated_at: new Date().toISOString(),
    node_version: process.version,
    catalog_hash,
    entries,
  };
  writeFileSync(join(dir, `${short}.json`), JSON.stringify(payload, null, 2));
  writeFileSync(join(dir, 'latest.json'), JSON.stringify(payload, null, 2));
  console.log(
    `[baseline] gravado ${ENV_NAME ? ENV_NAME + '/' : ''}${short}.json ` +
      `(catalog_hash=${catalog_hash})`,
  );
  console.table(
    entries.map(({ plan: _p, ...rest }) => rest),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
