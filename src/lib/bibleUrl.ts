/**
 * Single source of truth for building Bible deep-links.
 * Always uses query params: book, ch, v.
 *
 * Use this everywhere instead of constructing URLs by hand to avoid
 * divergence (e.g. /biblia vs /bible, ?chapter= vs ?ch=, ?verse= vs ?v=).
 */

export const BIBLE_ROUTE = '/bible';

export interface BibleUrlInput {
  abbr: string;
  chapter: number | string;
  verse?: number | string | null;
  /** Optional extra params (e.g. from=dashboard) */
  extra?: Record<string, string>;
}

export function buildBibleUrl({ abbr, chapter, verse, extra }: BibleUrlInput): string {
  const params = new URLSearchParams();
  params.set('book', String(abbr));
  params.set('ch', String(chapter));
  if (verse !== undefined && verse !== null && verse !== '' && Number(verse) > 0) {
    params.set('v', String(verse));
  }
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  }
  return `${BIBLE_ROUTE}?${params.toString()}`;
}

export function buildBibleAbsoluteUrl(input: BibleUrlInput, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${buildBibleUrl(input)}`;
}

/** Parse a verse query value safely. Returns null if invalid. */
export function parseVerseParam(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 200) return null;
  return n;
}
