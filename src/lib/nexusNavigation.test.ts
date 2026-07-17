import { describe, it, expect, vi } from 'vitest';
import {
  catechismInternalPath,
  isValidCatechismParagraph,
  openNexusRef,
} from './nexusNavigation';

describe('isValidCatechismParagraph', () => {
  it('aceita inteiros entre 1 e 2865', () => {
    expect(isValidCatechismParagraph(1)).toBe(true);
    expect(isValidCatechismParagraph(1234)).toBe(true);
    expect(isValidCatechismParagraph(2865)).toBe(true);
  });

  it('rejeita fora de faixa, decimais, NaN e strings', () => {
    expect(isValidCatechismParagraph(0)).toBe(false);
    expect(isValidCatechismParagraph(-1)).toBe(false);
    expect(isValidCatechismParagraph(2866)).toBe(false);
    expect(isValidCatechismParagraph(1.5)).toBe(false);
    expect(isValidCatechismParagraph(NaN)).toBe(false);
    expect(isValidCatechismParagraph('abc')).toBe(false);
    expect(isValidCatechismParagraph(undefined)).toBe(false);
  });
});

describe('catechismInternalPath', () => {
  it('gera rota canônica /catechism?p=N para valores válidos', () => {
    expect(catechismInternalPath(1)).toBe('/catechism?p=1');
    expect(catechismInternalPath(2865)).toBe('/catechism?p=2865');
  });

  it('cai no índice /catechism sem query para valores inválidos', () => {
    expect(catechismInternalPath(0)).toBe('/catechism');
    expect(catechismInternalPath(-1)).toBe('/catechism');
    expect(catechismInternalPath(NaN)).toBe('/catechism');
    expect(catechismInternalPath(3000)).toBe('/catechism');
    expect(catechismInternalPath('abc')).toBe('/catechism');
  });

  it('nunca retorna URL absoluta (http/https)', () => {
    for (const v of [1, 100, 9999, -1, NaN, 'x']) {
      expect(catechismInternalPath(v as any)).not.toMatch(/^https?:/);
    }
  });
});

describe('openNexusRef', () => {
  it('roteia catechism para path interno', () => {
    const nav = vi.fn();
    openNexusRef(nav as any, { kind: 'catechism', paragraph: 42 });
    expect(nav).toHaveBeenCalledWith('/catechism?p=42');
  });

  it('roteia tag/saint/bible para rotas internas', () => {
    const nav = vi.fn();
    openNexusRef(nav as any, { kind: 'tag', slug: 'graca' });
    openNexusRef(nav as any, { kind: 'saint', slug: 'agostinho' });
    openNexusRef(nav as any, { kind: 'bible', book: 'Jo', chapter: 1, verse: 1 });
    const calls = nav.mock.calls.map((c) => c[0] as string);
    expect(calls.every((p) => p.startsWith('/'))).toBe(true);
    expect(calls.some((p) => p.includes('://'))).toBe(false);
  });
});
