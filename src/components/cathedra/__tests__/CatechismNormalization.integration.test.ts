import { describe, it, expect } from 'vitest';
import { normalizeCatechismText } from '@/lib/catechismTextNormalizer';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';

/**
 * Testes de integração — garantem que a normalização preserva
 * referências bíblicas e do catecismo que o parser depende para
 * transformar em popovers no Reader.
 */

const REAL_CATECHISM_SAMPLES: Array<{ paragraph: number; content: string; expectRefs: string[] }> = [
  {
    paragraph: 185,
    content:
      'Quem diz «Creio» diz «Adiro ao que nós cremos». Cf. Jo 3, 16 e CIC 186. ' +
      'A comunhão\u00A0na fé precisa de uma linguagem comum.',
    expectRefs: ['Jo 3, 16', 'CIC 186'],
  },
  {
    paragraph: 456,
    content:
      'Cristo\u00A0é o Verbo eterno.Ele veio ao mundo (cf. Jo 1, 14).\r\n\r\n\r\n' +
      'Como diz São Paulo em Rm 8, 3: "Deus enviou seu Filho".',
    expectRefs: ['Jo 1, 14', 'Rm 8, 3'],
  },
  {
    paragraph: 1213,
    content:
      'Os efeitos do Batismo12 são: – purificação dos pecados; – nova criatura em Cristo. ' +
      'Cf. CIC 1263 e 2Cor 5, 17.',
    expectRefs: ['CIC 1263', '2Cor 5, 17'],
  },
];

describe('Catechism content pipeline (normalize → parse)', () => {
  it.each(REAL_CATECHISM_SAMPLES)(
    'preserva referências bíblicas e do catecismo em §$paragraph',
    ({ content, expectRefs }) => {
      const normalized = normalizeCatechismText(content);
      const segments = parseTheologicalReferences(normalized);

      // Reconstrói o texto renderizável concatenando todos os segmentos —
      // o parser pode fatiar uma referência em múltiplos segmentos
      // (texto + ref), mas o conteúdo textual completo deve preservá-la.
      const rendered = segments.map(s => s.value).join('');

      for (const ref of expectRefs) {
        expect(rendered.replace(/\s+/g, ' ')).toContain(ref);
      }

      expect(segments.every(s => s.value.length > 0)).toBe(true);
    }
  );

  it('não introduz caracteres invisíveis no output', () => {
    const sample = REAL_CATECHISM_SAMPLES[0].content;
    const out = normalizeCatechismText(sample);
    expect(out).not.toMatch(/[\u200B-\u200D\uFEFF\u00AD\u00A0]/);
  });

  it('mantém idempotência sobre conteúdos reais', () => {
    for (const s of REAL_CATECHISM_SAMPLES) {
      const once = normalizeCatechismText(s.content);
      const twice = normalizeCatechismText(once);
      expect(twice).toBe(once);
    }
  });

  it('preserva conteúdo textual íntegro para highlights (sem referências)', () => {
    // Highlights são aplicados no wrapper <p> do texto plano. O texto
    // reconstruído a partir dos segmentos deve bater com o normalizado.
    const simple = 'Deus é amor e caridade fraterna.';
    const normalized = normalizeCatechismText(simple);
    const segments = parseTheologicalReferences(normalized);
    const rendered = segments.map(s => s.value).join('');
    expect(rendered.replace(/\s+/g, ' ').trim()).toBe(normalized);
  });
});

