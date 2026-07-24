/**
 * C0.5 — Reader Chrome Final (guardrail estático)
 *
 * Garante dentro do Vitest que `EditorialReaderChrome` continua extinto
 * e que ninguém volta a importá-lo. Complementa
 * `scripts/reader-chrome-audit.ts` no PR antes do CI.
 */
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = process.cwd();
const LEGACY_FILE = resolve(
  ROOT,
  'src/components/editorial/EditorialReaderChrome.tsx',
);
const FORBIDDEN_IMPORT =
  /from\s+['"][^'"]*editorial\/EditorialReaderChrome['"]/;

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('C0.5 — Reader Chrome Final', () => {
  it('arquivo legado EditorialReaderChrome.tsx não existe', () => {
    expect(existsSync(LEGACY_FILE)).toBe(false);
  });

  it('nenhum arquivo em src/ importa EditorialReaderChrome', () => {
    const files = walk(resolve(ROOT, 'src'));
    const offenders = files.filter((f) =>
      FORBIDDEN_IMPORT.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
