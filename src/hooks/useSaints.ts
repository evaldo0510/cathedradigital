import { useQuery } from '@tanstack/react-query';
import { getSaintsByDate, searchSaints, getAllSaints, formatSaint } from '@/services/saintsService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { type Saint } from '@/data/saints';

export function useSaintsToday() {
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;

  return useQuery({
    queryKey: ['saints-today', month, day],
    queryFn: () => getSaintsByDate(month, day),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
}

export function useOfficialSaint(forceRefresh = false) {
  return useQuery({
    queryKey: ['official-saint', format(new Date(), 'yyyy-MM-dd'), forceRefresh],
    queryFn: async () => {
      const cacheKey = `official_saint_${format(new Date(), 'yyyy-MM-dd')}`;
      try {
        if (!forceRefresh) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.name && parsed.name !== 'Santo do Dia') return parsed;
          }
        }
      } catch { /* ignore corrupt cache */ }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // Increased to 12s for slow scrapers

      try {
        const { data, error } = await supabase.functions.invoke('saint-of-the-day', {
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (data && !error) {
          // If we got valid data, cache it
          if (data.name && data.name !== 'Santo do Dia') {
            try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
          }
          return data;
        }
        if (error) throw error;
      } catch (e) {
        clearTimeout(timeout);
        console.warn('Official saint fetch failed:', e);
      }
      return null;
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours (more frequent than 24h to catch corrections)
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useSearchSaints(query: string) {
  return useQuery({
    queryKey: ['saints-search', query],
    queryFn: () => searchSaints(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllSaintsDB(limit = 500) {
  return useQuery<Saint[]>({
    queryKey: ['all-saints-db', limit],
    queryFn: () => getAllSaints(limit),
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}
