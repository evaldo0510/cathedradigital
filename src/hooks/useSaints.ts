import { useQuery } from '@tanstack/react-query';
import { getSaintsByDate, searchSaints, formatSaint } from '@/services/saintsService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

export function useOfficialSaint() {
  return useQuery({
    queryKey: ['official-saint', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const cacheKey = `official_saint_${format(new Date(), 'yyyy-MM-dd')}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch { /* ignore corrupt cache */ }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      try {
        const response = await supabase.functions.invoke('saint-of-the-day', {
          body: null,
        });
        clearTimeout(timeout);

        if (response.data && !response.error) {
          try { localStorage.setItem(cacheKey, JSON.stringify(response.data)); } catch {}
          return response.data;
        }
      } catch (e) {
        clearTimeout(timeout);
        console.warn('Official saint fetch failed, using DB fallback:', e);
      }
      return null;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 0, // Don't retry — fallback to DB saints
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
