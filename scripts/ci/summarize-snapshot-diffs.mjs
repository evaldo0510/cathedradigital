#!/usr/bin/env node
/**
 * Gera um resumo Markdown dos diffs de snapshot do Playwright.
 *
 * Varre `test-results/` procurando arquivos `*-expected.png`, `*-actual.png`
 * e `*-diff.png` produzidos por `toHaveScreenshot` quando há falha,
 * e escreve:
 *   1. Um arquivo `test-results/SNAPSHOT-DIFFS.md` com as imagens embutidas
 *      (funciona bem quando publicado como artifact).
 *   2. As mesmas seções em `$GITHUB_STEP_SUMMARY` (referenciando o artifact),
 *      quando a variável estiver definida.
 *
 * Uso: `node scripts/ci/summarize-snapshot-diffs.mjs [test-results-dir]`
 */

import { readdirSync, statSync, existsSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';

const root = process.argv[2] || 'test-results';

if (!existsSync(root)) {
  console.log(`[snapshot-diffs] diretório ${root} não existe — nada a resumir.`);
  process.exit(0);
}

/** Walk recursivo simples. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(root);
const diffs = files.filter((f) => f.endsWith('-diff.png'));

if (diffs.length === 0) {
  console.log('[snapshot-diffs] nenhum diff encontrado.');
  process.exit(0);
}

/** Agrupa por caso de teste (diretório do arquivo). */
const groups = new Map();
for (const diff of diffs) {
  const dir = dirname(diff);
  const base = basename(diff).replace(/-diff\.png$/, '');
  const expected = join(dir, `${base}-expected.png`);
  const actual = join(dir, `${base}-actual.png`);
  if (!groups.has(dir)) groups.set(dir, []);
  groups.get(dir).push({ name: base, expected, actual, diff });
}

const lines = [];
lines.push('# Snapshot diffs · resumo visual');
lines.push('');
lines.push(`Total de snapshots com diferença: **${diffs.length}** em **${groups.size}** teste(s).`);
lines.push('');
lines.push('> Para cada snapshot: **Esperado** (baseline) · **Atual** (nova execução) · **Diff** (regiões alteradas em vermelho).');
lines.push('');

for (const [dir, items] of groups) {
  lines.push(`## ${relative(root, dir) || dir}`);
  lines.push('');
  for (const it of items) {
    lines.push(`### ${it.name}`);
    lines.push('');
    lines.push('| Esperado | Atual | Diff |');
    lines.push('| :--: | :--: | :--: |');
    const row = [it.expected, it.actual, it.diff]
      .map((p) => (existsSync(p) ? `![](${relative(root, p)})` : '_(ausente)_'))
      .join(' | ');
    lines.push(`| ${row} |`);
    lines.push('');
  }
}

const outPath = join(root, 'SNAPSHOT-DIFFS.md');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`[snapshot-diffs] escrito ${outPath} (${diffs.length} diffs)`);

// Publica um resumo enxuto no GITHUB_STEP_SUMMARY quando disponível.
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const short = [];
  short.push('## Snapshot diffs');
  short.push('');
  short.push(`Total: **${diffs.length}** em **${groups.size}** teste(s).`);
  short.push('');
  short.push('Baixe o artifact `menu-snapshots-diffs` para ver as imagens lado a lado (ver `SNAPSHOT-DIFFS.md`).');
  short.push('');
  for (const [dir, items] of groups) {
    short.push(`- \`${relative(root, dir) || dir}\` — ${items.length} snapshot(s): ${items.map((i) => `\`${i.name}\``).join(', ')}`);
  }
  short.push('');
  appendFileSync(summaryPath, short.join('\n') + '\n', 'utf8');
  console.log('[snapshot-diffs] resumo publicado em $GITHUB_STEP_SUMMARY');
}
