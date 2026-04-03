import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HistoryEntry {
  id: string;
  route: string;
  title: string;
  image_url: string | null;
  visited_at: string;
}

export function useHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Fetch recent history (deduplicated by route, last 10)
  const fetchHistory = useCallback(async () => {
    if (!user) { setHistory([]); return; }

    const { data } = await supabase
      .from('user_history')
      .select('*')
      .eq('user_id', user.id)
      .order('visited_at', { ascending: false })
      .limit(50);

    if (data) {
      // Deduplicate by route, keep most recent
      const seen = new Set<string>();
      const unique: HistoryEntry[] = [];
      for (const entry of data) {
        if (!seen.has(entry.route)) {
          seen.add(entry.route);
          unique.push(entry);
        }
        if (unique.length >= 10) break;
      }
      setHistory(unique);
    }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const trackVisit = useCallback(async (route: string, title: string, imageUrl?: string) => {
    if (!user) return;
    await supabase.from('user_history').insert({
      user_id: user.id,
      route,
      title,
      image_url: imageUrl || null,
    });
  }, [user]);

  return { history, trackVisit, refetch: fetchHistory };
}
