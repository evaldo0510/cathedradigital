import { useQuery } from '@tanstack/react-query';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useSaintOfDay, type SaintOfDay } from '@/hooks/useSaintOfDay';
import { toIsoDateKey, type DailyLiturgy } from '@/core/liturgy/LiturgyProvider';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

/**
 * IgrejaContext — Fonte Única de Verdade para o contexto eclesial do dia.
 * 
 * Centraliza:
 * 1. Papa Atual (Magistério Vivo)
 * 2. Santo do Dia (Sanctorum)
 * 3. Liturgia do Dia (Lex Orandi)
 */

export interface PopeContext {
  id: string;
  name: string;
  title: string;
  image: string;
  reign: string;
  isSaint: boolean;
  status: 'current' | 'historical';
}

export interface ChurchContext {
  currentPope: PopeContext | null;
  todaySaint: SaintOfDay | null;
  liturgy: DailyLiturgy | null;
  isoDate: string;
  isToday: boolean;
  isLoading: boolean;
}

// Fallback do Papa Francisco caso a base falhe
const FALLBACK_POPE: PopeContext = {
  id: 'francis',
  name: 'Francisco',
  title: 'Bispo de Roma, Vigário de Jesus Cristo',
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pope_Francis_South_Korea_2014.jpg/440px-Pope_Francis_South_Korea_2014.jpg',
  reign: '2013 – Presente',
  isSaint: false,
  status: 'current'
};

export function useChurchContext(date: Date = new Date()) {
  const isoDate = toIsoDateKey(date);
  const isToday = isoDate === toIsoDateKey(new Date());

  // 1. Papa Atual (P0)
  const { data: currentPope, isLoading: loadingPope } = useQuery({
    queryKey: ['church-pope', 'current'],
    queryFn: async (): Promise<PopeContext> => {
      // Nota: library_items_v1 é uma view. Buscamos pelo status 'current'.
      const { data, error } = await supabase
        .from('library_items_v1')
        .select('*')
        .eq('status', 'current')
        .limit(1)
        .maybeSingle();

      if (data && !error && data.title) {
        return {
          id: data.id || 'current-pope',
          name: data.title,
          title: data.author_label || 'Bispo de Roma',
          image: data.cover_image_url || FALLBACK_POPE.image,
          reign: data.published_at || FALLBACK_POPE.reign,
          isSaint: data.category === 'saint',
          status: 'current'
        };
      }

      return FALLBACK_POPE;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  // 2. Santo do Dia
  const { data: todaySaint, isLoading: loadingSaint } = useSaintOfDay(date);

  // 3. Liturgia do Dia
  const { liturgy, isLoading: loadingLiturgy } = useDailyLiturgy(date);

  const context = useMemo<ChurchContext>(() => ({
    currentPope: currentPope ?? FALLBACK_POPE,
    todaySaint: todaySaint ?? null,
    liturgy: liturgy ?? null,
    isoDate,
    isToday,
    isLoading: loadingPope || loadingSaint || loadingLiturgy
  }), [currentPope, todaySaint, liturgy, isoDate, isToday, loadingPope, loadingSaint, loadingLiturgy]);

  return context;
}
