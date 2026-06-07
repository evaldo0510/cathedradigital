import { expect, test, describe } from 'vitest';

/**
 * TESTE DE VALIDAÇÃO LINGUÍSTICA (ZERO INGLÊS)
 * Este teste valida a Edge Function diretamente para garantir que o conteúdo
 * servido para a UI não contenha termos em inglês nos livros deuterocanônicos.
 */

const DEUTERO_BOOKS = [
  { abbr: 'Tb', name: 'Tobias' },
  { abbr: 'Jdt', name: 'Judite' },
  { abbr: 'Sb', name: 'Sabedoria' },
  { abbr: 'Eclo', name: 'Eclesiástico' },
  { abbr: 'Br', name: 'Baruc' },
  { abbr: '1Mc', name: '1 Macabeus' },
  { abbr: '2Mc', name: '2 Macabeus' }
];

const ENGLISH_INDICATORS = [
  /\bthe\b/i, /\band\b/i, /\bshall\b/i, /\bunto\b/i, /\bfrom\b/i, /\bwith\b/i,
  /\bking\b/i, /\bgathered\b/i, /\bforces\b/i, /\bfight\b/i, /\bwent\b/i
];

describe('Bible Zero English (Edge Function Validation)', () => {
  DEUTERO_BOOKS.forEach(book => {
    test(`Verify ${book.name} (Chapter 1) content is in Portuguese`, async () => {
      // Usamos o capítulo 14 para 1 Macabeus conforme solicitado
      const chapter = book.abbr === '1Mc' ? 14 : 1;
      
      const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abbrev: book.abbr, chapter })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.verses).toBeDefined();
      expect(data.verses.length).toBeGreaterThan(0);

      const allText = data.verses.map((v: any) => v.text).join(' ');

      // Validar ausência de indicadores de inglês
      ENGLISH_INDICATORS.forEach(indicator => {
        expect(allText).not.toMatch(indicator);
      });

      // Validar presença de indicadores de português
      const portugueseIndicators = [' de ', ' o ', ' e ', ' a ', ' que '];
      const hasPortuguese = portugueseIndicators.some(word => allText.toLowerCase().includes(word));
      expect(hasPortuguese).toBe(true);
    });
  });
});
