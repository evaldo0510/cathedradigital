/**
 * Sprint B — Baseline snapshot versionado por commit
 * ---------------------------------------------------------------
 * Captura, para cada query crítica de B2, uma amostra de
 * `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` e grava:
 *
 *   docs/perf-baselines/<git-sha>.json
 *   docs/perf-baselines/latest.json     (symlink lógico: cópia)
 *
 * Formato estável: { commit, generated_at, node_version, entries: [...] }
 *
 * Uso:
 *   PG_URL=postgres://... PERF_BASELINE=1 \
 *     bunx tsx scripts/perf-baseline-snapshot.ts
 *
 * Revalidação (após mudança de schema/estatísticas):
 *   bunx tsx scripts/perf-baseline-revalidate.ts
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PG_URL =
  process.env.PG_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  '';

if (!PG_URL || process.env.PERF_BASELINE !== '1') {
  console.error(
    '[baseline] requer PG_URL + PERF_BASELINE=1 (opt-in explícito).',
  );
  process.exit(2);
}

/** Mantém em sincronia com scripts/perf-regression-guard.test.ts. */
const QUERIES: Array<{ name: string; sql: string }> = [
  {
    name: 'app_metrics:window30d',
    sql: `SELECT metric_type, created_at
          FROM public.app_metrics
          WHERE created_at >= now() - interval '30 days'
          LIMIT 5000`,
  },
  {
    name: 'app_metrics:latest100',
    sql: `SELECT *
          FROM public.app_metrics
          ORDER BY created_at DESC
          LIMIT 100`,
  },
  {
    name: 'get_latest_journey_title',
    sql: `SELECT j.title
          FROM public.journey_progress jp
          JOIN public.journeys j ON jp.journey_id = j.id
          WHERE jp.user_id = (SELECT id FROM public.profiles LIMIT 1)
          ORDER BY jp.completed_at DESC NULLS LAST
          LIMIT 1`,
  },
];

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
      if (n['Sort Key']) parts.push(`sort=${(n['Sort Key'] as string[]).join(',')}`);
      return parts.join(' ');
    })
    .join(' | ');
}

async function main() {
  const commit = execSync('git rev-parse HEAD').toString().trim();
  const short = commit.slice(0, 12);
  const entries = [];

  for (const q of QUERIES) {
    // Warm + amostra: descartamos a primeira, ficamos com a mediana de 3.
    const runs: any[] = [];
    for (let i = 0; i < 4; i++) runs.push(await explain(q.sql));
    const samples = runs.slice(1);
    samples.sort(
      (a, b) => (a['Execution Time'] as number) - (b['Execution Time'] as number),
    );
    const median = samples[Math.floor(samples.length / 2)];
    entries.push({
      name: q.name,
      total_cost: median.Plan['Total Cost'],
      execution_ms: median['Execution Time'],
      planning_ms: median['Planning Time'],
      signature: signature(median),
    });
  }

  const dir = join(process.cwd(), 'docs', 'perf-baselines');
  mkdirSync(dir, { recursive: true });
  const payload = {
    commit,
    generated_at: new Date().toISOString(),
    node_version: process.version,
    entries,
  };
  writeFileSync(join(dir, `${short}.json`), JSON.stringify(payload, null, 2));
  writeFileSync(join(dir, 'latest.json'), JSON.stringify(payload, null, 2));
  console.log(`[baseline] gravado docs/perf-baselines/${short}.json`);
  console.table(entries);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
