#!/usr/bin/env tsx
/**
 * Sprint B.1 · Onda B.1.1 — Auditoria bloqueante de cards da Biblioteca.
 *
 * A Biblioteca (rota `/biblioteca` e módulo `src/modules/biblioteca/`) DEVE
 * renderizar itens exclusivamente via `LibraryCard` (que por sua vez usa o
 * `EditorialCard` canônico). Qualquer uso de card legado dentro do escopo
 * abaixo falha o CI.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SCOPE = [
  'src/modules/biblioteca',
  'src/pages/AtriumBibliotecaPage.tsx',
];

// Componentes de card proibidos dentro do escopo Biblioteca.
const FORBIDDEN = ['SearchResultCard', 'CathedraCard'];

function walk(dir: string, out: string[] = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(abs);
  }
  return out;
}

const files: string[] = [];
for (const target of SCOPE) {
  const abs = resolve(ROOT, target);
  if (!existsSync(abs)) continue;
  if (statSync(abs).isDirectory()) walk(abs, files);
  else files.push(abs);
}

const findings: string[] = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const forbidden of FORBIDDEN) {
    const re = new RegExp(`\\b${forbidden}\\b`);
    if (re.test(src)) findings.push(`  ✖ ${file.replace(ROOT + '/', '')} usa "${forbidden}" (proibido no escopo Biblioteca).`);
  }
}

if (findings.length) {
  console.error('\n[B.1] Biblioteca card audit — FALHOU\n');
  for (const f of findings) console.error(f);
  console.error(`\n${findings.length} não-conformidade(s).\n`);
  process.exit(1);
}

console.log(`\n[B.1] Biblioteca card audit — ${files.length} arquivos varridos · 0 cards legados.`);
console.log('  Status: OK (LibraryCard/EditorialCard exclusivos)\n');
