/**
 * Sprint B — B2 Regression Guard (EXPLAIN ANALYZE)
 * ---------------------------------------------------------------
 * Roda `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` nas queries críticas
 * otimizadas em B2 e FALHA se:
 *   - o custo total ultrapassar o teto definido em BUDGETS, ou
 *   - o Execution Time ultrapassar o teto (ms), ou
 *   - a assinatura de plano mudar (índice esperado sumir / aparecer `Sort`).
 *
 * Sem credenciais de banco, o teste é marcado como `skipped` — nunca
 * causa falso positivo em CI que roda apenas em preview.
 *
 * Como executar contra o banco real (localmente):
 *   PG_URL=postgres://... bunx vitest run scripts/perf-regression-guard.test.ts
 */
import { describe, it, expect } from 'vitest';

const PG_URL =
  process.env.PG_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  '';

const RUN = !!PG_URL;

/**
 * Orçamentos de performance. Valores absolutos ficam folgados vs. o observado
 * em `PERFORMANCE-BASELINE-v2.md` para absorver variação de warm-up e IO;
 * o objetivo do guard é pegar REGRESSÕES ESTRUTURAIS (Sort surgindo, índice
 * sumindo, cost saltando 5-10x), não flutuação de ambiente.
 */
type Budget = {
  name: string;
  sql: string;
  maxTotalCost: number;
  maxExecutionMs: number;
  mustUseIndex?: string;
  mustNotContain?: string[];
};

const BUDGETS: Budget[] = [
  {
    name: 'app_metrics:window30d',
    sql: `SELECT metric_type, created_at
          FROM public.app_metrics
          WHERE created_at >= now() - interval '30 days'
          LIMIT 5000`,
    maxTotalCost: 200,
    maxExecutionMs: 100,
    mustUseIndex: 'idx_app_metrics_created_at',
    mustNotContain: ['Seq Scan on app_metrics'],
  },
  {
    name: 'app_metrics:latest100',
    sql: `SELECT *
          FROM public.app_metrics
          ORDER BY created_at DESC
          LIMIT 100`,
    maxTotalCost: 100,
    maxExecutionMs: 100,
    mustUseIndex: 'idx_app_metrics_created_at',
    mustNotContain: ['Seq Scan on app_metrics', 'Sort Key: created_at'],
  },
  {
    name: 'get_latest_journey_title',
    // Reproduz o corpo da função para poder rodar EXPLAIN direto.
    sql: `SELECT j.title
          FROM public.journey_progress jp
          JOIN public.journeys j ON jp.journey_id = j.id
          WHERE jp.user_id = (SELECT id FROM public.profiles LIMIT 1)
          ORDER BY jp.completed_at DESC NULLS LAST
          LIMIT 1`,
    maxTotalCost: 25,
    maxExecutionMs: 50,
    mustUseIndex: 'idx_journey_progress_user_completed',
    mustNotContain: ['Sort Key: jp.completed_at'],
  },
];

async function explain(sql: string): Promise<any> {
  // Import dinâmico para não exigir 'pg' quando o teste é skipado.
  const { Client } = await import('pg');
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

function flattenPlan(node: any, acc: any[] = []): any[] {
  acc.push(node);
  for (const child of node.Plans ?? []) flattenPlan(child, acc);
  return acc;
}

function planText(node: any): string {
  return flattenPlan(node)
    .map((n) => {
      const idx = n['Index Name'] ? ` using ${n['Index Name']}` : '';
      const sortKey = n['Sort Key']
        ? ` (Sort Key: ${(n['Sort Key'] as string[]).join(', ')})`
        : '';
      const rel = n['Relation Name'] ? ` on ${n['Relation Name']}` : '';
      return `${n['Node Type']}${idx}${rel}${sortKey}`;
    })
    .join(' | ');
}

describe.skipIf(!RUN)('Sprint B — B2 EXPLAIN ANALYZE guard', () => {
  for (const b of BUDGETS) {
    it(`${b.name} dentro do orçamento`, async () => {
      const plan = await explain(b.sql);
      const root = plan.Plan;
      const nodes = flattenPlan(root);
      const text = planText(root);

      // 1) Custo total do plano.
      expect(root['Total Cost'], `plano: ${text}`).toBeLessThan(b.maxTotalCost);

      // 2) Tempo de execução real.
      expect(plan['Execution Time'], `plano: ${text}`).toBeLessThan(
        b.maxExecutionMs,
      );

      // 3) Índice esperado presente.
      if (b.mustUseIndex) {
        const usesIndex = nodes.some((n) => n['Index Name'] === b.mustUseIndex);
        expect(usesIndex, `esperava índice ${b.mustUseIndex}; plano: ${text}`)
          .toBe(true);
      }

      // 4) Nós proibidos ausentes (Seq Scan, Sort específico).
      for (const forbidden of b.mustNotContain ?? []) {
        expect(text.includes(forbidden), `plano contém proibido "${forbidden}": ${text}`)
          .toBe(false);
      }
    });
  }
});

describe.skipIf(RUN)('Sprint B — B2 EXPLAIN ANALYZE guard (skipped: sem PG_URL)', () => {
  it('define PG_URL para executar o guard contra o banco', () => {
    expect(true).toBe(true);
  });
});
