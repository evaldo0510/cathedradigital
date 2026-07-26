#!/usr/bin/env node
/**
 * Verifica se o @capacitor/cli mais recente já resolve o advisory do `tar`.
 *
 * Estratégia:
 *  1. Lê a versão atualmente instalada de @capacitor/cli via package.json.
 *  2. Consulta o registry npm para a versão `latest`.
 *  3. Baixa o package.json publicado e inspeciona a faixa declarada para `tar`.
 *  4. Se a faixa mínima resolvida for >= FIXED_TAR (7.5.15), imprime `UPDATE_AVAILABLE=true`
 *     e escreve `REPORTS/capacitor-advisory.json` com detalhes usados pelo workflow para abrir PR.
 *
 * Não modifica arquivos do projeto — a atualização em si é feita pelo workflow
 * (`capacitor-advisory-check.yml`) que roda `bun update` e abre a PR.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FIXED_TAR = '7.5.15';
const PKG = '@capacitor/cli';

const pkgJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const currentRange = pkgJson.devDependencies?.[PKG] || pkgJson.dependencies?.[PKG] || '';

const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(PKG).replace('%40', '@')}`;
const res = await fetch(registryUrl, { headers: { accept: 'application/json' } });
if (!res.ok) {
  console.error(`falha ao consultar registry: ${res.status}`);
  process.exit(1);
}
const meta = await res.json();
const latest = meta['dist-tags']?.latest;
const latestManifest = meta.versions?.[latest];
if (!latest || !latestManifest) {
  console.error('registry não retornou versão latest');
  process.exit(1);
}

// Semver-ish compare (major.minor.patch, sem pre-release).
const cmp = (a, b) => {
  const [A, B] = [a, b].map((v) => v.replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0));
  for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i];
  return 0;
};

// Percorre dependencies do manifest publicado.
const tarRange = latestManifest.dependencies?.tar
  || latestManifest.optionalDependencies?.tar
  || '';

// Extrai versão mínima resolvível da faixa (^X.Y.Z / ~X.Y.Z / X.Y.Z / >=X.Y.Z).
const rangeMin = (r) => {
  const m = r.match(/(\d+\.\d+\.\d+)/);
  return m ? m[1] : '';
};
const tarMin = rangeMin(tarRange);

const currentInstalled = pkgJson.devDependencies?.[PKG]?.replace(/^[^\d]*/, '') || '';
const isNewerVersion = currentInstalled && cmp(latest, currentInstalled) > 0;
const tarLooksFixed = tarMin && cmp(tarMin, FIXED_TAR) >= 0;

const report = {
  package: PKG,
  currentRange,
  installedGuess: currentInstalled,
  latest,
  latestTarRange: tarRange,
  latestTarMin: tarMin,
  fixedTarBaseline: FIXED_TAR,
  isNewerVersion,
  tarLooksFixed,
  updateAvailable: Boolean(isNewerVersion && tarLooksFixed),
  checkedAt: new Date().toISOString(),
};

mkdirSync(resolve('REPORTS'), { recursive: true });
writeFileSync(resolve('REPORTS/capacitor-advisory.json'), JSON.stringify(report, null, 2));

if (process.env.GITHUB_OUTPUT) {
  const line = (k, v) => `${k}=${v}\n`;
  const out = process.env.GITHUB_OUTPUT;
  writeFileSync(out, line('update_available', report.updateAvailable), { flag: 'a' });
  writeFileSync(out, line('latest', latest), { flag: 'a' });
  writeFileSync(out, line('tar_min', tarMin), { flag: 'a' });
}

console.log(JSON.stringify(report, null, 2));
if (!report.updateAvailable) {
  console.log(`\nSem atualização elegível ainda (tar min=${tarMin || 'desconhecido'} vs baseline ${FIXED_TAR}).`);
} else {
  console.log(`\n✅ ${PKG}@${latest} já traz tar>=${FIXED_TAR}. Workflow deve abrir PR.`);
}
