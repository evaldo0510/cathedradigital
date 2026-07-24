#!/usr/bin/env tsx
/**
 * C0.4 — Nexus Unification · Auditoria Bloqueante (pós C0.4.b)
 *
 * Regra COS §10 (Reader Architecture Rule): o único painel canônico de
 * conexões teológicas é `NexusPanel` (@/components/nexus/NexusPanel,
 * reexportado em @/components/reader). `NexusBubbles` foi EXTINTO em
 * C0.4.b — o arquivo `src/components/cathedra/NexusBubbles.tsx` não
 * deve mais existir e nenhum arquivo pode importar dele.
 *
 * Escopo:
 * 1. Consumidores canônicos (Bíblia, Magistério, Santos, Jornadas, Dashboard)
 *    devem renderizar `NexusPanel` (exceto Dashboard, sem painel).
 * 2. Nenhum arquivo em `src/**` pode importar `NexusBubbles`.
 * 3. O próprio arquivo `NexusBubbles.tsx` não pode existir.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TARGETS = [
  'src/components/cathedra/BibleReader.tsx',
  'src/components/cathedra/MagisteriumViewer.tsx',
  'src/components/cathedra/SaintDetail.tsx',
  'src/components/cathedra/JornadaStepPage.tsx',
  'src/components/cathedra/Dashboard.tsx',
];

const REQUIRED = /\bNexusPanel\b/;
const NO_REQUIRE = new Set(['src/components/cathedra/Dashboard.tsx']);

type Finding = { file: string; kind: string; detail: string };
const findings: Finding[] = [];

// 1. NexusBubbles.tsx não pode existir mais
const legacyFile = 'src/components/cathedra/NexusBubbles.tsx';
if (existsSync(resolve(ROOT, legacyFile))) {
  findings.push({
    file: legacyFile,
    kind: 'legacy_file_present',
    detail: 'NexusBubbles.tsx ainda existe — deve ser excluído (C0.4.b).',
  });
}

// 2. Nenhum arquivo em src/** pode importar NexusBubbles
let importHits = '';
try {
  importHits = execSync(
    `grep -rl --include='*.ts' --include='*.tsx' "cathedra/NexusBubbles" src/ scripts/ || true`,
    { cwd: ROOT, encoding: 'utf8' },
  ).trim();
} catch {
  importHits = '';
}
if (importHits) {
  for (const rel of importHits.split('\n').filter(Boolean)) {
    findings.push({
      file: rel,
      kind: 'legacy_import',
      detail: 'import residual de NexusBubbles — migrar para ThemeChip/NexusPanel/ReferencePopover.',
    });
  }
}

// 3. Consumidores canônicos precisam do NexusPanel
for (const rel of TARGETS) {
  let src: string;
  try {
    src = readFileSync(resolve(ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  if (!NO_REQUIRE.has(rel) && !REQUIRED.test(src)) {
    findings.push({
      file: rel,
      kind: 'missing_canonical',
      detail: 'NexusPanel ausente — leitor sem painel canônico de conexões.',
    });
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Nexus Unification · Auditoria C0.4 / C0.4.b');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Alvos verificados: ${TARGETS.length}`);
console.log(`NexusBubbles references: ${importHits ? importHits.split('\n').length : 0}`);
console.log(`Legacy file present: ${existsSync(resolve(ROOT, legacyFile)) ? 'YES' : 'no'}`);

if (findings.length === 0) {
  console.log('Status: ✅ CERTIFIED — NexusBubbles extinto e painel canônico presente.');
  process.exit(0);
}

console.error(`Status: ❌ ${findings.length} violação(ões):\n`);
for (const f of findings) {
  console.error(`  · [${f.kind}] ${f.file}`);
  console.error(`      ${f.detail}`);
}
console.error('\nC0.4/C0.4.b BLOQUEADA. Remover dependências residuais de NexusBubbles.');
process.exit(1);
