/**
 * Sprint B — Benchmark de carga (config-driven, multi-ambiente)
 * ---------------------------------------------------------------
 * Lê docs/perf-benchmark.config.yaml e roda o perfil do ambiente
 * escolhido (`--env=ci|staging|production_mirror`). O snapshot
 * resultante inclui o hash da config + o ambiente, para que
 * revalidações só comparem corridas equivalentes.
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     bunx tsx scripts/perf-benchmark-app-metrics.ts \
 *       --env=staging \
 *       --config=docs/perf-benchmark.config.yaml \
 *       --baseline=docs/perf-baselines/staging/bench-latest.json \
 *       --out=.perf/run.json
 *
 * Retrocompat: sem --config e --env, cai no perfil default (staging).
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';

type MixItem = {
  id: string;
  weight: number;
  target: 'app_metrics' | 'user_management_stats';
  op: 'window' | 'latest' | 'page';
  params: Record<string, number>;
};
type Config = {
  version: number;
  mix: MixItem[];
  min_samples_per_endpoint?: number;
  environments: Record<
    string,
    {
      concurrency: number;
      duration_s: number;
      regression_p95_pct: number;
      min_samples_per_endpoint?: number;
      mix_overrides?: Record<string, number>;
    }
  >;
};
type Sample = { name: string; ms: number; ok: boolean };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[bench] faltam VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY');
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

const CONFIG_PATH = String(args.config ?? 'docs/perf-benchmark.config.yaml');
const ENV_NAME = String(args.env ?? process.env.BENCH_ENV ?? 'staging');

let config: Config | null = null;
let configHash: string | null = null;
if (existsSync(CONFIG_PATH)) {
  const raw = readFileSync(CONFIG_PATH, 'utf8');
  config = yaml.load(raw) as Config;
  configHash = createHash('sha256').update(raw).digest('hex').slice(0, 12);
}

const envCfg = config?.environments?.[ENV_NAME];
if (config && !envCfg) {
  console.error(`[bench] ambiente "${ENV_NAME}" não existe em ${CONFIG_PATH}`);
  process.exit(2);
}

const CONCURRENCY = Number(
  process.env.BENCH_CONCURRENCY ?? envCfg?.concurrency ?? 10,
);
const DURATION_S = Number(
  process.env.BENCH_DURATION_S ?? envCfg?.duration_s ?? 20,
);
const REGRESSION_PCT = Number(
  args['regression-pct'] ?? envCfg?.regression_p95_pct ?? 20,
);
const MIN_SAMPLES =
  envCfg?.min_samples_per_endpoint ?? config?.min_samples_per_endpoint ?? 0;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const iso = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/** Constrói a chamada Supabase equivalente a um MixItem. Não altera contratos. */
