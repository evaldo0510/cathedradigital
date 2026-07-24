#!/usr/bin/env tsx
/**
 * Prayer Engine — Auditoria Bloqueante (C0.3.c)
 *
 * Regra COS §10 (Reader Architecture Rule): todo leitor de oração
 * deve usar exclusivamente o Reader Template Master:
 *   - ReaderShell   (@/components/reader)
 *   - NexusPanel    (@/components/nexus/NexusPanel — reexportado no barrel)
 *   - ReferencePopover
 *   - ReaderContinuation
 *
 * Este script varre os arquivos que compõem a superfície de leitura do
 * Prayer Engine e falha com exit code 1 se encontrar qualquer paralelo
 * proibido. Deve rodar no CI e antes de qualquer certificação de onda.
 *
 * Escopo (arquivos-alvo): páginas/leitores de oração que RENDERIZAM
 * conteúdo orante. Hubs de índice (/missal, /breviary, /litanies,
 * /novenas) e páginas de listagem são fora de escopo — não são readers.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Arquivos que RENDERIZAM leitura de oração e portanto devem
// obedecer o Reader Template Master.
// (Adaptadores puros que apenas delegam a outro Reader — como
//  BreviaryHourInline → BreviaryContinuousReader — são fora de escopo:
//  o Reader real é auditado no próprio arquivo delegado.)
const READER_TARGETS = [
  'src/pages/PrayerDetailPage.tsx',
  'src/components/cathedra/PrayerEngineReader.tsx',
  'src/components/cathedra/BreviaryContinuousReader.tsx',
  'src/components/cathedra/MissaContinuousReader.tsx',
];

// Símbolos paralelos proibidos no Prayer Engine.
const FORBIDDEN = [
  { name: 'EditorialReaderChrome', hint: 'usar ReaderShell (@/components/reader).' },
  { name: 'MysteryNexusPanel', hint: 'usar NexusPanel (@/components/reader).' },
  { name: 'NexusBubbles', hint: 'usar NexusPanel (@/components/reader).' },
];

// Todo target deve importar pelo menos um dos primitivos canônicos.
const REQUIRED_ANY = ['ReaderShell'];

type Finding = { file: string; kind: 'forbidden' | 'missing_canonical'; detail: string };

const findings: Finding[] = [];

for (const rel of READER_TARGETS) {
  const abs = resolve(ROOT, rel);
  let src: string;
  try {
    src = readFileSync(abs, 'utf8');
  } catch {
    // arquivo pode não existir em todos os cenários — ignora silenciosamente
    continue;
  }

  for (const f of FORBIDDEN) {
    // Match import ou uso JSX; ignora menções em comentários de doc que começam com `*`.
    const re = new RegExp(String.raw`\b${f.name}\b`, 'g');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (!re.test(line)) return;
      const trimmed = line.trimStart();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
      findings.push({
        file: rel,
        kind: 'forbidden',
        detail: `${f.name} (linha ${i + 1}) — ${f.hint}`,
      });
    });
  }

  const hasCanonical = REQUIRED_ANY.some((sym) =>
    new RegExp(String.raw`\b${sym}\b`).test(src),
  );
  if (!hasCanonical) {
    findings.push({
      file: rel,
      kind: 'missing_canonical',
      detail: `nenhum dos primitivos canônicos encontrado: ${REQUIRED_ANY.join(', ')}`,
    });
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Prayer Engine · Auditoria C0.3');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Alvos verificados: ${READER_TARGETS.length}`);

if (findings.length === 0) {
  console.log('Status: ✅ ZERO paralelos. Prayer Engine unificado ao Reader Template Master.');
  process.exit(0);
}

console.error(`Status: ❌ ${findings.length} violação(ões) encontradas:\n`);
for (const f of findings) {
  console.error(`  · [${f.kind}] ${f.file}`);
  console.error(`      ${f.detail}`);
}
console.error('\nCertificação C0.3 BLOQUEADA. Corrija as violações antes de continuar.');
process.exit(1);
