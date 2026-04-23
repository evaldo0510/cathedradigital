import { describe, it, expect } from 'vitest';
import { buildBibleUrl, parseVerseParam, BIBLE_ROUTE } from './bibleUrl';

describe('buildBibleUrl', () => {
  it('builds URL with book, ch and v', () => {
    expect(buildBibleUrl({ abbr: 'Jo', chapter: 3, verse: 16 })).toBe(
      `${BIBLE_ROUTE}?book=Jo&ch=3&v=16`
    );
  });

  it('omits v when verse is missing or falsy', () => {
    expect(buildBibleUrl({ abbr: 'Mt', chapter: 5 })).toBe(`${BIBLE_ROUTE}?book=Mt&ch=5`);
    expect(buildBibleUrl({ abbr: 'Mt', chapter: 5, verse: null })).toBe(`${BIBLE_ROUTE}?book=Mt&ch=5`);
    expect(buildBibleUrl({ abbr: 'Mt', chapter: 5, verse: 0 })).toBe(`${BIBLE_ROUTE}?book=Mt&ch=5`);
  });

  it('appends extra params', () => {
    expect(buildBibleUrl({ abbr: 'Sl', chapter: 23, extra: { from: 'dashboard' } })).toBe(
      `${BIBLE_ROUTE}?book=Sl&ch=23&from=dashboard`
    );
  });
});

describe('parseVerseParam', () => {
  it('returns the integer when valid', () => {
    expect(parseVerseParam('16')).toBe(16);
    expect(parseVerseParam('1')).toBe(1);
  });

  it('returns null for invalid values', () => {
    expect(parseVerseParam(null)).toBeNull();
    expect(parseVerseParam('')).toBeNull();
    expect(parseVerseParam('abc')).toBeNull();
    expect(parseVerseParam('0')).toBeNull();
    expect(parseVerseParam('-3')).toBeNull();
    expect(parseVerseParam('3.5')).toBeNull();
    expect(parseVerseParam('999')).toBeNull();
  });
});
