/**
 * useLiturgyMeditation — busca o pacote editorial do dia.
 *
 * Fluxo:
 *   1. Habilitado apenas depois que `useDailyLiturgy` retornou (evangelho).
 *   2. Consulta `liturgy_meditations` (público, read-only) por iso_date.
 *   3. Se ausente, chama a edge function `liturgy-meditation` (que gera
 *      e persiste). Ao chegar novo resultado, invalida a query.
 *   4. Cache de 24h no React Query.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';

export interface FatherCitation {
  author: string;
  work: string;
  reference: string;
  quote: string;
}
export interface CatechismCitation {
  paragraph: number;
  quote: string;
}
export interface MagisteriumCitation {
  document: string;
  pope: string;
  section: string;
  quote: string;
}
export interface LogosMeditation {
  observe: string;
  reflect: string;
  pray: string;
  live: string;
}
export interface ChurchHistoryBlock {
  saint: string | null;
  council: string | null;
  pope: string | null;
  document: string | null;
}
export interface LiturgyMeditationRow {
  iso_date: string;
  theme: string | null;
  reading_key: string | null;
  fathers: FatherCitation[];
  catechism: CatechismCitation[];
  magisterium: MagisteriumCitation[];
  logos: LogosMeditation | null;
  final_prayer: string | null;
  church_history: ChurchHistoryBlock | null;
  action_of_day: string | null;
  model: string | null;
  generated_at: string;
}

async function fetchExisting(isoDate: string): Promise<LiturgyMeditationRow | null> {
  const { data, error } = await supabase
    .from('liturgy_meditations' as any)
    .select('*')
    .eq('iso_date', isoDate)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as LiturgyMeditationRow | null) ?? null;
}

async function generate(isoDate: string, readings: DailyLiturgy): Promise<LiturgyMeditationRow | null> {
  const { data, error } = await supabase.functions.invoke('liturgy-meditation', {
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
  const row = (data as { meditation?: LiturgyMeditationRow })?.meditation ?? null;
  return row;
}

export function useLiturgyMeditation(isoDate: string, readings: DailyLiturgy | null) {
  const qc = useQueryClient();
  const enabled = !!readings?.evangelho?.texto;

  const query = useQuery({
    queryKey: ['liturgy-meditation', isoDate],
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

  // Ao carregar do banco por hit rápido mas leituras ausentes, dispara geração
  // silenciosa em background (útil na primeira vez do dia).
  useEffect(() => {
    if (!enabled || !readings) return;
    if (query.data || query.isFetching) return;
    (async () => {
      const row = await generate(isoDate, readings);
      if (row) qc.setQueryData(['liturgy-meditation', isoDate], row);
    })().catch(() => { /* silencia — bloco degrada */ });
  }, [enabled, readings, isoDate, query.data, query.isFetching, qc]);

  return {
    meditation: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
