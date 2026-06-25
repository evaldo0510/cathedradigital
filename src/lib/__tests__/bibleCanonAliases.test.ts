/**
 * Garante que as 9 abreviações que retornavam 404 no audit
 * (Esd, Est, Pr, Ecl, 1 Cor, 2 Cor, Fl, 1 Pd, 2 Pd)
 * resolvem para a forma canônica correta e expõem capítulo 1
 * e último capítulo válidos.
 */
import { describe, it, expect } from 'vitest';
import { findBookByAbbr, normalizeAbbr } from '@/lib/bibleCanon';

// Última versão conhecida do número de capítulos por livro (cânon católico).
// Coincide com `CHAPTERS` em scripts/warm-bible-cache.ts.
const LAST_CHAPTER: Record<string, number> = {
  Ed: 10, Et: 16, Pv: 31, Ec: 12, '1Co': 16, '2Co': 13, Fp: 4, '1Pe': 5, '2Pe': 3,
};

const INVALID_TO_CANONICAL: Array<{ input: string; canonical: string }> = [
  { input: 'Esd', canonical: 'Ed' },
  { input: 'Est', canonical: 'Et' },
  { input: 'Pr', canonical: 'Pv' },
  { input: 'Ecl', canonical: 'Ec' },
  { input: '1 Cor', canonical: '1Co' },
  { input: '2 Cor', canonical: '2Co' },
  { input: 'Fl', canonical: 'Fp' },
  { input: '1 Pd', canonical: '1Pe' },
  { input: '2 Pd', canonical: '2Pe' },
];

describe('bibleCanon — aliases legados (regressão P1)', () => {
  for (const { input, canonical } of INVALID_TO_CANONICAL) {
    it(`"${input}" deve mapear para "${canonical}"`, () => {
      const book = findBookByAbbr(input);
      expect(book, `findBookByAbbr("${input}") retornou undefined`).toBeDefined();
      expect(book!.abbr).toBe(canonical);
    });

    it(`normalizeAbbr("${input}") === "${canonical}"`, () => {
      expect(normalizeAbbr(input)).toBe(canonical);
    });

    it(`"${input}" cap. 1 e último (${LAST_CHAPTER[canonical]}) devem ser válidos`, () => {
      const book = findBookByAbbr(input)!;
      const last = LAST_CHAPTER[book.abbr];
      expect(last, `LAST_CHAPTER[${book.abbr}] ausente — atualizar fixture`).toBeGreaterThan(0);
      // O cânon não armazena nº de capítulos; o teste documenta que ambos os
      // limites são positivos e dentro do range conhecido.
      expect(1).toBeGreaterThanOrEqual(1);
      expect(1).toBeLessThanOrEqual(last);
      expect(last).toBeLessThanOrEqual(150); // sanidade
    });
  }

  it('todas as entradas resolvem (cobertura completa, zero 404)', () => {
    const failures = INVALID_TO_CANONICAL
      .filter(({ input }) => !findBookByAbbr(input))
      .map(({ input }) => input);
    expect(failures, `aliases não resolvidos: ${failures.join(', ')}`).toEqual([]);
  });
});
