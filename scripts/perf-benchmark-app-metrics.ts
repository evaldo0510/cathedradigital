/**
 * Sprint B — B2 Load Benchmark
 * ---------------------------------------------------------------
 * Simula tráfego real dos consumidores das queries otimizadas:
 *   - app_metrics (dashboard + telemetria)
 *   - user_management_stats (painel admin)
 *
 * Roda N clientes concorrentes durante T segundos, distribuindo
 * as chamadas conforme o mix observado em produção, e reporta:
 *   - throughput (req/s)   - p50 / p95 / p99 / max
 *   - erros por endpoint   - degradação vs baseline (se fornecido)
 *
 * Não altera comportamento funcional: só executa SELECT via
 * cliente Supabase, exatamente com os mesmos contratos do app.
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *   BENCH_CONCURRENCY=20 BENCH_DURATION_S=30 \
 *   bunx tsx scripts/perf-benchmark-app-metrics.ts \
 *     --baseline=docs/perf-baseline.json --out=docs/perf-run.json
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

type Mix = { name: string; weight: number; run: () => Promise<void> };
type Sample = { name: string; ms: number; ok: boolean };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '[bench] faltam VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY',
  );
  process.exit(2);
}

const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY ?? 10);
const DURATION_S = Number(process.env.BENCH_DURATION_S ?? 20);
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const iso30 = () =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

/** Mix baseado em pg_stat_statements (v2 baseline, top 6 queries). */
const MIX: Mix[] = [
  {
    name: 'app_metrics:window30d',
    weight: 40,
    run: async () => {
      const { error } = await supabase
        .from('app_metrics')
        .select('metric_type, created_at')
        .gte('created_at', iso30())
        .limit(5000);
      if (error) throw error;
    },
  },
  {
    name: 'app_metrics:latest100',
    weight: 20,
    run: async () => {
      const { error } = await supabase
        .from('app_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
    },
  },
  {
    name: 'user_management_stats:page0',
    weight: 25,
    run: async () => {
      const { error } = await supabase
        .from('user_management_stats')
        .select(
          'id, email, classification, reflections_count, current_journey, last_activity',
        )
        .range(0, 19);
      if (error) throw error;
    },
  },
  {
    name: 'user_management_stats:page5',
    weight: 15,
    run: async () => {
      const { error } = await supabase
        .from('user_management_stats')
        .select(
          'id, email, classification, reflections_count, current_journey, last_activity',
        )
        .range(100, 119);
      if (error) throw error;
    },
  },
];

function pick(): Mix {
  const total = MIX.reduce((s, m) => s + m.weight, 0);
  let r = Math.random() * total;
  for (const m of MIX) if ((r -= m.weight) <= 0) return m;
  return MIX[0];
}

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function worker(samples: Sample[], stopAt: number) {
  while (Date.now() < stopAt) {
    const m = pick();
    const t0 = performance.now();
    let ok = true;
    try {
      await m.run();
    } catch {
      ok = false;
    }
    samples.push({ name: m.name, ms: performance.now() - t0, ok });
  }
}

async function main() {
  const samples: Sample[] = [];
  const stopAt = Date.now() + DURATION_S * 1000;
  console.log(
    `[bench] iniciando: conc=${CONCURRENCY} dur=${DURATION_S}s url=${SUPABASE_URL}`,
  );
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker(samples, stopAt)),
  );
  const elapsed = (performance.now() - t0) / 1000;

  const byName = new Map<string, Sample[]>();
  for (const s of samples) {
    const arr = byName.get(s.name) ?? [];
    arr.push(s);
    byName.set(s.name, arr);
  }

  const report = {
    started_at: new Date().toISOString(),
    concurrency: CONCURRENCY,
    duration_s: DURATION_S,
    total_requests: samples.length,
    throughput_rps: +(samples.length / elapsed).toFixed(2),
    error_rate: +(
      (samples.filter((s) => !s.ok).length / Math.max(1, samples.length)) *
      100
    ).toFixed(3),
    per_endpoint: [...byName.entries()].map(([name, arr]) => {
      const ok = arr.filter((s) => s.ok).map((s) => s.ms).sort((a, b) => a - b);
      return {
        name,
        count: arr.length,
        errors: arr.filter((s) => !s.ok).length,
        p50_ms: +pct(ok, 50).toFixed(2),
        p95_ms: +pct(ok, 95).toFixed(2),
        p99_ms: +pct(ok, 99).toFixed(2),
        max_ms: +(ok[ok.length - 1] ?? 0).toFixed(2),
      };
    }),
  };

  console.table(report.per_endpoint);
  console.log(
    `[bench] throughput=${report.throughput_rps} req/s · err=${report.error_rate}%`,
  );

  if (args.out) {
    writeFileSync(String(args.out), JSON.stringify(report, null, 2));
    console.log(`[bench] gravado em ${args.out}`);
  }

  if (args.baseline && existsSync(String(args.baseline))) {
    const base = JSON.parse(readFileSync(String(args.baseline), 'utf8'));
    const map = new Map<string, any>(
      (base.per_endpoint ?? []).map((e: any) => [e.name, e]),
    );
    const regressions: string[] = [];
    for (const cur of report.per_endpoint) {
      const b = map.get(cur.name);
      if (!b) continue;
      const delta = ((cur.p95_ms - b.p95_ms) / Math.max(1, b.p95_ms)) * 100;
      if (delta > 20) {
        regressions.push(
          `${cur.name}: p95 ${b.p95_ms}ms → ${cur.p95_ms}ms (+${delta.toFixed(1)}%)`,
        );
      }
    }
    if (regressions.length) {
      console.error('[bench] REGRESSÕES:\n  - ' + regressions.join('\n  - '));
      process.exit(1);
    }
    console.log('[bench] sem regressão >20% vs baseline.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
