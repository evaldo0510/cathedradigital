/**
 * C0.3 — Prayer Engine · Reader Template Master
 *
 * Teste estático (equivalente ao script `scripts/prayer-engine-audit.ts`
 * mas embutido no Vitest) que garante:
 *   - Nenhum arquivo-alvo importa componentes paralelos proibidos.
 *   - Todos os alvos usam ReaderShell como esqueleto de leitura.
 *
 * Rejeitar qualquer regressão que reintroduza EditorialReaderChrome,
 * MysteryNexusPanel ou NexusBubbles no Prayer Engine.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(__dirname, '..');

const READER_TARGETS = [
  'src/pages/PrayerDetailPage.tsx',
  'src/components/cathedra/PrayerEngineReader.tsx',
  'src/components/cathedra/BreviaryContinuousReader.tsx',
  'src/components/cathedra/MissaContinuousReader.tsx',
];

const FORBIDDEN = ['EditorialReaderChrome', 'MysteryNexusPanel', 'NexusBubbles'];

const isCodeLine = (line: string) => {
  const t = line.trimStart();
  return !t.startsWith('*') && !t.startsWith('//');
};

describe('Prayer Engine · C0.3 · Reader Template Master', () => {
  for (const rel of READER_TARGETS) {
    const src = (() => {
      try {
        return readFileSync(resolve(ROOT, rel), 'utf8');
      } catch {
        return null;
      }
    })();

    if (src === null) {
      it.skip(`${rel} — alvo ausente do repositório (skip)`, () => void 0);
      continue;
    }

    it(`${rel} usa ReaderShell (Reader Template Master)`, () => {
      expect(src).toMatch(/\bReaderShell\b/);
    });

    for (const symbol of FORBIDDEN) {
      it(`${rel} não importa nem renderiza ${symbol}`, () => {
        const offending = src
          .split('\n')
          .filter(isCodeLine)
          .filter((l) => new RegExp(String.raw`\b${symbol}\b`).test(l));
        expect(offending, `Encontrado ${symbol} nas linhas:\n${offending.join('\n')}`).toEqual([]);
      });
    }
  }
});
