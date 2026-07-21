/**
 * useMissalProper — Próprio da Missa (Prayer Engine v2, Onda B pattern).
 *
 * - Consulta `missal_propers` por iso_date. Se ausente, dispara a edge
 *   function `missal-proper` (que gera + persiste). Cache 24h.
 * - Habilitado apenas quando `readings.evangelho.texto` está disponível.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';

export interface MissalProperRow {
  iso_date: string;
  celebration_title: string;
  liturgical_color: string | null;
  entrance_antiphon: string | null;
  collect: string;
  offertory_prayer: string;
  preface_suggestion: string | null;
  communion_antiphon: string | null;
  prayer_after_communion: string;
  season_note: string | null;
  /** Auditoria e reprodutibilidade */
  version: number | null;
  model: string | null;
  provider: string | null;
  prompt_hash: string | null;
  generated_at: string;
}

async function fetchExisting(isoDate: string): Promise<MissalProperRow | null> {
  const { data, error } = await supabase
    .from('missal_propers' as any)
    .select('*')
    .eq('iso_date', isoDate)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as MissalProperRow | null) ?? null;
}

async function generate(isoDate: string, readings: DailyLiturgy): Promise<MissalProperRow | null> {
  const { data, error } = await supabase.functions.invoke('missal-proper', {
    body: {
      iso_date: isoDate,
      readings: {
        liturgia: readings.liturgia,
        dia: readings.dia,
        season: readings.season,
        primeiraLeitura: readings.primeiraLeitura,
        salmo: readings.salmo,
        segundaLeitura: readings.segundaLeitura,
        evangelho: readings.evangelho,
      },
    },
  });
  if (error) return null;
  return (data as { proper?: MissalProperRow })?.proper ?? null;
}

export function useMissalProper(isoDate: string, readings: DailyLiturgy | null) {
  const qc = useQueryClient();
  const enabled = !!readings?.evangelho?.texto;

  const query = useQuery({
    queryKey: ['missal-proper', isoDate],
    queryFn: async () => {
      const cached = await fetchExisting(isoDate);
      if (cached) return cached;
      if (!readings) return null;
      return await generate(isoDate, readings);
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 0,
  });

  useEffect(() => {
    if (!enabled || !readings) return;
    if (query.data || query.isFetching) return;
    (async () => {
      const row = await generate(isoDate, readings);
      if (row) qc.setQueryData(['missal-proper', isoDate], row);
    })().catch(() => { /* silencia */ });
  }, [enabled, readings, isoDate, query.data, query.isFetching, qc]);

  return {
    proper: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
