import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  cacheLiturgicalMonth,
  getCachedLiturgicalMonth,
  liturgicalCalendarKey,
} from '@/lib/offlineCache';


/**
 * Cache em camadas para o calendário litúrgico:
 *
 *   React Query (memória, instantâneo)
 *     ↳ IndexedDB (`liturgical-calendar`, TTL 7 dias) — persiste entre sessões
 *         ↳ Edge Function `liturgical-calendar` — fallback de rede
 *
 * O hook expõe:
 *  - `refresh()`              → força nova ida à edge function e sincroniza IDB + RQ.
 *  - `meta`                   → `{ source, cachedAt, ageMs, ttlMs }` para UI de diagnóstico.
 *  - hits/misses contabilizados em `getLiturgicalCacheStats()`.
 */

export interface ApiCelebration {
  title: string;
  colour: string;
  rank: string;
}

export interface ApiDayData {
  date: string;
  season: string;
  celebrations: ApiCelebration[];
}

export type LiturgicalMonthMap = Record<string, ApiDayData>;

export type CacheSource = 'fresh-cache' | 'stale-cache' | 'network' | 'network-after-stale' | 'pending';

export interface CacheMeta {
  source: CacheSource;
  cachedAt: number | null;
  ageMs: number | null;
  ttlMs: number;
}

interface Options {
  calendar?: string;
  lang?: string;
  /** Prefetch silenciosamente o mês anterior e o próximo. Default: true. */
  prefetchAdjacent?: boolean;
}

export const LITURGICAL_CALENDAR_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const STALE_24H = 1000 * 60 * 60 * 24;
const GC_7D = LITURGICAL_CALENDAR_TTL_MS;

const STATS_KEY = 'cathedra_litcal_stats';
const CACHE_UPDATED_EVENT = 'cathedra-litcal-cache-updated';

export interface LiturgicalCacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  networkErrors: number;
}

interface StatsStore {
  totals: LiturgicalCacheStats;
  perKey: Record<string, LiturgicalCacheStats>;
}

const emptyStats = (): LiturgicalCacheStats => ({ hits: 0, misses: 0, staleHits: 0, networkErrors: 0 });
const emptyStore = (): StatsStore => ({ totals: emptyStats(), perKey: {} });

const readStore = (): StatsStore => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STATS_KEY) : null;
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    // Backward-compat com o formato antigo (flat)
    if (parsed && typeof parsed === 'object' && 'totals' in parsed && 'perKey' in parsed) {
      return { totals: { ...emptyStats(), ...parsed.totals }, perKey: parsed.perKey ?? {} };
    }
    return { totals: { ...emptyStats(), ...parsed }, perKey: {} };
  } catch {
    return emptyStore();
  }
};

const bumpStat = (stat: keyof LiturgicalCacheStats, monthKey?: string) => {
  if (typeof window === 'undefined') return;
  const store = readStore();
  store.totals[stat] += 1;
  if (monthKey) {
    const cur = store.perKey[monthKey] ?? emptyStats();
    cur[stat] += 1;
    store.perKey[monthKey] = cur;
  }
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(CACHE_UPDATED_EVENT, { detail: { stat, monthKey } }));
  } catch { /* silent */ }
};

export const getLiturgicalCacheStats = (): LiturgicalCacheStats => readStore().totals;
export const getLiturgicalCacheStatsByKey = (): Record<string, LiturgicalCacheStats> => readStore().perKey;
export const getLiturgicalCacheStatsForKey = (key: string): LiturgicalCacheStats =>
  readStore().perKey[key] ?? emptyStats();

export const resetLiturgicalCacheStats = () => {
  try {
    window.localStorage.removeItem(STATS_KEY);
    window.dispatchEvent(new CustomEvent(CACHE_UPDATED_EVENT, { detail: { stat: 'reset' } }));
  } catch { /* silent */ }
};

/** Remove as estatísticas de uma chave específica (chamado ao deletar a entrada). */
export const resetLiturgicalCacheStatsForKey = (monthKey: string) => {
  try {
    const store = readStore();
    if (store.perKey[monthKey]) {
      delete store.perKey[monthKey];
      window.localStorage.setItem(STATS_KEY, JSON.stringify(store));
      window.dispatchEvent(new CustomEvent(CACHE_UPDATED_EVENT, { detail: { stat: 'reset', monthKey } }));
    }
  } catch { /* silent */ }
};


const buildKey = (year: number, month: number, calendar: string, lang: string) =>
  ['liturgical-month', calendar, lang, year, month] as const;

interface FetchOpts {
  force?: boolean;
  silent?: boolean; // não contabiliza hit/miss (usado em prefetch adjacente)
}

