/**
 * Bible Recovery Mode — automated checker.
 *
 * Abre o capítulo 1 de cada livro do cânone, valida idioma, ausência
 * de capítulos vazios e tempo de abertura. Pode ser usado pelo painel
 * de diagnóstico e por um teste automatizado de regressão.
 */
import { supabase } from '@/integrations/supabase/client';
import { BIBLE_DATA, type BibleBook } from '@/data/bible-books';
import { FORBIDDEN_ENGLISH_WORDS } from '@/constants/language-config';
import { bibleRecoveryStore, inspectChapterResult, reportNavigationError } from './bibleRecoveryStore';

export interface ValidationRow {
  book: string;
  abbr: string;
  chapter: number;
  language: 'Português' | 'Inglês' | 'Desconhecido';
  openMs: number;
  result: 'OK' | 'VAZIO' | 'INGLÊS' | 'LENTO' | 'ERRO';
  evidence?: string;
}

const FORBIDDEN_RX = new RegExp(
  `\\b(${FORBIDDEN_ENGLISH_WORDS.join('|')}|Tobit|Judith|Wisdom|Sirach|Baruch|Maccabees)\\b`,
  'i'
);

const SLOW_MS = 1500;

export function getAllBooks(): BibleBook[] {
  return Object.values(BIBLE_DATA).flat().flatMap((cat) => cat.books);
}

export async function checkBookChapter(book: BibleBook, chapter = 1): Promise<ValidationRow> {
  const t0 = performance.now();
  try {
    const { data, error } = await supabase.functions.invoke('bible-text', {
      body: { abbrev: book.abbr, chapter },
    });
    const openMs = Math.round(performance.now() - t0);

    if (error || !data) {
      reportNavigationError(book.name, chapter, error || 'sem resposta');
      return { book: book.name, abbr: book.abbr, chapter, language: 'Desconhecido', openMs, result: 'ERRO' };
    }

    const verses = (data as any).verses as Array<{ number: number; text: string }> | undefined;
    inspectChapterResult(book.name, chapter, verses);

    if (!verses || verses.length === 0) {
      return { book: book.name, abbr: book.abbr, chapter, language: 'Desconhecido', openMs, result: 'VAZIO' };
    }

    const sample = verses.map((v) => v.text).join(' ').slice(0, 600);
    const enHit = FORBIDDEN_RX.exec(sample);
    if (enHit) {
      return {
        book: book.name,
        abbr: book.abbr,
        chapter,
        language: 'Inglês',
        openMs,
        result: 'INGLÊS',
        evidence: enHit[0],
      };
    }

    return {
      book: book.name,
      abbr: book.abbr,
      chapter,
      language: 'Português',
      openMs,
      result: openMs > SLOW_MS ? 'LENTO' : 'OK',
    };
  } catch (e) {
    const openMs = Math.round(performance.now() - t0);
    reportNavigationError(book.name, chapter, e);
    return { book: book.name, abbr: book.abbr, chapter, language: 'Desconhecido', openMs, result: 'ERRO' };
  }
}

export async function runRecoveryCheck(
  onProgress?: (done: number, total: number, row: ValidationRow) => void
): Promise<ValidationRow[]> {
  bibleRecoveryStore.clear();
  const books = getAllBooks();
  const rows: ValidationRow[] = [];
  const CONCURRENCY = 4;
  let i = 0;

  async function worker() {
    while (i < books.length) {
      const idx = i++;
      const row = await checkBookChapter(books[idx], 1);
      rows.push(row);
      onProgress?.(rows.length, books.length, row);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  // sort canonically by original order
  const order = new Map(books.map((b, idx) => [b.abbr, idx]));
  rows.sort((a, b) => (order.get(a.abbr)! - order.get(b.abbr)!));
  return rows;
}

export function summarize(rows: ValidationRow[]) {
  return {
    total: rows.length,
    ok: rows.filter((r) => r.result === 'OK').length,
    empty: rows.filter((r) => r.result === 'VAZIO').length,
    english: rows.filter((r) => r.result === 'INGLÊS').length,
    slow: rows.filter((r) => r.result === 'LENTO').length,
    error: rows.filter((r) => r.result === 'ERRO').length,
    avgMs: rows.length ? Math.round(rows.reduce((s, r) => s + r.openMs, 0) / rows.length) : 0,
  };
}
