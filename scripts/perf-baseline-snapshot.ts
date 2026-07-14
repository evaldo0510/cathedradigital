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

/**
 * Captura versão do PG + parâmetros que afetam plano/latência.
 * Sem estes valores, comparações entre ambientes são enganosas
 * (ex.: `work_mem` diferente muda escolha de Hash vs. Merge Join).
 */
async function pgEnvironment(client: any) {
  const { rows: ver } = await client.query('SHOW server_version');
  const params = [
    'work_mem',
    'shared_buffers',
    'max_parallel_workers',
    'max_parallel_workers_per_gather',
    'effective_cache_size',
    'random_page_cost',
    'jit',
    'jit_above_cost',
    'default_statistics_target',
  ];
  const { rows: settings } = await client.query(
    `SELECT name, setting, unit FROM pg_settings WHERE name = ANY($1)`,
    [params],
  );
  const map: Record<string, string> = {};
  for (const s of settings) map[s.name] = s.unit ? `${s.setting} ${s.unit}` : s.setting;
  return { server_version: ver[0].server_version, settings: map };
}

/** Snapshot de I/O do banco (proxy para cache hit ratio da corrida). */
async function ioSnapshot(client: any) {
  const { rows } = await client.query(
    `SELECT sum(blks_hit)::bigint  AS blks_hit,
            sum(blks_read)::bigint AS blks_read
       FROM pg_stat_database
      WHERE datname = current_database()`,
  );
  return { blks_hit: Number(rows[0].blks_hit), blks_read: Number(rows[0].blks_read) };
}

/**
 * "Reset" pragmático de cache entre corridas:
 *   - DISCARD ALL zera plano cache/temp da sessão (sem privilégio).
 *   - pg_prewarm (se extensão instalada) recarrega tabelas alvo em
 *     shared_buffers, uniformizando ponto de partida entre corridas.
 * NÃO é reset real de shared_buffers — isso exigiria restart.
 */
async function resetAndWarm(client: any) {
  await client.query('DISCARD ALL');
  try {
    const { rows } = await client.query(
      `SELECT 1 FROM pg_extension WHERE extname = 'pg_prewarm'`,
    );
    if (rows.length) {
      for (const t of CATALOG_TABLES) {
        try {
          await client.query(`SELECT pg_prewarm($1::regclass)`, [`public.${t}`]);
        } catch { /* ignore per-table */ }
      }
      return { pg_prewarm: true, tables_warmed: CATALOG_TABLES };
    }
  } catch { /* extensão ausente */ }
  return { pg_prewarm: false, tables_warmed: [] };
}

async function main() {
  const commit = execSync('git rev-parse HEAD').toString().trim();
  const short = commit.slice(0, 12);

  const { entries, catalog_hash, pg_env, warmup, cache_stats } = await withClient(async (client) => {
    const ch = await catalogHash(client);
    const env = await pgEnvironment(client);
    const warm = await resetAndWarm(client);

    // Warm-up explícito: rodamos cada query 1× antes de medir (descarta),
    // para uniformizar plan cache e evitar penalizar a primeira query.
    for (const q of QUERIES) {
      try { await client.query(q.sql); } catch { /* warm-up best-effort */ }
    }

    const ioBefore = await ioSnapshot(client);
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
      // Buffers do próprio nó raiz do plano — reprodutibilidade de I/O.
      const root = median.Plan;
      results.push({
        name: q.name,
        total_cost: root['Total Cost'],
        execution_ms: median['Execution Time'],
        planning_ms: median['Planning Time'],
        signature: signature(median),
        shared_hit: root['Shared Hit Blocks'] ?? 0,
        shared_read: root['Shared Read Blocks'] ?? 0,
        plan: median,
      });
    }
    const ioAfter = await ioSnapshot(client);
    const hitDelta = ioAfter.blks_hit - ioBefore.blks_hit;
    const readDelta = ioAfter.blks_read - ioBefore.blks_read;
    const totalDelta = hitDelta + readDelta;
    return {
      entries: results,
      catalog_hash: ch,
      pg_env: env,
      warmup: warm,
      cache_stats: {
        blks_hit_delta: hitDelta,
        blks_read_delta: readDelta,
        cache_hit_ratio_pct:
          totalDelta > 0 ? +((hitDelta / totalDelta) * 100).toFixed(2) : null,
      },
    };
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
    pg_env,
    warmup,
    cache_stats,
    catalog_hash,
    entries,
  };
  writeFileSync(join(dir, `${short}.json`), JSON.stringify(payload, null, 2));
  writeFileSync(join(dir, 'latest.json'), JSON.stringify(payload, null, 2));
  console.log(
    `[baseline] ${ENV_NAME ? ENV_NAME + '/' : ''}${short}.json · pg=${pg_env.server_version} · ` +
      `catalog_hash=${catalog_hash} · cache_hit=${cache_stats.cache_hit_ratio_pct ?? '—'}%`,
  );
  console.table(
    entries.map(({ plan: _p, ...rest }) => rest),
  );
}



main().catch((e) => {
  console.error(e);
  process.exit(1);
});
