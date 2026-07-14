import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SnapshotHistoryRow {
  id: string;
  taken_at: string;
  label: string | null;
  note: string | null;
  window_seconds: number | null;
  total_calls: number | null;
  total_exec_ms: number | null;
  row_count: number | null;
  rows: Array<{
    query: string;
    calls: number;
    total_exec_time: number;
    mean_exec_time: number;
    max_exec_time: number;
    min_exec_time?: number;
    stddev_exec_time?: number;
    rows_returned?: number;
    shared_blks_hit?: number;
    shared_blks_read?: number;
  }>;
}

export function useSnapshotHistory(limit = 100) {
  const [snapshots, setSnapshots] = useState<SnapshotHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: SnapshotHistoryRow[] | null; error: unknown }>;
            };
          };
        };
      })
        .from('pg_stat_snapshots')
        .select('id,taken_at,label,note,window_seconds,total_calls,total_exec_ms,row_count,rows')
        .order('taken_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      setSnapshots((data as SnapshotHistoryRow[]) || []);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { void load(); }, [load]);

  return { snapshots, loading, reload: load };
}
