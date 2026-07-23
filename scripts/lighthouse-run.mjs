#!/usr/bin/env node
/**
 * Orquestra: autentica (ou pula) → LHCI collect+assert para mobile e tablet.
 *
 * Variáveis:
 *   LH_BASE_URL   — URL base (default http://localhost:8080).
 *                   Aceita staging/prod (ex.: https://cathedradigital.com.br).
 *   LH_ROUTES     — CSV de rotas relativas (default "/profile").
 *                   Ex.: "/profile,/atrium,/pricing"
 *   LH_ALLOW_UNAUTH=1 — não falha se credenciais ausentes.
 *   LH_ENV        — rótulo do ambiente (local|staging|production) para o summary.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.LH_BASE_URL || 'http://localhost:8080';
const ROUTES = (process.env.LH_ROUTES || '/profile').split(',').map((r) => r.trim()).filter(Boolean);
const ENV_LABEL = process.env.LH_ENV || (BASE_URL.includes('localhost') ? 'local' : 'remote');
const CONFIGS = [
  { name: 'mobile', config: 'lighthouserc.mobile.cjs' },
  { name: 'tablet', config: 'lighthouserc.tablet.cjs' },
];

const run = (cmd, args, opts = {}) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, LH_BASE_URL: BASE_URL, LH_ROUTES: ROUTES.join(',') },
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// 1. Autentica (gera .lighthouseci/storage-state/session.json ou marca unauth)
run('bun', ['run', 'scripts/lighthouse-authenticate.ts']);

// 2. Roda LHCI mobile + tablet
const summary = {
  commit: process.env.GITHUB_SHA || 'local',
  env: ENV_LABEL,
  baseUrl: BASE_URL,
  routes: ROUTES,
  runs: [],
};
for (const { name, config } of CONFIGS) {
  console.log(`\n═══ Lighthouse ${name} (${ENV_LABEL}) ═══`);
  const outDir = `.lighthouseci/${name}`;
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  run('bunx', ['@lhci/cli', 'collect', `--config=${config}`], {});
  const defaultDir = '.lighthouseci';
  const files = fs.readdirSync(defaultDir).filter((f) => f.endsWith('.json') && !f.includes('/'));
  for (const f of files) fs.renameSync(path.join(defaultDir, f), path.join(outDir, f));

  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  const median = manifest.find((m) => m.isRepresentativeRun) || manifest[0];
  const report = JSON.parse(fs.readFileSync(median.jsonPath.replace(defaultDir, outDir), 'utf8'));
  const audits = report.audits;
  summary.runs.push({
    device: name,
    url: report.finalUrl || report.requestedUrl,
    performance: report.categories.performance.score,
    lcp: audits['largest-contentful-paint'].numericValue,
    cls: audits['cumulative-layout-shift'].numericValue,
    tbt: audits['total-blocking-time'].numericValue,
    inp: audits['interaction-to-next-paint']?.numericValue ?? null,
    fcp: audits['first-contentful-paint'].numericValue,
    si: audits['speed-index'].numericValue,
    tti: audits['interactive'].numericValue,
  });

  run('bunx', ['@lhci/cli', 'assert', `--config=${config}`]);
}

fs.writeFileSync('.lighthouseci/summary.json', JSON.stringify(summary, null, 2));
console.log(`\n✅ Lighthouse concluído (${ENV_LABEL}). Resumo:`);
console.table(summary.runs);