function runFor(item: MixItem): () => Promise<void> {
  if (item.target === 'app_metrics' && item.op === 'window') {
    return async () => {
      const { error } = await supabase
        .from('app_metrics')
        .select('metric_type, created_at')
        .gte('created_at', iso(item.params.days ?? 30))
        .limit(item.params.limit ?? 5000);
      if (error) throw error;
    };
  }
  if (item.target === 'app_metrics' && item.op === 'latest') {
    return async () => {
      const { error } = await supabase
        .from('app_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(item.params.limit ?? 100);
      if (error) throw error;
    };
  }
  if (item.target === 'user_management_stats' && item.op === 'page') {
    return async () => {
      const { error } = await supabase
        .from('user_management_stats')
        .select(
          'id, email, classification, reflections_count, current_journey, last_activity',
        )
        .range(item.params.from ?? 0, item.params.to ?? 19);
      if (error) throw error;
    };
  }
  throw new Error(`mix não suportado: ${item.target}:${item.op}`);
}

/** Aplica overrides do ambiente aos pesos do mix e descarta weight=0. */
function resolveMix(): Array<MixItem & { run: () => Promise<void> }> {
  const base = config?.mix ?? DEFAULT_MIX;
  const overrides = envCfg?.mix_overrides ?? {};
  return base
    .map((m) => ({ ...m, weight: overrides[m.id] ?? m.weight }))
    .filter((m) => m.weight > 0)
    .map((m) => ({ ...m, run: runFor(m) }));
}

/** Mix default para retrocompat quando não há config. */
const DEFAULT_MIX: MixItem[] = [
  { id: 'app_metrics:window30d', weight: 40, target: 'app_metrics', op: 'window', params: { days: 30, limit: 5000 } },
  { id: 'app_metrics:latest100', weight: 20, target: 'app_metrics', op: 'latest', params: { limit: 100 } },
  { id: 'user_management_stats:page0', weight: 25, target: 'user_management_stats', op: 'page', params: { from: 0, to: 19 } },
  { id: 'user_management_stats:page5', weight: 15, target: 'user_management_stats', op: 'page', params: { from: 100, to: 119 } },
];

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function worker(
  samples: Sample[],
  stopAt: number,
  mix: ReturnType<typeof resolveMix>,
) {
  const total = mix.reduce((s, m) => s + m.weight, 0);
  while (Date.now() < stopAt) {
    let r = Math.random() * total;
    const item = mix.find((m) => (r -= m.weight) <= 0) ?? mix[0];
    const t0 = performance.now();
    let ok = true;
    try {
      await item.run();
    } catch {
      ok = false;
    }
    samples.push({ name: item.id, ms: performance.now() - t0, ok });
  }
}

async function main() {
  const mix = resolveMix();
  console.log(
    `[bench] env=${ENV_NAME} conc=${CONCURRENCY} dur=${DURATION_S}s ` +
      `configHash=${configHash ?? '(none)'} regressionPct=${REGRESSION_PCT}`,
  );
  console.log(
    '[bench] mix:',
    mix.map((m) => `${m.id}(${m.weight})`).join(', '),
  );

  const samples: Sample[] = [];
  const stopAt = Date.now() + DURATION_S * 1000;
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker(samples, stopAt, mix)),
  );
  const elapsed = (performance.now() - t0) / 1000;

  const byName = new Map<string, Sample[]>();
  for (const s of samples) {
    const arr = byName.get(s.name) ?? [];
    arr.push(s);
    byName.set(s.name, arr);
  }

  const per_endpoint = [...byName.entries()].map(([name, arr]) => {
    const ok = arr.filter((s) => s.ok).map((s) => s.ms).sort((a, b) => a - b);
    return {
      name,
      count: arr.length,
      errors: arr.filter((s) => !s.ok).length,
      p50_ms: +pct(ok, 50).toFixed(2),
      p95_ms: +pct(ok, 95).toFixed(2),
      p99_ms: +pct(ok, 99).toFixed(2),
      max_ms: +(ok[ok.length - 1] ?? 0).toFixed(2),
      under_min_samples: ok.length < MIN_SAMPLES,
    };
  });

  const report = {
    started_at: new Date().toISOString(),
    env: ENV_NAME,
    config_hash: configHash,
    config_path: config ? CONFIG_PATH : null,
    concurrency: CONCURRENCY,
    duration_s: DURATION_S,
    regression_p95_pct: REGRESSION_PCT,
    min_samples_per_endpoint: MIN_SAMPLES,
    total_requests: samples.length,
    throughput_rps: +(samples.length / elapsed).toFixed(2),
    error_rate: +(
      (samples.filter((s) => !s.ok).length / Math.max(1, samples.length)) *
      100
    ).toFixed(3),
    per_endpoint,
  };

  console.table(per_endpoint);
  console.log(
    `[bench] throughput=${report.throughput_rps} req/s · err=${report.error_rate}%`,
  );

  if (args.out) {
    writeFileSync(String(args.out), JSON.stringify(report, null, 2));
    console.log(`[bench] gravado em ${args.out}`);
  }

  if (args.baseline && existsSync(String(args.baseline))) {
    const base = JSON.parse(readFileSync(String(args.baseline), 'utf8'));
    if (base.env && base.env !== ENV_NAME) {
      console.warn(
        `[bench] AVISO: baseline env=${base.env} ≠ ambiente atual=${ENV_NAME}. Comparação ignorada.`,
      );
    } else if (base.config_hash && configHash && base.config_hash !== configHash) {
      console.warn(
        `[bench] AVISO: config_hash divergente (${base.config_hash} vs ${configHash}). Comparação ignorada.`,
      );
    } else {
      const map = new Map<string, any>(
        (base.per_endpoint ?? []).map((e: any) => [e.name, e]),
      );
      const regressions: string[] = [];
      for (const cur of report.per_endpoint) {
        const b = map.get(cur.name);
        if (!b) continue;
        const delta = ((cur.p95_ms - b.p95_ms) / Math.max(1, b.p95_ms)) * 100;
        if (delta > REGRESSION_PCT) {
          regressions.push(
            `${cur.name}: p95 ${b.p95_ms}ms → ${cur.p95_ms}ms (+${delta.toFixed(1)}%)`,
          );
        }
      }
      if (regressions.length) {
        console.error(
          `[bench] REGRESSÕES (>${REGRESSION_PCT}%):\n  - ` +
            regressions.join('\n  - '),
        );
        process.exit(1);
      }
      console.log(`[bench] sem regressão >${REGRESSION_PCT}% vs baseline.`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
