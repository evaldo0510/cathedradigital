/**
 * useSaintOfDay — hook único para o Santo do Dia.
 *
 * Unifica duas fontes historicamente desconectadas:
 *   1. Edge function `saint-of-the-day` (nome/título oficiais do dia).
 *   2. Fallback local via `getSaintsByDate` (santoral persistido).
 *
 * Consumo previsto: LiturgiaPage, DailyLiturgy (Átrio), Header, LiturgyAdapter.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSaintsByDate } from '@/services/saintsService';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';

export interface SaintOfDay {
  name: string;
  title?: string | null;
  slug?: string | null;
  image?: string | null;
  source: 'official' | 'santoral' | 'none';
}

interface OfficialSaintPayload {
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  image?: string | null;
}

async function fetchOfficial(): Promise<OfficialSaintPayload | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const { data, error } = await supabase.functions.invoke('saint-of-the-day', {
      // signal é suportado pelo runtime do supabase-js
      signal: controller.signal,
    } as any);
    if (error) {
      window.dispatchEvent(new CustomEvent('supabase-unreachable'));
      return null;
    }

    if (!data || typeof data !== 'object') return null;
    const d = data as OfficialSaintPayload;
    if (!d.name || d.name === 'Santo do Dia') return null;
    return d;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFor(date: Date): Promise<SaintOfDay | null> {
  const now = new Date();
  const isToday = toIsoDateKey(date) === toIsoDateKey(now);

  // Fonte oficial só cobre "hoje". Para outras datas, vamos direto ao santoral.
  if (isToday) {
    const official = await fetchOfficial();
    if (official?.name) {
      return {
        name: official.name,
        title: official.title ?? null,
        slug: official.slug ?? null,
        image: official.image ?? null,
        source: 'official',
      };
    }
  }

  const list = await getSaintsByDate(date.getMonth() + 1, date.getDate());
  if (list && list.length > 0) {
    const s = list[0];
    return {
      name: s.name,
      title: s.title ?? null,
      slug: (s as any).slug ?? null,
      image: s.image ?? null,
      source: 'santoral',
    };
  }

  return null;
}

export function useSaintOfDay(date: Date = new Date()) {
  return useQuery({
    queryKey: ['saint-of-day', toIsoDateKey(date)],
    queryFn: () => fetchFor(date),
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
