import { describe, it, expect } from 'vitest';
import { buildFaqPageJsonLd, explainFaqSanitization, FaqPageJsonLdSchema } from '../sanitizeFaq';

describe('question sanitization + JSON-LD integridade', () => {
  it('sanitiza <script> na question sem gerar name vazio', () => {
    const jsonLd = buildFaqPageJsonLd([
      { question: 'Fé <script>alert(1)</script>?', answer: 'Resposta válida.' },
    ]);
    expect(jsonLd).not.toBeNull();
    const name = jsonLd!.mainEntity[0].name;
    expect(name).not.toMatch(/<script>/i);
    expect(name).not.toMatch(/alert/);
    expect(name.length).toBeGreaterThan(0);
  });

  it('descarta item quando question fica vazia após sanitização', () => {
    const jsonLd = buildFaqPageJsonLd([
      { question: '<script>x()</script>', answer: 'Resposta ok.' },
      { question: 'Válida?', answer: 'Sim.' },
    ]);
    expect(jsonLd).not.toBeNull();
    expect(jsonLd!.mainEntity).toHaveLength(1);
    expect(jsonLd!.mainEntity[0].name).toBe('Válida?');
  });

  it('nunca emite name/text vazios no JSON-LD final (Zod garante)', () => {
    const items = [
      { question: '   ', answer: 'x' },
      { question: 'q', answer: '   ' },
      { question: '<iframe></iframe>', answer: '<script>y()</script>' },
      { question: 'ok', answer: 'ok' },
    ];
    const jsonLd = buildFaqPageJsonLd(items);
    expect(jsonLd).not.toBeNull();
    // Zod valida no build; forçamos re-parse aqui só como garantia extra
    const parsed = FaqPageJsonLdSchema.safeParse(jsonLd);
    expect(parsed.success).toBe(true);
    for (const q of jsonLd!.mainEntity) {
      expect(q.name.trim().length).toBeGreaterThan(0);
      expect(q.acceptedAnswer.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('remove control chars da question', () => {
    const jsonLd = buildFaqPageJsonLd([
      { question: 'O\x00 q\x07ue?', answer: 'ok' },
    ]);
    const name = jsonLd!.mainEntity[0].name;
    expect(name).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
    expect(name).toContain('O');
    expect(name).toContain('que?');
  });

  it('memoiza builds por referência do array', () => {
    const items = [{ question: 'q', answer: 'a' }];
    const a = buildFaqPageJsonLd(items);
    const b = buildFaqPageJsonLd(items);
    expect(a).toBe(b); // mesma referência retornada do cache
  });

  it('não memoiza entre arrays diferentes com conteúdo igual', () => {
    const a = buildFaqPageJsonLd([{ question: 'q', answer: 'a' }]);
    const b = buildFaqPageJsonLd([{ question: 'q', answer: 'a' }]);
    // conteúdo idêntico mas refs distintas → objetos distintos
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('explainFaqSanitization — diff bruto x sanitizado', () => {
  it('reporta remoções de tags perigosas em question e answer', () => {
    const diff = explainFaqSanitization([
      { question: 'Fé <script>x()</script>?', answer: '<iframe></iframe>Resp' },
    ]);
    expect(diff).toHaveLength(1);
    const [d] = diff;
    expect(d.questionChanged).toBe(true);
    expect(d.answerChanged).toBe(true);
    expect(d.removedFromQuestion.join(' ')).toMatch(/script/i);
    expect(d.removedFromAnswer.join(' ')).toMatch(/iframe/i);
    expect(d.dropped).toBe(false);
  });

  it('marca item como dropped quando sanitização esvazia', () => {
    const diff = explainFaqSanitization([
      { question: '<script>x()</script>', answer: 'ok' },
    ]);
    expect(diff[0].dropped).toBe(true);
    expect(diff[0].reason).toMatch(/question/);
  });

  it('detecta control chars no diff', () => {
    const diff = explainFaqSanitization([
      { question: 'a\x00b', answer: 'ok' },
    ]);
    expect(diff[0].removedFromQuestion).toContain('[control-chars]');
  });

  it('retorna [] para entrada não-array', () => {
    expect(explainFaqSanitization(null)).toEqual([]);
    expect(explainFaqSanitization('nope')).toEqual([]);
  });
});
