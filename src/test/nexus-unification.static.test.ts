/**
 * C0.4 — Nexus Unification (guardrail estático)
 *
 * Garante que os consumidores públicos migrados na C0.4 não voltem a
 * importar `NexusBubbles`. Complementa `scripts/nexus-unification-audit.ts`
 * dentro do Vitest, para pegar regressões no PR antes do CI.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { describe, it, expect } from 'vitest';

const TARGETS = [
  'src/components/cathedra/BibleReader.tsx',
  'src/components/cathedra/MagisteriumViewer.tsx',
  'src/components/cathedra/SaintDetail.tsx',
  'src/components/cathedra/JornadaStepPage.tsx',
  'src/components/cathedra/Dashboard.tsx',
];

const FORBIDDEN = /from\s+['"][^'"]*cathedra\/NexusBubbles['"]/;

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe('C0.4 / C0.4.b — Nexus Unification', () => {
  for (const rel of TARGETS) {
    it(`${rel} não importa NexusBubbles`, () => {
      const src = readFileSync(resolve(process.cwd(), rel), 'utf8');
      expect(FORBIDDEN.test(src)).toBe(false);
    });
  }

  it('BibleReader, Magisterium, Saint e Jornada renderizam NexusPanel', () => {
    for (const rel of TARGETS.filter((f) => !f.endsWith('Dashboard.tsx'))) {
      const src = readFileSync(resolve(process.cwd(), rel), 'utf8');
      expect(/\bNexusPanel\b/.test(src)).toBe(true);
    }
  });

  it('C0.4.b: arquivo legado NexusBubbles.tsx não existe mais', () => {
    expect(
      existsSync(resolve(process.cwd(), 'src/components/cathedra/NexusBubbles.tsx')),
    ).toBe(false);
  });

  it('C0.4.b: nenhum arquivo em src/ importa NexusBubbles', () => {
    const offenders = walk(resolve(process.cwd(), 'src')).filter((full) =>
      FORBIDDEN.test(readFileSync(full, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
