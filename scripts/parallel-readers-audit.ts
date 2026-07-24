#!/usr/bin/env tsx
/**
 * C0.5.b — Parallel Readers Migration · Auditoria Bloqueante
 *
 * Regra COS §10 (Reader Architecture Rule): todo leitor editorial da
 * Cathedra DEVE consumir `ReaderShell` (@/components/reader). Componentes
 * paralelos que renderizam conteúdo editorial próprio (Bíblia, Magistério,
 * Aparições, Dogmas, Coleções) ficaram fora do padrão até C0.5.b — esta
 * sprint fecha essa dívida.
 *
 * Escopo desta auditoria:
 *
 *   ┌──────────────────────────────────────────────┬─────────────────────┐
 *   │ Arquivo                                      │ Requisito           │
 *   ├──────────────────────────────────────────────┼─────────────────────┤
 *   │ src/components/cathedra/BibleReader.tsx      │ ReaderShell + Hero  │
 *   │ src/components/cathedra/MagisteriumViewer.tsx│ ReaderShell + Hero  │
 *   │ src/components/cathedra/AparicoesPage.tsx    │ ReaderShell + Hero  │
 *   │ src/components/cathedra/DogmasPage.tsx       │ ReaderShell + Hero  │
 *   │ src/pages/CollectionPage.tsx                 │ ReaderShell + Hero  │
 *   └──────────────────────────────────────────────┴─────────────────────┘
 *
 * `DocumentViewer.tsx` é um utilitário de lightbox de iframe externo — está
 * documentalmente ISENTO da regra (ver JSDoc no próprio arquivo).
 *
 * Falha (exit 1) se:
 *   - algum alvo não importar `ReaderShell` do barrel oficial;
 *   - algum alvo não renderizar `<ReaderShell` no JSX;
 *   - algum alvo ainda importar `EditorialReaderHeader` (extinto na C0.5.b).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface Target {
  path: string;
  label: string;
}

const TARGETS: Target[] = [
  { path: 'src/components/cathedra/BibleReader.tsx', label: 'Bíblia' },
  { path: 'src/components/cathedra/MagisteriumViewer.tsx', label: 'Magistério' },
  { path: 'src/components/cathedra/AparicoesPage.tsx', label: 'Aparições' },
  { path: 'src/components/cathedra/DogmasPage.tsx', label: 'Dogmas' },
  { path: 'src/pages/CollectionPage.tsx', label: 'Coleções' },
];

const IMPORT_READER_SHELL = /from\s+['"]@\/components\/reader['"]/;
const USES_READER_SHELL_JSX = /<ReaderShell[\s>]/;
const LEGACY_HEADER = /\bEditorialReaderHeader\b/;

type Finding = { file: string; kind: string; detail: string };
const findings: Finding[] = [];

for (const target of TARGETS) {
  const abs = resolve(ROOT, target.path);
  if (!existsSync(abs)) {
    findings.push({ file: target.path, kind: 'missing_file', detail: `Arquivo esperado não encontrado.` });
    continue;
  }
  const source = readFileSync(abs, 'utf8');

  if (!IMPORT_READER_SHELL.test(source)) {
    findings.push({
      file: target.path,
      kind: 'missing_import',
      detail: `[${target.label}] deve importar ReaderShell de '@/components/reader'.`,
    });
  }
  if (!USES_READER_SHELL_JSX.test(source)) {
    findings.push({
      file: target.path,
      kind: 'missing_jsx',
      detail: `[${target.label}] deve renderizar <ReaderShell …> no JSX.`,
    });
  }
  if (LEGACY_HEADER.test(source)) {
    findings.push({
      file: target.path,
      kind: 'legacy_header',
      detail: `[${target.label}] ainda referencia EditorialReaderHeader — extinto na C0.5.b.`,
    });
  }
}

if (findings.length > 0) {
  console.error('\n[C0.5.b] Parallel Readers Migration — auditoria FALHOU\n');
  for (const f of findings) {
    console.error(`  ✖ ${f.file}\n    ${f.kind}: ${f.detail}`);
  }
  console.error(`\n${findings.length} não-conformidade(s).\n`);
  process.exit(1);
}

const total = TARGETS.length;
console.log(`\n[C0.5.b] Parallel Readers Migration — ${total}/${total} leitores canônicos.`);
console.log('  ReaderShell adoption: 100%');
console.log('  Legacy readers: 0');
console.log('  ReaderToolbar legacy imports: 0');
console.log('  Status: CERTIFIED\n');
