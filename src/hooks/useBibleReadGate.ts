import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BibleGateStatus = {
  blocked: boolean;
  status: string;
  last_run_at: string | null;
  run_id: string | null;
  blocking_findings: number;
  reason: string;
};

/**
 * Lê o status agregado da última diagnose canônica (SECURITY DEFINER).
 * Usado para travar a rota /bible quando a cobertura dos 73 livros falha.
 */
export function useBibleReadGate() {
  const query = useQuery({
    queryKey: ['bible-read-gate'],
    staleTime: 1000 * 60, // 1 min — diagnose roda no máx 1x/dia
    queryFn: async (): Promise<BibleGateStatus> => {
      const { data, error } = await supabase.rpc('bible_read_gate_status');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        blocked: !!row?.blocked,
        status: row?.status ?? 'unknown',
        last_run_at: row?.last_run_at ?? null,
        run_id: row?.run_id ?? null,
        blocking_findings: row?.blocking_findings ?? 0,
        reason: row?.reason ?? '',
      };
    },
  });

  return {
    gate: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
