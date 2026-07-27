import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildFaqPageJsonLd, FaqPageJsonLdSchema } from '../sanitizeFaq';

describe('buildFaqPageJsonLd — Zod runtime validation', () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
  });

  it('emite JSON-LD válido para input saudável', () => {
    const out = buildFaqPageJsonLd([
      { question: 'O que é fé?', answer: 'Virtude teologal.' },
    ]);
    expect(out).not.toBeNull();
    const parsed = FaqPageJsonLdSchema.safeParse(out);
    expect(parsed.success).toBe(true);
    expect(errSpy).not.toHaveBeenCalled();
  });

  it('descarta e loga quando todos os itens ficam vazios após sanitização', () => {
    const out = buildFaqPageJsonLd([
      { question: '<script>a</script>', answer: '<script>b</script>' },
    ]);
    expect(out).toBeNull();
  });

  it('nunca produz name ou text vazio no mainEntity', () => {
    const out = buildFaqPageJsonLd([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: '   ' }, // deve ser filtrado
      { question: '   ', answer: 'A3' }, // deve ser filtrado
      { question: 'Q4', answer: 'A4' },
    ]);
    expect(out).not.toBeNull();
    for (const q of out!.mainEntity) {
      expect(q.name.trim().length).toBeGreaterThan(0);
      expect(q.acceptedAnswer.text.trim().length).toBeGreaterThan(0);
    }
    expect(out!.mainEntity.length).toBe(2);
  });
});
