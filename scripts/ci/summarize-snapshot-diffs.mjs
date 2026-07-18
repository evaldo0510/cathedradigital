#!/usr/bin/env node
/**
 * Gera um resumo Markdown dos diffs de snapshot do Playwright.
 *
 * Varre `test-results/` procurando arquivos `*-expected.png`, `*-actual.png`,
 * `*-diff.png` e `trace.zip` produzidos quando `toHaveScreenshot` falha,
 * e escreve:
 *   1. `test-results/SNAPSHOT-DIFFS.md` com as imagens embutidas (funciona bem
 *      quando publicado como artifact — GitHub renderiza inline).
 *   2. Um resumo no `$GITHUB_STEP_SUMMARY` com LINKS DIRETOS para cada arquivo
 *      dentro do artifact `menu-snapshots-diffs` (usando ARTIFACT_URL quando
 *      disponível) e caminhos relativos como fallback.
 *
 * Uso: `node scripts/ci/summarize-snapshot-diffs.mjs [test-results-dir]`
 *
 * Variáveis opcionais:
 *   ARTIFACT_URL — URL base pública do artifact (ex.: link do run). Quando
 *   ausente, o resumo usa caminhos relativos ao artifact baixado.
 */

import { readdirSync, statSync, existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';

const root = process.argv[2] || 'test-results';
const modeArg = process.argv.find((a) => a.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'both'; // 'md' | 'summary' | 'pr' | 'both' | 'all'
const artifactBase = (process.env.ARTIFACT_URL || '').replace(/\/+$/, '');

if (!existsSync(root)) {
  console.log(`[snapshot-diffs] diretório ${root} não existe — nada a resumir.`);
  process.exit(0);
}

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
const coverageFiles = files.filter((f) => basename(f) === 'mask-coverage.json');

// Agrega mask-coverage de todos os testes.
const coverageAgg = coverageFiles
  .map((f) => {
    try { return { path: f, data: JSON.parse(readFileSync(f, 'utf8')) }; }
    catch { return null; }
  })
  .filter(Boolean);

if (diffs.length === 0 && coverageAgg.length === 0) {
  console.log('[snapshot-diffs] nada a resumir (sem diffs nem mask-coverage).');
  process.exit(0);
}


/** Encontra o trace.zip mais próximo (mesmo diretório do diff). */
function findTrace(dir) {
  const candidate = join(dir, 'trace.zip');
  return existsSync(candidate) ? candidate : null;
}

/** Constrói link para um caminho, priorizando ARTIFACT_URL. */
function linkTo(pathRel) {
  if (!pathRel) return null;
  if (artifactBase) return `${artifactBase}/${pathRel}`;
  return pathRel;
}

const groups = new Map();
for (const diff of diffs) {
  const dir = dirname(diff);
  const base = basename(diff).replace(/-diff\.png$/, '');
  const expected = join(dir, `${base}-expected.png`);
  const actual = join(dir, `${base}-actual.png`);
  const trace = findTrace(dir);
  if (!groups.has(dir)) groups.set(dir, []);
  groups.get(dir).push({ name: base, expected, actual, diff, trace });
}

// ---------- 1. SNAPSHOT-DIFFS.md (imagens embutidas) ----------
if (mode === 'md' || mode === 'both') {
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
      if (it.trace) {
        lines.push('');
        lines.push(`Trace: [\`${relative(root, it.trace)}\`](${relative(root, it.trace)})`);
      }
      lines.push('');
    }
  }

  const outPath = join(root, 'SNAPSHOT-DIFFS.md');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`[snapshot-diffs] escrito ${outPath} (${diffs.length} diffs)`);
}

// ---------- 2. $GITHUB_STEP_SUMMARY (links diretos) ----------
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if ((mode === 'summary' || mode === 'both') && summaryPath) {
  const short = [];
  short.push('## Snapshot diffs · links diretos');
  short.push('');
  short.push(`Total: **${diffs.length}** em **${groups.size}** teste(s).`);
  short.push('');
  short.push(
    artifactBase
      ? `Links apontam para o artifact publicado (\`ARTIFACT_URL=${artifactBase}\`).`
      : 'Links são relativos ao artifact `menu-snapshots-diffs` — baixe-o para navegar.',
  );
  short.push('');
  short.push('| Teste | Snapshot | Esperado | Atual | Diff | Trace |');
  short.push('| --- | --- | :--: | :--: | :--: | :--: |');

  for (const [dir, items] of groups) {
    const testLabel = relative(root, dir) || dir;
    for (const it of items) {
      const cell = (p) =>
        p && existsSync(p) ? `[png](${linkTo(relative(root, p))})` : '—';
      const traceCell = it.trace
        ? `[zip](${linkTo(relative(root, it.trace))})`
        : '—';
      short.push(
        `| \`${testLabel}\` | \`${it.name}\` | ${cell(it.expected)} | ${cell(it.actual)} | ${cell(it.diff)} | ${traceCell} |`,
      );
    }
  }
  short.push('');
  short.push('Preview lado a lado: veja `SNAPSHOT-DIFFS.md` dentro do mesmo artifact.');
  short.push('');
  appendFileSync(summaryPath, short.join('\n') + '\n', 'utf8');
  console.log('[snapshot-diffs] resumo com links publicado em $GITHUB_STEP_SUMMARY');
}
