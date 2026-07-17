/**
 * useFuzzySearch — shared client for fuzzy-search RPCs.
 *
 * Encapsulates the pattern repeated across Saints, Glossary, Community and
 * Themes pages: debounce the query, call a Postgres `search_*_fuzzy` RPC,
 * and decorate each row with a client-side `similarityScore` so the UI can
 * render <RelevanceBadge /> instantly without waiting for a second round-trip.
 *
 * Usage:
 *   const { results, isSearching, isPending } = useFuzzySearch({
 *     rpc: 'search_saints_fuzzy',
 *     query,
 *     primaryField: 'name',
 *     secondaryField: 'title',
 *   });
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';
import { combinedSimilarity } from '@/lib/similarity';

/**
 * Names of the RPCs that follow the `search_*_fuzzy(search_query, result_limit)`
 * contract. Using a string union keeps Supabase's typed client happy while
 * letting callers pass the function name as a value.
 */
export type FuzzyRpcName =
  | 'search_saints_fuzzy'
  | 'search_glossary_fuzzy'
  | 'search_community_posts_fuzzy'
  | 'search_tags_fuzzy'
  | 'search_journeys_fuzzy';

export interface UseFuzzySearchOptions<TRow> {
  /** Name of the Postgres RPC. Must match the FuzzyRpcName union. */
  rpc: FuzzyRpcName;
  /** Raw user input. The hook debounces it internally. */
  query: string;
  /** Field used as the primary similarity signal (e.g. "name", "term", "label"). */
  primaryField: keyof TRow;
  /** Optional secondary signal (e.g. "title", "definition", "content"). */
  secondaryField?: keyof TRow;
  /** Weight applied to the secondary similarity. Defaults to 0.7. */
  secondaryWeight?: number;
  /** Minimum query length before firing a request. Defaults to 2. */
  minLength?: number;
  /** Debounce delay in ms. Defaults to 300. */
  debounceMs?: number;
  /** Hard cap on returned rows. Defaults to 50. */
  resultLimit?: number;
}

export interface FuzzyRow {
  similarityScore?: number;
}

export interface UseFuzzySearchResult<TRow> {
  /** Ranked rows from the RPC, or `null` when the query is too short. */
  results: (TRow & FuzzyRow)[] | null;
  /** True while a network request is in flight. */
  isSearching: boolean;
  /** True while the debounce timer is pending (query !== debouncedQuery). */
  isPending: boolean;
  /** Last RPC error, if any. */
  error: Error | null;
  /** Re-executes the last query, useful after a transient backend error. */
  refetch: () => void;
}

export function useFuzzySearch<TRow>(
  options: UseFuzzySearchOptions<TRow>,
): UseFuzzySearchResult<TRow> {
  const {
    rpc,
    query,
    primaryField,
    secondaryField,
    secondaryWeight = 0.7,
    minLength = 2,
    debounceMs = 300,
    resultLimit = 50,
  } = options;

  const debouncedQuery = useDebounce(query, debounceMs);
  const [results, setResults] = useState<(TRow & FuzzyRow)[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const trimmed = debouncedQuery.trim();
  const isPending = query.trim().length >= minLength && (query.trim() !== trimmed || isSearching);

  useEffect(() => {
    if (trimmed.length < minLength) {
      setResults(null);
      setIsSearching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setError(null);

    (async () => {
      const { data, error: rpcError } = await (supabase.rpc as unknown as (
        fn: string,
        args: { search_query: string; result_limit: number },
      ) => Promise<{ data: TRow[] | null; error: Error | null }>)(rpc, {
        search_query: trimmed,
        result_limit: resultLimit,
      });

      if (cancelled) return;

      if (rpcError) {
        console.error(`[useFuzzySearch] ${rpc} failed:`, rpcError);
        setError(rpcError);
        setResults(null);
      } else {
        const rows = (data ?? []).map(row => {
          const r = row as Record<string, unknown>;
          return {
            ...row,
            similarityScore: combinedSimilarity(
              trimmed,
              String(r[primaryField as string] ?? ''),
              secondaryField ? String(r[secondaryField as string] ?? '') : undefined,
              secondaryWeight,
            ),
          };
        }) as (TRow & FuzzyRow)[];
        setResults(rows);
      }
      setIsSearching(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpc, trimmed, primaryField, secondaryField, secondaryWeight, minLength, resultLimit, retryTick]);

  return { results, isSearching, isPending, error, refetch: () => setRetryTick(t => t + 1) };
}
