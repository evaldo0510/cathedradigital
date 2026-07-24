/**
 * C0.4 — Nexus Unification (guardrail estático)
 *
 * Garante que os consumidores públicos migrados na C0.4 não voltem a
 * importar `NexusBubbles`. Complementa `scripts/nexus-unification-audit.ts`
 * dentro do Vitest, para pegar regressões no PR antes do CI.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const TARGETS = [
  'src/components/cathedra/BibleReader.tsx',
  'src/components/cathedra/MagisteriumViewer.tsx',
  'src/components/cathedra/SaintDetail.tsx',
  'src/components/cathedra/JornadaStepPage.tsx',
  'src/components/cathedra/Dashboard.tsx',
];

const FORBIDDEN = /from\s+['"][^'"]*cathedra\/NexusBubbles['"]/;

describe('C0.4 — Nexus Unification', () => {
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
});
