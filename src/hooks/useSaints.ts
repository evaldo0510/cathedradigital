import { useQuery } from '@tanstack/react-query';
import { getSaintsByDate, searchSaints, getSaintsByCategory, formatSaint } from '@/services/saintsService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function useSaintsToday() {
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;

  return useQuery({
    queryKey: ['saints-today', month, day],
    queryFn: () => getSaintsByDate(month, day),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useOfficialSaint() {
  return useQuery({
    queryKey: ['official-saint'],
    queryFn: async () => {
      const cacheKey = `official_saint_${format(new Date(), 'yyyy-MM-dd')}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      const response = await supabase.functions.invoke('saint-of-the-day');
      if (response.data && !response.error) {
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        return response.data;
      }
      return null;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
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
