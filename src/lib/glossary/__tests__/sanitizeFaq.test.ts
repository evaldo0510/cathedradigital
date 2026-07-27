import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeFaqItems,
  sanitizeFaqItemsDetailed,
  filterFaqForJsonLd,
} from '../sanitizeFaq';

describe('sanitizeFaqItems', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it('retorna [] quando entrada não é array', () => {
    expect(sanitizeFaqItems(null)).toEqual([]);
    expect(sanitizeFaqItems(undefined)).toEqual([]);
    expect(sanitizeFaqItems('foo')).toEqual([]);
    expect(sanitizeFaqItems({ a: 1 })).toEqual([]);
  });

  it('descarta itens nulos, primitivos ou sem question', () => {
    const raw = [
      null,
      undefined,
      'string',
      42,
      {},
      { question: '' },
      { question: '   ' },
      { question: null },
      { question: 'Ok?', answer: 'Sim.' },
    ];
    const items = sanitizeFaqItems(raw, 'slug-x');
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ question: 'Ok?', answer: 'Sim.' });
  });

  it('normaliza answer ausente ou de tipo inválido para string vazia', () => {
    const raw = [
      { question: 'A?' },
      { question: 'B?', answer: null },
      { question: 'C?', answer: 123 },
      { question: 'D?', answer: { text: 'x' } },
      { question: 'E?', answer: 'ok' },
    ];
    const items = sanitizeFaqItems(raw);
    expect(items).toEqual([
      { question: 'A?', answer: '' },
      { question: 'B?', answer: '' },
      { question: 'C?', answer: '' },
      { question: 'D?', answer: '' },
      { question: 'E?', answer: 'ok' },
    ]);
  });

  it('faz trim de question', () => {
    const [item] = sanitizeFaqItems([{ question: '  Quê?  ', answer: 'x' }]);
    expect(item.question).toBe('Quê?');
  });

  it('preserva answer com quebras de linha sem alterar conteúdo', () => {
    const answer = 'Linha 1\n\nLinha 2';
    const [item] = sanitizeFaqItems([{ question: 'Q?', answer }]);
    expect(item.answer).toBe(answer);
  });

  it('reporta stats detalhados (kept, dropped, normalized)', () => {
    const raw = [
      { question: 'A?', answer: 'ok' },      // kept
      { question: 'B?' },                     // kept + normalized
      { question: '', answer: 'x' },          // dropped
      null,                                   // dropped
      { question: 'C?', answer: 42 },         // kept + normalized
    ];
    const { items, stats } = sanitizeFaqItemsDetailed(raw, 'test');
    expect(items).toHaveLength(3);
    expect(stats).toEqual({ total: 5, kept: 3, dropped: 2, normalized: 2 });
  });

  it('stats zerados quando entrada não é array', () => {
    const { items, stats } = sanitizeFaqItemsDetailed(null);
    expect(items).toEqual([]);
    expect(stats).toEqual({ total: 0, kept: 0, dropped: 0, normalized: 0 });
  });
});

describe('filterFaqForJsonLd', () => {
  it('remove itens sem question ou answer não-vazias', () => {
    const filtered = filterFaqForJsonLd([
      { question: 'A?', answer: 'ok' },
      { question: 'B?', answer: '' },
      { question: 'C?', answer: '   ' },
      { question: '', answer: 'x' },
      { question: 'D?', answer: 'resposta' },
    ]);
    expect(filtered).toEqual([
      { question: 'A?', answer: 'ok' },
      { question: 'D?', answer: 'resposta' },
    ]);
  });

  it('retorna [] para entrada inválida', () => {
    expect(filterFaqForJsonLd(null)).toEqual([]);
    expect(filterFaqForJsonLd(undefined)).toEqual([]);
    expect(filterFaqForJsonLd([])).toEqual([]);
  });

  it('garante que saída nunca contém answer vazio (invariante JSON-LD)', () => {
    const sanitized = sanitizeFaqItems([
      { question: 'A?', answer: null },
      { question: 'B?', answer: 'ok' },
    ]);
    const jsonLd = filterFaqForJsonLd(sanitized);
    for (const item of jsonLd) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
    expect(jsonLd).toHaveLength(1);
  });
});
