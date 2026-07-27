import { describe, it, expect } from 'vitest';
import { sanitizeAnswerForJsonLd, buildFaqPageJsonLd } from '../sanitizeFaq';

describe('sanitizeAnswerForJsonLd', () => {
  it('remove blocos <script> completos', () => {
    const out = sanitizeAnswerForJsonLd('Olá <script>alert(1)</script> mundo');
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/alert/);
    expect(out).toContain('Olá');
    expect(out).toContain('mundo');
  });

  it('remove <iframe> e <style>', () => {
    expect(sanitizeAnswerForJsonLd('<iframe src="x"></iframe>a')).not.toMatch(/iframe/i);
    expect(sanitizeAnswerForJsonLd('<style>*{}</style>ok')).not.toMatch(/style/i);
  });

  it('remove handlers inline como onerror=', () => {
    const out = sanitizeAnswerForJsonLd('<img src=x onerror="alert(1)">texto');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/alert\(1\)/);
  });

  it('remove URIs javascript: e data:', () => {
    const out = sanitizeAnswerForJsonLd('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it('escapa entidades HTML restantes', () => {
    const out = sanitizeAnswerForJsonLd('5 < 10 & "aspas"');
    expect(out).toContain('&lt;');
    expect(out).toContain('&amp;');
    expect(out).toContain('&quot;');
  });

  it('remove caracteres de controle mas preserva \\n e \\t', () => {
    const out = sanitizeAnswerForJsonLd('a\x00b\x07c\ndef\tghi');
    expect(out).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
    expect(out).toContain('\n');
    expect(out).toContain('\t');
    expect(out).toContain('abc');
  });

  it('retorna string vazia para não-string', () => {
    expect(sanitizeAnswerForJsonLd(undefined)).toBe('');
    expect(sanitizeAnswerForJsonLd(null)).toBe('');
    expect(sanitizeAnswerForJsonLd(42)).toBe('');
  });

  it('buildFaqPageJsonLd usa a sanitização (sem <script> no JSON)', () => {
    const jsonLd = buildFaqPageJsonLd([
      { question: 'O que é fé?', answer: 'Virtude <script>alert(1)</script> teologal' },
    ]);
    expect(jsonLd).not.toBeNull();
    const text = jsonLd!.mainEntity[0].acceptedAnswer.text;
    expect(text).not.toMatch(/<script>/i);
    expect(text).not.toMatch(/alert/);
    expect(text).toContain('Virtude');
    expect(text).toContain('teologal');
  });

  it('buildFaqPageJsonLd retorna null se sanitização esvazia tudo', () => {
    const jsonLd = buildFaqPageJsonLd([
      { question: 'q', answer: '<script>alert(1)</script>' },
    ]);
    // answer fica vazio depois da limpeza; item removido; sem entradas -> null
    expect(jsonLd).toBeNull();
  });
});

describe('buildFaqPageJsonLd — perf com muitos itens', () => {
  it('gera JSON-LD para 250 itens em <200ms', () => {
    const items = Array.from({ length: 250 }, (_, i) => ({
      question: `Pergunta ${i} sobre teologia?`,
      answer: `Resposta ${i}. Contém <b>markup</b> e um pouco de \n texto \t normal. 5 < 10.`,
    }));
    const t0 = performance.now();
    const jsonLd = buildFaqPageJsonLd(items);
    const dur = performance.now() - t0;
    expect(jsonLd).not.toBeNull();
    expect(jsonLd!.mainEntity).toHaveLength(250);
    expect(dur).toBeLessThan(200);
  });

  it('serializa 500 itens sanitizados em <300ms', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      question: `Q${i}`,
      answer: `A${i} <script>x()</script> texto & "aspas".`,
    }));
    const jsonLd = buildFaqPageJsonLd(items);
    const t0 = performance.now();
    const serialized = JSON.stringify(jsonLd);
    const dur = performance.now() - t0;
    expect(serialized.length).toBeGreaterThan(0);
    expect(serialized).not.toMatch(/<script>/);
    expect(dur).toBeLessThan(300);
  });
});
