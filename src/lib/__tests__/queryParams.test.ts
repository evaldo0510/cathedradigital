import { describe, it, expect } from 'vitest';
import { getCanonicalQueryParam, getParagraphParam } from '@/lib/queryParams';

const sp = (qs: string) => new URLSearchParams(qs);

describe('getParagraphParam', () => {
  it('lê o canônico ?p=', () => {
    expect(getParagraphParam(sp('p=100'))).toBe('100');
  });

  it('lê o alias ?paragraph=', () => {
    expect(getParagraphParam(sp('paragraph=100'))).toBe('100');
  });

  it('trata ?p= e ?paragraph= como equivalentes para o mesmo valor', () => {
    expect(getParagraphParam(sp('p=1234'))).toBe(getParagraphParam(sp('paragraph=1234')));
  });

  it('canônico tem precedência sobre alias quando ambos presentes', () => {
    expect(getParagraphParam(sp('p=1&paragraph=999'))).toBe('1');
  });

  it('retorna null quando nenhum dos dois está presente', () => {
    expect(getParagraphParam(sp(''))).toBeNull();
    expect(getParagraphParam(sp('outro=42'))).toBeNull();
  });

  it('preserva string vazia (presente mas sem valor) — não confunde com ausente', () => {
    expect(getParagraphParam(sp('p='))).toBe('');
    expect(getParagraphParam(sp('paragraph='))).toBe('');
  });

  it('não valida valor numérico — devolve o que veio (validação é responsabilidade do chamador)', () => {
    expect(getParagraphParam(sp('paragraph=abc'))).toBe('abc');
    expect(getParagraphParam(sp('p=-1'))).toBe('-1');
  });

  it('lida com múltiplas ocorrências devolvendo a primeira (comportamento nativo)', () => {
    expect(getParagraphParam(sp('paragraph=1&paragraph=2'))).toBe('1');
  });
});

describe('getCanonicalQueryParam', () => {
  it('itera nomes na ordem fornecida', () => {
    expect(getCanonicalQueryParam(sp('b=2&a=1'), ['a', 'b'])).toBe('1');
    expect(getCanonicalQueryParam(sp('b=2&a=1'), ['b', 'a'])).toBe('2');
  });

  it('retorna null quando nenhum nome bate', () => {
    expect(getCanonicalQueryParam(sp('x=1'), ['a', 'b'])).toBeNull();
  });

  it('aceita lista vazia sem quebrar', () => {
    expect(getCanonicalQueryParam(sp('a=1'), [])).toBeNull();
  });
});
