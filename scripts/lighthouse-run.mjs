#!/usr/bin/env node
/**
 * Orquestra: sobe dev server (se preciso) → autentica → LHCI collect+assert
 * para mobile e tablet. Uso local e no CI.
 *
 * Uso local:
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... npm run lh:profile:local
 *
 * Uso CI (dev server já rodando em $LH_BASE_URL):
 *   LH_BASE_URL=https://... npm run lh:profile:local
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.LH_BASE_URL || 'http://localhost:8080';
const CONFIGS = [
  { name: 'mobile', config: 'lighthouserc.mobile.cjs' },
  { name: 'tablet', config: 'lighthouserc.tablet.cjs' },
];

const run = (cmd, args, opts = {}) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, LH_BASE_URL: BASE_URL }, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// 1. Autentica (gera .lighthouseci/storage-state/session.json)
run('bun', ['run', 'scripts/lighthouse-authenticate.ts']);

// 2. Roda LHCI mobile + tablet
const summary = { commit: process.env.GITHUB_SHA || 'local', runs: [] };
for (const { name, config } of CONFIGS) {
  console.log(`\n═══ Lighthouse ${name} ═══`);
  const outDir = `.lighthouseci/${name}`;
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  run('bunx', ['@lhci/cli', 'collect', `--config=${config}`], {});
  // Move os resultados para outDir para separar mobile/tablet
  const defaultDir = '.lighthouseci';
  const files = fs.readdirSync(defaultDir).filter((f) => f.endsWith('.json') && !f.includes('/'));
  for (const f of files) {
    fs.renameSync(path.join(defaultDir, f), path.join(outDir, f));
  }

  // Extrai métricas do melhor run (mediana)
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  const median = manifest.find((m) => m.isRepresentativeRun) || manifest[0];
  const report = JSON.parse(fs.readFileSync(median.jsonPath.replace(defaultDir, outDir), 'utf8'));
  const audits = report.audits;
  summary.runs.push({
    device: name,
    performance: report.categories.performance.score,
    lcp: audits['largest-contentful-paint'].numericValue,
    cls: audits['cumulative-layout-shift'].numericValue,
    tbt: audits['total-blocking-time'].numericValue,
    inp: audits['interaction-to-next-paint']?.numericValue ?? null,
    fcp: audits['first-contentful-paint'].numericValue,
    si: audits['speed-index'].numericValue,
    tti: audits['interactive'].numericValue,
  });

  // Asserts (falha o build)
  run('bunx', ['@lhci/cli', 'assert', `--config=${config}`]);
}

// 3. Escreve resumo consolidado
fs.writeFileSync('.lighthouseci/summary.json', JSON.stringify(summary, null, 2));
console.log('\n✅ Lighthouse concluído. Resumo:');
console.table(summary.runs);
