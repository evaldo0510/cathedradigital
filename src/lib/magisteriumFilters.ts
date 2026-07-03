/**
 * Lógica pura de filtragem, ordenação e realce para o Explorer de Magistério.
 * Isolada em módulo próprio para permitir testes unitários sem montar o React.
 */
import type { MagisteriumDocument } from '@/data/magisterium-urls';

export type MagisteriumSort = 'canonical' | 'chronological-asc' | 'chronological-desc';

/** Tamanho fixo da página do Explorer. Ajustado ao grid 3-col para não gerar
 *  linhas “órfãs” em desktop. */
export const MAGISTERIUM_PAGE_SIZE = 12;

export interface MagisteriumFilterState {
  search: string;
  category: string | null;
  themes: string[];
  sort: MagisteriumSort;
  /** Página 1-indexada. */
  page: number;
}

export const DEFAULT_FILTER_STATE: MagisteriumFilterState = {
  search: '',
  category: null,
  themes: [],
  sort: 'canonical',
  page: 1,
};

const dateKey = (d: MagisteriumDocument): string => d.date ?? `${d.year}`;

export function matchesSearch(doc: MagisteriumDocument, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    doc.title.toLowerCase().includes(q) ||
    doc.author.toLowerCase().includes(q) ||
    (doc.abbr?.toLowerCase().includes(q) ?? false) ||
    doc.themes.some(t => t.toLowerCase().includes(q)) ||
    doc.summary.toLowerCase().includes(q)
  );
}

export function filterAndSortDocuments(
  docs: readonly MagisteriumDocument[],
  state: MagisteriumFilterState,
  categoryOrder: Record<string, number>,
): MagisteriumDocument[] {
  const filtered = docs.filter(doc => {
    if (state.category && doc.category !== state.category) return false;
    if (state.themes.length > 0 && !state.themes.every(t => doc.themes.includes(t))) return false;
    return matchesSearch(doc, state.search);
  });

  if (state.sort === 'canonical') {
    return [...filtered].sort((a, b) => {
      const ca = categoryOrder[a.category] ?? 999;
      const cb = categoryOrder[b.category] ?? 999;
      if (ca !== cb) return ca - cb;
      return dateKey(a).localeCompare(dateKey(b));
    });
  }
  const dir = state.sort === 'chronological-asc' ? 1 : -1;
  return [...filtered].sort((a, b) => dir * dateKey(a).localeCompare(dateKey(b)));
}

// ---------------------------------------------------------------------------
// URL persistence
// ---------------------------------------------------------------------------

const PARAM_KEYS = { q: 'q', cat: 'cat', theme: 'theme', sort: 'sort' } as const;
const VALID_SORTS: MagisteriumSort[] = ['canonical', 'chronological-asc', 'chronological-desc'];

export function stateToSearchParams(state: MagisteriumFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.search) params.set(PARAM_KEYS.q, state.search);
  if (state.category) params.set(PARAM_KEYS.cat, state.category);
  for (const t of state.themes) params.append(PARAM_KEYS.theme, t);
  if (state.sort !== 'canonical') params.set(PARAM_KEYS.sort, state.sort);
  return params;
}

export function searchParamsToState(params: URLSearchParams): MagisteriumFilterState {
  const rawSort = params.get(PARAM_KEYS.sort);
  const sort = (VALID_SORTS as string[]).includes(rawSort ?? '')
    ? (rawSort as MagisteriumSort)
    : 'canonical';
  return {
    search: params.get(PARAM_KEYS.q) ?? '',
    category: params.get(PARAM_KEYS.cat),
    themes: params.getAll(PARAM_KEYS.theme),
    sort,
  };
}

/**
 * Merge somente as chaves do Explorer no URLSearchParams atual — preserva
 * outros params (`topic`, `doc`) usados por outros fluxos da página.
 */
export function mergeFilterParams(
  current: URLSearchParams,
  state: MagisteriumFilterState,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of Object.values(PARAM_KEYS)) next.delete(key);
  const patch = stateToSearchParams(state);
  patch.forEach((value, key) => next.append(key, value));
  return next;
}

// ---------------------------------------------------------------------------
// Highlight
// ---------------------------------------------------------------------------

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (!q || !text) return [{ text, match: false }];
  const re = new RegExp(`(${escapeRegex(q)})`, 'gi');
  const parts = text.split(re);
  return parts
    .filter(p => p.length > 0)
    .map(part => ({ text: part, match: part.toLowerCase() === q.toLowerCase() }));
}
