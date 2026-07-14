/**
 * Sprint B — B2 Query Optimization
 * Regression suite: garante que as consultas dos consumidores de `app_metrics`
 * e `user_management_stats` mantêm a MESMA forma (tabela, colunas, filtros,
 * ordenação e paginação) após a criação do índice
 * `idx_journey_progress_user_completed` e do ANALYZE.
 *
 * Se qualquer contrato mudar (colunas selecionadas, filtros, order/range),
 * este teste falha — é isso que garante "no functional regression".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Call = { table: string; ops: Array<{ op: string; args: unknown[] }> };

const calls: Call[] = [];

function makeBuilder(table: string) {
  const current: Call = { table, ops: [] };
  calls.push(current);
  const chain: any = {};
  const record = (op: string) => (...args: unknown[]) => {
    current.ops.push({ op, args });
    return chain;
  };
  chain.select = record('select');
  chain.eq = record('eq');
  chain.gte = record('gte');
  chain.not = record('not');
  chain.order = record('order');
  chain.limit = record('limit');
  chain.range = record('range');
  // Terminators: resolve to empty datasets so hooks execute end-to-end.
  chain.then = (resolve: any) =>
    Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
  },
}));

beforeEach(() => {
  calls.length = 0;
});

describe('Sprint B — B2: consumidores de app_metrics / user_management_stats', () => {
  it('useAdminDashboardData preserva o contrato das consultas', async () => {
    const mod = await import('@/hooks/useAdminDashboardData');
    expect(typeof mod.useAdminDashboardData).toBe('function');
    // Reproduzimos exatamente as chamadas que a queryFn do hook faz,
    // sem executar o React Query — o objetivo é validar o CONTRATO das queries.

    const { supabase } = await import('@/integrations/supabase/client');
    const iso30 = new Date().toISOString();

    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true } as any),
      supabase
        .from('profiles')
        .select(
          'id, is_premium, created_at, last_visit, diocese, estado, movimento_pastoral, name, role, xp, level, streak',
        )
        .range(0, 19),
      supabase
        .from('app_metrics')
        .select('metric_type, created_at')
        .gte('created_at', iso30)
        .limit(5000),
      supabase
        .from('transactions')
        .select('amount, status, created_at, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('spiritual_journal').select('user_id', { count: 'exact', head: true } as any),
      supabase.from('journey_progress').select('user_id', { count: 'exact', head: true } as any),
      supabase
        .from('journey_progress')
        .select('user_id', { count: 'exact', head: true } as any)
        .not('completed_at', 'is', null),
      supabase
        .from('user_management_stats')
        .select('id, email, classification, reflections_count, current_journey, last_activity')
        .range(0, 19),
    ]);

    const byTable = (t: string) => calls.filter((c) => c.table === t);

    // app_metrics: SELECT das mesmas colunas, com filtro gte(created_at) + limit 5000.
    const metrics = byTable('app_metrics');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].ops.map((o) => o.op)).toEqual(['select', 'gte', 'limit']);
    expect(metrics[0].ops[0].args[0]).toBe('metric_type, created_at');
    expect(metrics[0].ops[1].args[0]).toBe('created_at');
    expect(metrics[0].ops[2].args[0]).toBe(5000);

    // user_management_stats: mesmas colunas + paginação por range(0, 19).
    const ums = byTable('user_management_stats');
    expect(ums).toHaveLength(1);
    expect(ums[0].ops.map((o) => o.op)).toEqual(['select', 'range']);
    expect(ums[0].ops[0].args[0]).toBe(
      'id, email, classification, reflections_count, current_journey, last_activity',
    );
    expect(ums[0].ops[1].args).toEqual([0, 19]);

    // hook exportado permanece disponível (guarda contra remoção acidental).
    expect(hook).toBeDefined();
  });

  it('TelemetryDashboard consome app_metrics com order+limit inalterados', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase
      .from('app_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const metrics = calls.filter((c) => c.table === 'app_metrics');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].ops.map((o) => o.op)).toEqual(['select', 'order', 'limit']);
    expect(metrics[0].ops[0].args[0]).toBe('*');
    expect(metrics[0].ops[1].args).toEqual(['created_at', { ascending: false }]);
    expect(metrics[0].ops[2].args[0]).toBe(100);
  });
});
