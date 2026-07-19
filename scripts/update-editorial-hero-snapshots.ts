#!/usr/bin/env bun
/**
 * Atualiza baselines dos specs `editorial-hero-visual-regression` com
 * `--update-snapshots` e mostra quais imagens foram criadas/alteradas,
 * facilitando revisão antes do commit.
 *
 * Uso:
 *   bun run test:editorial-hero:update
 *   bun run test:editorial-hero:update -- --project=chromium
 *
 * Flags extras são repassadas para o `playwright test`.
 */
import { execSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const SNAPSHOT_ROOTS = [
  'tests/e2e/editorial-hero-visual-regression.spec.ts-snapshots',
  'tests/e2e/__snapshots__/editorial-hero-visual-regression.spec.ts',
];

interface Snap { path: string; mtime: number; size: number }

function collect(): Snap[] {
  const out: Snap[] = [];
  for (const root of SNAPSHOT_ROOTS) {
    if (!existsSync(root)) continue;
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) walk(full);
        else if (entry.endsWith('.png')) out.push({ path: full, mtime: st.mtimeMs, size: st.size });
      }
    };
    walk(root);
  }
  return out;
}

function index(list: Snap[]) {
  return new Map(list.map((s) => [s.path, s] as const));
}

const before = index(collect());
const extra = process.argv.slice(2).join(' ');

console.log('▶ Atualizando snapshots editorial-hero-visual-regression…');
try {
  execSync(
    `bunx playwright test tests/e2e/editorial-hero-visual-regression.spec.ts --update-snapshots ${extra}`,
    { stdio: 'inherit', env: { ...process.env, CI: 'true' } },
  );
} catch (e) {
  console.error('\n✖ Falha ao rodar playwright --update-snapshots');
  process.exitCode = 1;
}

const after = collect();
const added: string[] = [];
const changed: string[] = [];
const unchanged: string[] = [];
for (const s of after) {
  const prev = before.get(s.path);
  const rel = relative(process.cwd(), s.path);
  if (!prev) added.push(rel);
  else if (prev.size !== s.size || prev.mtime !== s.mtime) changed.push(rel);
  else unchanged.push(rel);
}
const removed: string[] = [];
for (const [p] of before) {
  if (!after.find((s) => s.path === p)) removed.push(relative(process.cwd(), p));
}

const fmt = (arr: string[]) => arr.map((x) => `  • ${x}`).join('\n') || '  (nenhum)';
console.log('\n═════════ Baselines editorial-hero ═════════');
console.log(`\n▲ Novos (${added.length}):\n${fmt(added)}`);
console.log(`\n✎ Alterados (${changed.length}):\n${fmt(changed)}`);
console.log(`\n✖ Removidos (${removed.length}):\n${fmt(removed)}`);
console.log(`\n= Inalterados: ${unchanged.length}`);
console.log('\nRevise visualmente antes de commitar os PNGs acima.');