async function fetchMonth(
  year: number,
  month: number,
  calendar: string,
  lang: string,
  { force = false, silent = false }: FetchOpts = {},
): Promise<LiturgicalMonthMap> {
  const monthKey = liturgicalCalendarKey(year, month, calendar, lang);

  // 1) IndexedDB primeiro (a menos que force=true)
  const cached = await getCachedLiturgicalMonth(year, month, { calendar, lang });
  if (!force && cached && !cached.isStale && cached.data) {
    if (!silent) bumpStat('hits', monthKey);
    return cached.data as LiturgicalMonthMap;
  }

  if (!force && cached?.isStale && !silent) bumpStat('staleHits', monthKey);
  else if (!silent) bumpStat('misses', monthKey);

  // 2) Edge function
  try {
    const { data, error } = await supabase.functions.invoke('liturgical-calendar', {
      body: { action: 'month', year, month, lang, calendar },
    });
    if (error) throw error;

    const map: LiturgicalMonthMap = {};
    if (Array.isArray(data)) {
      for (const d of data as ApiDayData[]) map[d.date] = d;
    }
    void cacheLiturgicalMonth(year, month, map, { calendar, lang });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CACHE_UPDATED_EVENT, { detail: { year, month, source: 'network', monthKey } }));
    }
    return map;
  } catch (err) {
    if (!silent) bumpStat('networkErrors', monthKey);
    if (cached?.data) return cached.data as LiturgicalMonthMap; // fallback offline
    throw err;
  }
}


async function ensureMonth(
  queryClient: QueryClient,
  year: number,
  month: number,
  calendar: string,
  lang: string,
) {
  await queryClient.prefetchQuery({
    queryKey: buildKey(year, month, calendar, lang),
    queryFn: () => fetchMonth(year, month, calendar, lang, { silent: true }),
    staleTime: STALE_24H,
    gcTime: GC_7D,
  });
}

/**
 * Força refetch do mês indicado (ignora cache fresh) e sincroniza IDB + React Query.
 * Retorna o novo mapa.
 */
export async function refreshLiturgicalMonth(
  queryClient: QueryClient,
  year: number,
  month: number,
  calendar = 'general-la',
  lang = 'la',
): Promise<LiturgicalMonthMap> {
  const data = await fetchMonth(year, month, calendar, lang, { force: true });
  queryClient.setQueryData(buildKey(year, month, calendar, lang), data);
  return data;
}

/** Lê meta do entry persistido em IndexedDB para fins de diagnóstico. */
function useCacheMeta(year: number, month: number, calendar: string, lang: string): CacheMeta {
  const [meta, setMeta] = useState<CacheMeta>({
    source: 'pending', cachedAt: null, ageMs: null, ttlMs: LITURGICAL_CALENDAR_TTL_MS,
  });

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const entry = await getCachedLiturgicalMonth(year, month, { calendar, lang });
      if (!mounted) return;
      if (!entry) {
        setMeta({ source: 'pending', cachedAt: null, ageMs: null, ttlMs: LITURGICAL_CALENDAR_TTL_MS });
        return;
      }
      setMeta({
        source: entry.isStale ? 'stale-cache' : 'fresh-cache',
        cachedAt: entry.cachedAt,
        ageMs: Date.now() - entry.cachedAt,
        ttlMs: LITURGICAL_CALENDAR_TTL_MS,
      });
    };
    refresh();
    const handler = () => refresh();
    window.addEventListener(CACHE_UPDATED_EVENT, handler);
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      mounted = false;
      window.removeEventListener(CACHE_UPDATED_EVENT, handler);
      window.clearInterval(interval);
    };
  }, [year, month, calendar, lang]);

  return meta;
}

export function useLiturgicalMonth(year: number, month: number, options: Options = {}) {
  const { calendar = 'general-la', lang = 'la', prefetchAdjacent = true } = options;
  const queryClient = useQueryClient();

  const disablePrefetchByURL = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('litcal_no_prefetch') === '1';

  const query = useQuery<LiturgicalMonthMap>({
    queryKey: buildKey(year, month, calendar, lang),
    queryFn: () => fetchMonth(year, month, calendar, lang),
    staleTime: STALE_24H,
    gcTime: GC_7D,
    placeholderData: (prev) => prev,
  });

  const meta = useCacheMeta(year, month, calendar, lang);

  // Prefetch silencioso dos meses adjacentes (não conta hit/miss).
  useEffect(() => {
    if (!prefetchAdjacent || disablePrefetchByURL) return;
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    void ensureMonth(queryClient, prev.y, prev.m, calendar, lang);
    void ensureMonth(queryClient, next.y, next.m, calendar, lang);
  }, [year, month, calendar, lang, prefetchAdjacent, disablePrefetchByURL, queryClient]);

  const refresh = async () => {
    const data = await refreshLiturgicalMonth(queryClient, year, month, calendar, lang);
    return data;
  };

  return { ...query, refresh, cacheMeta: meta };
}

export const __testing = { buildKey, fetchMonth };
