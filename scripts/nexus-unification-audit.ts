#!/usr/bin/env tsx
/**
 * C0.4 — Nexus Unification · Auditoria Bloqueante
 *
 * Regra COS §10 (Reader Architecture Rule): o único painel canônico de
 * conexões teológicas é `NexusPanel` (@/components/nexus/NexusPanel,
 * reexportado em @/components/reader). `NexusBubbles` está
 * DEPRECATED e não pode voltar a ser consumido por leitores/páginas
 * públicas do domínio auditado.
 *
 * Escopo (C0.4): páginas que renderizam navegação contextual após um
 * bloco de leitura — Bíblia, Magistério, Santos, Jornadas, Dashboard.
 * O caso `TagBubble` (chip inline usado por Temas) fica reservado para
 * C0.4.b (migração para `ReferencePopover`).
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TARGETS = [
  'src/components/cathedra/BibleReader.tsx',
  'src/components/cathedra/MagisteriumViewer.tsx',
  'src/components/cathedra/SaintDetail.tsx',
  'src/components/cathedra/JornadaStepPage.tsx',
  'src/components/cathedra/Dashboard.tsx',
];

const FORBIDDEN = /from\s+['"][^'"]*cathedra\/NexusBubbles['"]/;
const REQUIRED = /\bNexusPanel\b/;
// Dashboard perdeu o painel de descoberta — não exige NexusPanel.
const NO_REQUIRE = new Set(['src/components/cathedra/Dashboard.tsx']);

type Finding = { file: string; kind: 'forbidden' | 'missing_canonical'; detail: string };
const findings: Finding[] = [];

for (const rel of TARGETS) {
  let src: string;
  try {
    src = readFileSync(resolve(ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  if (FORBIDDEN.test(src)) {
    findings.push({
      file: rel,
      kind: 'forbidden',
      detail: 'import de NexusBubbles ainda presente — substituir por NexusPanel.',
    });
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
console.log('Nexus Unification · Auditoria C0.4');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Alvos verificados: ${TARGETS.length}`);

if (findings.length === 0) {
  console.log('Status: ✅ ZERO consumidores de NexusBubbles no escopo C0.4.');
  process.exit(0);
}

console.error(`Status: ❌ ${findings.length} violação(ões):\n`);
for (const f of findings) {
  console.error(`  · [${f.kind}] ${f.file}`);
  console.error(`      ${f.detail}`);
}
console.error('\nC0.4 BLOQUEADA. Substituir NexusBubbles por NexusPanel.');
process.exit(1);
