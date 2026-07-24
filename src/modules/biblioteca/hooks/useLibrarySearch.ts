/**
 * Sprint B.1 · Onda B.1.2 — Hook único de busca da Biblioteca.
 *
 * A UI consome APENAS este hook. Debounce, cache (React Query) e cancelamento
 * ficam encapsulados aqui — nenhum componente conhece a camada `supabase`.
 */
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { LibraryModule } from '../types';
import { searchLibrary } from '../search/searchLibrary';
import type { LibrarySearchResponse } from '../search/types';

export interface UseLibrarySearchInput {
  query: string;
  types?: LibraryModule[] | 'all';
  perModule?: number;
  withNexus?: boolean;
  /** Debounce em ms. Default 220. */
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseLibrarySearchResult {
  data: LibrarySearchResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  debouncedQuery: string;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useLibrarySearch(input: UseLibrarySearchInput): UseLibrarySearchResult {
  const {
    query,
    types = 'all',
    perModule,
    withNexus = true,
    debounceMs = 220,
    enabled = true,
  } = input;

  const debouncedQuery = useDebouncedValue(query.trim(), debounceMs);
  const typesKey = useMemo(
    () => (types === 'all' ? 'all' : [...types].sort().join(',')),
    [types],
  );

  const q = useQuery<LibrarySearchResponse>({
    queryKey: ['library-search', debouncedQuery, typesKey, perModule ?? null, withNexus],
    queryFn: () =>
      searchLibrary({ query: debouncedQuery, types, perModule, withNexus }),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return {
    data: q.data,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    error: (q.error as Error | null) ?? null,
    debouncedQuery,
  };
}
