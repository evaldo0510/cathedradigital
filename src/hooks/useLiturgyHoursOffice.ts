/**
 * useLiturgyHoursOffice — Próprio da Liturgia das Horas por (iso_date, hour_slug).
 *
 * Mesmo padrão de `useLiturgyMeditation` / `useMissalProper`:
 * - Consulta `liturgy_hours_offices` (público, read-only).
 * - Se ausente, dispara a edge function `liturgy-hours-office`.
 * - Cache React Query 24h + IndexedDB persistente (offline-first).
 * - Habilitado apenas quando existe uma hora selecionada.
 * - Dedupe via `queryKey` — chamadas simultâneas para o mesmo par
 *   (isoDate, hour) compartilham a mesma Promise.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';
import { getCachedHoursOffice, cacheHoursOffice } from '@/lib/offlineCache';

export type HourSlug =
  | 'oficio' | 'laudes' | 'tercia' | 'sexta' | 'noa' | 'vesperas' | 'completas';

export const ALL_HOUR_SLUGS: HourSlug[] = [
  'oficio', 'laudes', 'tercia', 'sexta', 'noa', 'vesperas', 'completas',
];

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
  version: number | null;
  model: string | null;
  provider: string | null;
  prompt_hash: string | null;
  generated_at: string;
}

const queryKeyFor = (isoDate: string, hour: HourSlug) =>
  ['liturgy-hours-office', isoDate, hour] as const;

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

export interface OfficeResolution {
  office: LiturgyHoursOfficeRow | null;
  source: 'remote' | 'cache' | 'generated' | 'none';
}

/**
 * Estratégia offline-first:
 *  1. Supabase table → autoridade (revalida IDB).
 *  2. IDB → fallback quando a rede falha (retorna `source: 'cache'`).
 *  3. Edge function → gera + persiste.
 * IDB é gravado a cada sucesso de rede.
 */
async function resolveOffice(
  isoDate: string,
  hour: HourSlug,
  readings: DailyLiturgy | null,
): Promise<OfficeResolution> {
  const remote = await fetchExisting(isoDate, hour);
  if (remote) {
    await cacheHoursOffice(isoDate, hour, remote);
    return { office: remote, source: 'remote' };
  }
  const cached = (await getCachedHoursOffice(isoDate, hour)) as LiturgyHoursOfficeRow | null;
  if (cached) return { office: cached, source: 'cache' };
  const generated = await generate(isoDate, hour, readings);
  if (generated) {
    await cacheHoursOffice(isoDate, hour, generated);
    return { office: generated, source: 'generated' };
  }
  return { office: null, source: 'none' };
}

export function useLiturgyHoursOffice(
  isoDate: string,
  hour: HourSlug | null,
  readings: DailyLiturgy | null,
) {
  const qc = useQueryClient();
  const enabled = !!hour;

  const query = useQuery({
    queryKey: hour ? queryKeyFor(isoDate, hour) : ['liturgy-hours-office', isoDate, 'none'],
    queryFn: async () => (hour ? resolveOffice(isoDate, hour, readings) : { office: null, source: 'none' as const }),
    enabled,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 0,
    initialData: undefined,
  });

  // Hidratação síncrona a partir do IDB — evita flicker enquanto o remoto chega.
  useEffect(() => {
    if (!hour) return;
    let cancelled = false;
    (async () => {
      const key = queryKeyFor(isoDate, hour);
      if (qc.getQueryData(key)) return;
      const cached = (await getCachedHoursOffice(isoDate, hour)) as LiturgyHoursOfficeRow | null;
      if (!cancelled && cached && !qc.getQueryData(key)) {
        qc.setQueryData(key, { office: cached, source: 'cache' as const });
      }
    })();
    return () => { cancelled = true; };
  }, [isoDate, hour, qc]);

  const result = query.data ?? { office: null, source: 'none' as const };
  return {
    office: result.office,
    source: result.source,
    fromCache: result.source === 'cache',
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Pré-carrega as 7 horas canônicas para (isoDate). Idempotente:
 *  - Reusa entradas já hidratadas (React Query dedupe por `queryKey`).
 *  - Nunca dispara requisições paralelas para o mesmo par.
 *  - Silencia erros individuais (best-effort).
 */
export function prefetchAllHoursForDay(
  qc: QueryClient,
  isoDate: string,
  readings: DailyLiturgy | null,
): Promise<void> {
  const jobs = ALL_HOUR_SLUGS.map((hour) =>
    qc.prefetchQuery({
      queryKey: queryKeyFor(isoDate, hour),
      queryFn: () => resolveOffice(isoDate, hour, readings),
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24 * 7,
    }).catch(() => { /* silent */ }),
  );
  return Promise.allSettled(jobs).then(() => undefined);
}
