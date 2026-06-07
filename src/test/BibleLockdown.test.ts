import { expect, test, describe } from 'vitest';

const DEUTERO_TESTS = [
  { abbr: '1Mc', ch: 1, text: 'Alexandre' },
  { abbr: '1Mc', ch: 2, text: 'Matatias' },
  { abbr: '2Mc', ch: 1, text: 'Egito' },
  { abbr: 'Tb', ch: 1, text: 'Tobias' },
  { abbr: 'Jdt', ch: 1, text: 'Nabucodonosor' },
  { abbr: 'Sb', ch: 1, text: 'justiça' },
  { abbr: 'Eclo', ch: 1, text: 'sabedoria' }
];

describe('Bible Source Lockdown (Zero External Deuterocanonical)', { timeout: 15000 }, () => {
  DEUTERO_TESTS.forEach(target => {
    test(`Lockdown: ${target.abbr} Cap ${target.ch} deve vir exclusivamente do Banco`, async () => {
      const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abbrev: target.abbr, chapter: target.ch })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Validação de Fonte
      expect(data.metadata.source).toBe('Cathedra (Banco)');
      
      // Validação de Idioma e Conteúdo
      const allText = data.verses.map((v: any) => v.text).join(' ');
      expect(allText.toLowerCase()).toContain(target.text.toLowerCase());
      
      // Detector de Inglês (Failsafe)
      const englishWords = [' the ', ' and ', ' with ', ' shall '];
      englishWords.forEach(word => {
        expect(allText.toLowerCase()).not.toContain(word);
      });
    });
  });

  test('Bloqueio: Deuterocanônico não migrado deve retornar 404 (Security Guard)', async () => {
    const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abbrev: '1Mc', chapter: 99 }) // Capítulo inexistente
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('não foi migrado');
  });
});
