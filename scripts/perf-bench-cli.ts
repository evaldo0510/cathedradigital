#!/usr/bin/env bunx tsx
/**
 * Sprint B — CLI de benchmark focado
 * ---------------------------------------------------------------
 * Wrapper de `perf-benchmark-app-metrics.ts` para investigação
 * rápida: revalida apenas UM subconjunto de endpoints do mix já
 * definido em `docs/perf-benchmark.config.yaml`, aplicando
 * `mix_overrides` inline via `--only=` / `--mix=`, e gerando o
 * diff Markdown+JSON automaticamente.
 *
 * Uso:
 *   # só um endpoint, mix 100%, comparado com baseline de staging
 *   bunx tsx scripts/perf-bench-cli.ts \
 *     --env=staging \
 *     --only=app_metrics:window30d
 *
 *   # dois endpoints com pesos custom
 *   bunx tsx scripts/perf-bench-cli.ts \
 *     --env=staging \
 *     --mix='app_metrics:window30d=70,user_management_stats:page0=30'
 *
 *   # sem baseline (só medir)
 *   bunx tsx scripts/perf-bench-cli.ts --env=ci --only=app_metrics:latest100 --no-diff
 *
 * O CLI não duplica lógica: gera uma config derivada em .perf/tmp-config.yaml
 * e delega para o benchmark canônico + o script de diff.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
);

const envName = String(args.env ?? 'staging');
const baseConfigPath = String(args.config ?? 'docs/perf-benchmark.config.yaml');
const skipDiff = args['no-diff'] === 'true' || args['no-diff'] === true;
const outDir = String(args['out-dir'] ?? '.perf');

if (!existsSync(baseConfigPath)) {
  console.error(`[cli] config não encontrada: ${baseConfigPath}`);
  process.exit(2);
}

const cfg: any = yaml.load(readFileSync(baseConfigPath, 'utf8'));
if (!cfg.environments?.[envName]) {
  console.error(`[cli] ambiente "${envName}" ausente em ${baseConfigPath}`);
  process.exit(2);
}

// -------- deriva mix_overrides ----------
const knownIds = new Set<string>(cfg.mix.map((m: any) => m.id));
const overrides: Record<string, number> = {};

if (args.only) {
  const wanted = String(args.only).split(',').map((s) => s.trim()).filter(Boolean);
  const bad = wanted.filter((w) => !knownIds.has(w));
  if (bad.length) {
    console.error(`[cli] endpoint(s) desconhecido(s): ${bad.join(', ')}`);
    console.error(`      válidos: ${[...knownIds].join(', ')}`);
    process.exit(2);
  }
  for (const id of knownIds) overrides[id] = wanted.includes(id) ? 100 : 0;
} else if (args.mix) {
  // Formato: "id1=peso,id2=peso"
  const parts = String(args.mix).split(',').map((p) => p.trim()).filter(Boolean);
  for (const id of knownIds) overrides[id] = 0;
  for (const p of parts) {
    const [id, w] = p.split('=');
    if (!knownIds.has(id)) {
      console.error(`[cli] endpoint "${id}" não existe no mix base.`);
      process.exit(2);
    }
    overrides[id] = Number(w);
  }
}

// Merge com overrides pré-existentes do ambiente (sem apagar o que já tinha).
const envCfg = cfg.environments[envName];
const finalOverrides = { ...(envCfg.mix_overrides ?? {}), ...overrides };
if (args.concurrency) envCfg.concurrency = Number(args.concurrency);
if (args.duration) envCfg.duration_s = Number(args.duration);
envCfg.mix_overrides = finalOverrides;

mkdirSync(outDir, { recursive: true });
const derivedPath = `${outDir}/tmp-config.yaml`;
writeFileSync(derivedPath, yaml.dump(cfg));
console.log(`[cli] config derivada em ${derivedPath}`);
console.log('[cli] mix efetivo:',
  Object.entries(finalOverrides).filter(([_, w]) => (w as number) > 0)
    .map(([id, w]) => `${id}=${w}`).join(', ') || '(padrão do env)');

// -------- roda benchmark ----------
const runOut = `${outDir}/run.json`;
const baselinePath = args.baseline
  ? String(args.baseline)
  : `docs/perf-baselines/${envName}/bench-latest.json`;

const bench = spawnSync('bunx', [
  'tsx', 'scripts/perf-benchmark-app-metrics.ts',
  `--env=${envName}`,
  `--config=${derivedPath}`,
  `--baseline=${baselinePath}`,
  `--out=${runOut}`,
], { stdio: 'inherit' });

if (bench.status !== 0 && bench.status !== 1) {
  // 1 = regressão relatada (esperada); >1 = erro real
  process.exit(bench.status ?? 1);
}

// -------- diff opcional ----------
if (!skipDiff) {
  const currentSnap = args['current-snapshot']
    ? String(args['current-snapshot'])
    : `docs/perf-baselines/${envName}/latest.json`;
  const baseSnap = args['baseline-snapshot']
    ? String(args['baseline-snapshot'])
    : `docs/perf-baselines/${envName}/latest.json`;

  if (!existsSync(currentSnap) || !existsSync(baseSnap)) {
    console.log('[cli] sem snapshots EXPLAIN para diff — pulando.');
  } else {
    const diff = spawnSync('bunx', [
      'tsx', 'scripts/perf-baseline-diff-report.ts',
      `--baseline=${baseSnap}`,
      `--current=${currentSnap}`,
      `--out=${outDir}/diff.md`,
      `--json=${outDir}/diff.json`,
    ], { stdio: 'inherit' });
    if (diff.status !== 0 && diff.status !== 1) process.exit(diff.status ?? 1);
  }
}

process.exit(bench.status ?? 0);
