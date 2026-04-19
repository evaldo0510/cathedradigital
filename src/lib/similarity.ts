/**
 * Shared similarity helpers for search UX (Saints, Glossary, Community...).
 *
 * Authoritative ranking comes from Postgres (pg_trgm + unaccent), but we
 * compute a lightweight client-side approximation so we can render relevance
 * badges immediately without an extra round-trip.
 */

/** Lowercase + strip diacritics so "Tomás" and "tomas" match. */
const norm = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const trigrams = (s: string): Set<string> => {
  const padded = `  ${s} `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
};

/**
 * Trigram-style similarity score between `query` and `target`, clamped to [0, 1].
 * Returns 0 for empty inputs. Substring matches receive a small boost so partial
 * queries like "tomas" rank highly against "São Tomás de Aquino".
 */
export const computeSimilarity = (query: string, target: string): number => {
  if (!query || !target) return 0;
  const q = norm(query);
  const t = norm(target);
  if (t.includes(q)) return Math.min(1, q.length / Math.max(t.length, 1) + 0.5);

  const a = trigrams(q);
  const b = trigrams(t);
  let shared = 0;
  a.forEach(g => { if (b.has(g)) shared++; });
  return shared / (a.size + b.size - shared || 1);
};

/**
 * Combine two field similarities with a configurable secondary weight
 * (e.g. name vs title, term vs definition). Mirrors the SQL ranking.
 */
export const combinedSimilarity = (
  query: string,
  primary: string,
  secondary?: string,
  secondaryWeight = 0.7,
): number =>
  Math.max(
    computeSimilarity(query, primary || ''),
    computeSimilarity(query, secondary || '') * secondaryWeight,
  );

export interface ScoreToneTokens {
  /** Tailwind classes for background/text/border (semantic tokens only). */
  classes: string;
  /** Integer percentage to display, 0–100. */
  pct: number;
}

/**
 * Map a 0–1 similarity score to UI tokens for a relevance badge.
 * Thresholds calibrated to actual pg_trgm scores (partial matches ≈ 0.25–0.5).
 */
export const scoreToTone = (score: number | undefined | null): ScoreToneTokens | null => {
  if (typeof score !== 'number' || score <= 0) return null;
  const pct = Math.round(Math.min(1, score) * 100);
  const classes =
    pct >= 50
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : pct >= 25
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
        : 'bg-muted text-muted-foreground border-border';
  return { classes, pct };
};
