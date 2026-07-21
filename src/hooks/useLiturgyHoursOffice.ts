/**
 * useLiturgyHoursOffice — Próprio da Liturgia das Horas por (iso_date, hour_slug).
 *
 * Mesmo padrão de `useLiturgyMeditation` / `useMissalProper`:
 * - Consulta `liturgy_hours_offices` (público, read-only).
 * - Se ausente, dispara a edge function `liturgy-hours-office`.
 * - Cache React Query 24h.
 * - Habilitado apenas quando existe uma hora selecionada.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';

export type HourSlug =
  | 'oficio' | 'laudes' | 'tercia' | 'sexta' | 'noa' | 'vesperas' | 'completas';

export interface OfficePsalmody {
  antiphon: string;
  reference: string;
  text: string;
}

export interface OfficeGospelCanticle {
  antiphon: string;
  reference: string;
  text: string;
}

export interface LiturgyHoursOfficeRow {
  iso_date: string;
  hour_slug: HourSlug;
  antiphon_opening: string | null;
  psalmody: OfficePsalmody[];
  brief_reading_ref: string | null;
  brief_reading_text: string | null;
  responsory: string | null;
  gospel_canticle: OfficeGospelCanticle | null;
  intercessions: string[];
  concluding_prayer: string;
  season_note: string | null;
  /** Auditoria e reprodutibilidade */
  version: number | null;
  model: string | null;
  provider: string | null;
  prompt_hash: string | null;
  generated_at: string;
}

async function fetchExisting(isoDate: string, hour: HourSlug): Promise<LiturgyHoursOfficeRow | null> {
  const { data, error } = await supabase
    .from('liturgy_hours_offices' as any)
    .select('*')
    .eq('iso_date', isoDate)
    .eq('hour_slug', hour)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as LiturgyHoursOfficeRow | null) ?? null;
}

async function generate(
  isoDate: string,
  hour: HourSlug,
  readings: DailyLiturgy | null,
): Promise<LiturgyHoursOfficeRow | null> {
  const { data, error } = await supabase.functions.invoke('liturgy-hours-office', {
    body: {
      iso_date: isoDate,
      hour_slug: hour,
      readings: readings
        ? {
            liturgia: readings.liturgia,
            dia: readings.dia,
            season: readings.season,
            primeiraLeitura: readings.primeiraLeitura,
            salmo: readings.salmo,
            segundaLeitura: readings.segundaLeitura,
            evangelho: readings.evangelho,
          }
        : undefined,
    },
  });
  if (error) return null;
  return (data as { office?: LiturgyHoursOfficeRow })?.office ?? null;
}

export function useLiturgyHoursOffice(
  isoDate: string,
  hour: HourSlug | null,
  readings: DailyLiturgy | null,
) {
  const qc = useQueryClient();
  const enabled = !!hour;

  const query = useQuery({
    queryKey: ['liturgy-hours-office', isoDate, hour ?? 'none'],
    queryFn: async () => {
      if (!hour) return null;
      const cached = await fetchExisting(isoDate, hour);
      if (cached) return cached;
      return await generate(isoDate, hour, readings);
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 0,
  });

  useEffect(() => {
    if (!enabled || !hour) return;
    if (query.data || query.isFetching) return;
    (async () => {
      const row = await generate(isoDate, hour, readings);
      if (row) qc.setQueryData(['liturgy-hours-office', isoDate, hour], row);
    })().catch(() => { /* silencia */ });
  }, [enabled, hour, isoDate, readings, query.data, query.isFetching, qc]);

  return {
    office: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
