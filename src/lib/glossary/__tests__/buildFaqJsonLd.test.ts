import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildFaqPageJsonLd, sanitizeFaqItems, FaqPageJsonLdSchema } from '../sanitizeFaq';

describe('buildFaqPageJsonLd — snapshots', () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it('FAQ vazio → null', () => {
    expect(buildFaqPageJsonLd(null)).toBeNull();
    expect(buildFaqPageJsonLd([])).toBeNull();
  });

  it('todos itens sem answer não-vazia → null', () => {
    const raw = sanitizeFaqItems([
      { question: 'A?', answer: null },
      { question: 'B?', answer: '   ' },
    ]);
    expect(buildFaqPageJsonLd(raw)).toBeNull();
  });

  it('snapshot: caso canônico com 2 perguntas', () => {
    const raw = sanitizeFaqItems([
      { question: 'O que é graça santificante?', answer: 'Dom sobrenatural...' },
      { question: 'Como se recebe?', answer: 'Pelos sacramentos.' },
    ]);
    expect(buildFaqPageJsonLd(raw)).toMatchInlineSnapshot(`
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Dom sobrenatural...",
            },
            "name": "O que é graça santificante?",
          },
          {
            "@type": "Question",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Pelos sacramentos.",
            },
            "name": "Como se recebe?",
          },
        ],
      }
    `);
  });

  it('snapshot: descarta inválidos e preserva apenas 1 pergunta', () => {
    const raw = sanitizeFaqItems([
      null,
      { question: '', answer: 'x' },
      { question: 'Única válida?', answer: 'Sim.' },
      { question: 'Sem resposta?' },
    ]);
    expect(buildFaqPageJsonLd(raw)).toMatchInlineSnapshot(`
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sim.",
            },
            "name": "Única válida?",
          },
        ],
      }
    `);
  });

  it('snapshot: preserva quebras de linha na resposta', () => {
    const raw = sanitizeFaqItems([
      { question: 'Multi?', answer: 'Linha 1\n\nLinha 2' },
    ]);
    expect(buildFaqPageJsonLd(raw)).toMatchInlineSnapshot(`
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Linha 1

      Linha 2",
            },
            "name": "Multi?",
          },
        ],
      }
    `);
  });

  it('a saída sempre valida contra FaqPageJsonLdSchema', () => {
    const raw = sanitizeFaqItems([
      { question: 'A?', answer: 'ok' },
      { question: 'B?', answer: 'também ok' },
    ]);
    const out = buildFaqPageJsonLd(raw);
    expect(out).not.toBeNull();
    expect(() => FaqPageJsonLdSchema.parse(out)).not.toThrow();
  });
});
