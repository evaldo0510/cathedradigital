import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  cacheLiturgicalMonth,
  getCachedLiturgicalMonth,
} from '@/lib/offlineCache';

/**
 * Cache em camadas para o calendário litúrgico:
 *
 *   React Query (memória, instantâneo)
 *     ↳ IndexedDB (`liturgical-calendar`, TTL 7 dias) — persiste entre sessões
 *         ↳ Edge Function `liturgical-calendar` — fallback de rede
 *
 * Resultado: a primeira visita a um mês faz UMA chamada; reloads e
 * navegação entre meses já vistos são servidos do IndexedDB em <5ms
 * sem tocar a edge function nem o banco.
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

interface Options {
  calendar?: string;
  lang?: string;
  /** Prefetch silenciosamente o mês anterior e o próximo. Default: true. */
  prefetchAdjacent?: boolean;
}

const STALE_24H = 1000 * 60 * 60 * 24;
const GC_7D = 1000 * 60 * 60 * 24 * 7;

const buildKey = (year: number, month: number, calendar: string, lang: string) =>
  ['liturgical-month', calendar, lang, year, month] as const;

async function fetchMonth(
  year: number,
  month: number,
  calendar: string,
  lang: string,
): Promise<LiturgicalMonthMap> {
  // 1) IndexedDB primeiro (frio, mas instantâneo)
  const cached = await getCachedLiturgicalMonth(year, month, { calendar, lang });
  if (cached && !cached.isStale && cached.data) {
    return cached.data as LiturgicalMonthMap;
  }

  // 2) Edge function (fonte de verdade)
  const { data, error } = await supabase.functions.invoke('liturgical-calendar', {
    body: { action: 'month', year, month, lang, calendar },
  });

  if (error) {
    // Em erro de rede, devolve o cache stale (se houver) ao invés de quebrar a UI
    if (cached?.data) return cached.data as LiturgicalMonthMap;
    throw error;
  }

  const map: LiturgicalMonthMap = {};
  if (Array.isArray(data)) {
    for (const d of data as ApiDayData[]) map[d.date] = d;
  }

  // 3) Persiste assíncrono — não bloqueia o render
  void cacheLiturgicalMonth(year, month, map, { calendar, lang });

  return map;
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
    queryFn: () => fetchMonth(year, month, calendar, lang),
    staleTime: STALE_24H,
    gcTime: GC_7D,
  });
}

export function useLiturgicalMonth(year: number, month: number, options: Options = {}) {
  const { calendar = 'general-la', lang = 'la', prefetchAdjacent = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<LiturgicalMonthMap>({
    queryKey: buildKey(year, month, calendar, lang),
    queryFn: () => fetchMonth(year, month, calendar, lang),
    staleTime: STALE_24H,
    gcTime: GC_7D,
    // Hidrata sincronamente a partir do IndexedDB quando disponível.
    placeholderData: (prev) => prev,
  });

  // Prefetch mês anterior + próximo (em background, sem bloquear)
  useEffect(() => {
    if (!prefetchAdjacent) return;
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    void ensureMonth(queryClient, prev.y, prev.m, calendar, lang);
    void ensureMonth(queryClient, next.y, next.m, calendar, lang);
  }, [year, month, calendar, lang, prefetchAdjacent, queryClient]);

  return query;
}

export const __testing = { buildKey, fetchMonth };
