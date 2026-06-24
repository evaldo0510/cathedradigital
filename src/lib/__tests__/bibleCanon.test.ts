import { describe, it, expect } from 'vitest';
import {
  BIBLE_CANON,
  BOLLS_MAP,
  findBookByAbbr,
  bookNameFromAbbr,
  normalizeAbbr,
} from '@/lib/bibleCanon';

describe('bibleCanon (frontend): findBookByAbbr', () => {
  it('resolve case-insensitive todas as abreviações canônicas', () => {
    for (const book of BIBLE_CANON) {
      const variants = [
        book.abbr,
        book.abbr.toLowerCase(),
        book.abbr.toUpperCase(),
        book.abbr.charAt(0).toLowerCase() + book.abbr.slice(1),
      ];
      for (const v of variants) {
        const found = findBookByAbbr(v);
        expect(found, `findBookByAbbr("${v}")`).toBeDefined();
        expect(found!.bollsId).toBe(book.bollsId);
      }
    }
  });

  it('aceita aliases legados (Job, Mal, Jon, Mi, Hab, Sof, Abd, Zac)', () => {
    expect(findBookByAbbr('Job')?.abbr).toBe('Jó');
    expect(findBookByAbbr('job')?.abbr).toBe('Jó');
    expect(findBookByAbbr('Mal')?.abbr).toBe('Ml');
    expect(findBookByAbbr('Jon')?.abbr).toBe('Jn');
    expect(findBookByAbbr('Mi')?.abbr).toBe('Mq');
    expect(findBookByAbbr('Hab')?.abbr).toBe('Hc');
    expect(findBookByAbbr('Sof')?.abbr).toBe('Sf');
    expect(findBookByAbbr('Abd')?.abbr).toBe('Ab');
    expect(findBookByAbbr('Zac')?.abbr).toBe('Zc');
  });

  it('retorna undefined para entrada vazia ou desconhecida sem lançar', () => {
    expect(findBookByAbbr('')).toBeUndefined();
    expect(findBookByAbbr('xyz')).toBeUndefined();
    expect(findBookByAbbr('???')).toBeUndefined();
    expect(findBookByAbbr('   ')).toBeUndefined();
  });
});

describe('bibleCanon (frontend): normalizeAbbr', () => {
  const valid: Array<[string, string, number]> = [
    // espaço entre dígito e letras
    ['2 Cr', '2Cr', 14],
    ['1 Rs', '1Rs', 11],
    ['2 Sm', '2Sm', 10],
    ['1 Co', '1Co', 46],
    ['2 Mc', '2Mc', 73],
    // pontuação
    ['2.Cr', '2Cr', 14],
    ['2-cr', '2Cr', 14],
    ['1_tm', '1Tm', 54],
    // caixa mista
    ['1 tm', '1Tm', 54],
    ['1 TM', '1Tm', 54],
    ['2cR', '2Cr', 14],
    // espaços extras
    ['  2  Cr  ', '2Cr', 14],
    ['\t1\tTm\n', '1Tm', 54],
    // já canônico
    ['1Tm', '1Tm', 54],
    ['Mt', 'Mt', 40],
    ['mt', 'Mt', 40],
    ['SL', 'Sl', 19],
    // aliases
    ['job', 'Jó', 18],
    ['MAL', 'Ml', 39],
  ];

  it.each(valid)('normaliza "%s" → "%s" (bollsId %i)', (input, expectedAbbr, bollsId) => {
    expect(normalizeAbbr(input)).toBe(expectedAbbr);
    expect(findBookByAbbr(input)?.bollsId).toBe(bollsId);
  });

  it('entradas inválidas não lançam e retornam fallback consistente', () => {
    // string vazia: retorna a própria string
    expect(normalizeAbbr('')).toBe('');
    // desconhecida: retorna trim do input, mas NÃO resolve no canon
    expect(normalizeAbbr('xyz')).toBe('xyz');
    expect(findBookByAbbr('xyz')).toBeUndefined();
    expect(normalizeAbbr('   zzz   ')).toBe('zzz');
    expect(findBookByAbbr('   zzz   ')).toBeUndefined();
    // só pontuação/espaços não resolve a livro nenhum
    expect(findBookByAbbr('...')).toBeUndefined();
    expect(findBookByAbbr('---')).toBeUndefined();
  });

  it('BOLLS_MAP devolve bollsId para forma canônica resolvida', () => {
    expect(BOLLS_MAP[normalizeAbbr('2 Cr')]).toBe(14);
    expect(BOLLS_MAP[normalizeAbbr('1 tm')]).toBe(54);
    expect(BOLLS_MAP[normalizeAbbr('Mt')]).toBe(40);
    expect(BOLLS_MAP[normalizeAbbr('xyz')]).toBeUndefined();
  });

  it('bookNameFromAbbr funciona via forma normalizada', () => {
    expect(bookNameFromAbbr(normalizeAbbr('2 Cr'))).toBe('2 Crônicas');
    expect(bookNameFromAbbr(normalizeAbbr('1 tm'))).toBe('1 Timóteo');
    expect(bookNameFromAbbr('xyz')).toBe('xyz'); // fallback identidade
  });
});
