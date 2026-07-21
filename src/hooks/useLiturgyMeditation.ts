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
  /** Auditoria e reprodutibilidade */
  version: number | null;
  model: string | null;
  provider: string | null;
  prompt_hash: string | null;
  generated_at: string;
  fallback?: boolean;
  fallback_code?: 'ai_credits_exhausted' | 'ai_rate_limited' | 'ai_unavailable' | string;
  fallback_message?: string;
}

type LiturgyMeditationResponse = {
  meditation?: LiturgyMeditationRow;
  code?: string;
  message?: string;
};

const DEFAULT_AI_FALLBACK_MESSAGE =
  'A meditação editorial automática está temporariamente indisponível. As leituras permanecem disponíveis para oração.';

async function fetchExisting(isoDate: string): Promise<LiturgyMeditationRow | null> {
  const { data, error } = await supabase
    .from('liturgy_meditations' as any)
    .select('*')
    .eq('iso_date', isoDate)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as LiturgyMeditationRow | null) ?? null;
}

async function readInvokeFailure(error: unknown): Promise<{ code: string; message: string }> {
  const context = (error as { context?: unknown })?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { code?: string; message?: string; detail?: string };
      return {
        code: payload.code ?? 'ai_unavailable',
        message: payload.message ?? payload.detail ?? DEFAULT_AI_FALLBACK_MESSAGE,
      };
    } catch {
      // segue para fallback genérico
    }
  }

  return {
    code: 'ai_unavailable',
    message: (error as { message?: string })?.message ?? DEFAULT_AI_FALLBACK_MESSAGE,
  };
}

function buildClientFallbackMeditation(
  isoDate: string,
  readings: DailyLiturgy,
  failure?: { code: string; message: string },
): LiturgyMeditationRow {
  const gospelRef = readings.evangelho?.referencia ?? 'Evangelho do dia';
  const celebration = readings.liturgia || readings.dia || 'Liturgia do dia';
  const psalmRefrain = readings.salmo?.refrao;

  return {
    iso_date: isoDate,
    theme: celebration,
    reading_key: psalmRefrain
      ? `Permaneça com o refrão do salmo: “${psalmRefrain}”. Ele oferece uma chave segura de oração enquanto a meditação editorial não está disponível.`
      : `Permaneça com ${gospelRef}. Leia o texto lentamente e identifique uma palavra para levar à oração do dia.`,
    fathers: [],
    catechism: [],
    magisterium: [],
    logos: {
      observe: `Leia novamente ${gospelRef} e acolha o gesto central de Cristo sem pressa.`,
      reflect: 'Pergunte onde essa Palavra toca sua vida concreta hoje, especialmente nas decisões pequenas.',
      pray: 'Fale com o Senhor a partir da frase que mais permaneceu no coração.',
      live: 'Escolha um ato simples de fidelidade antes do fim do dia.',
    },
    final_prayer: 'Senhor, guardai em mim a vossa Palavra. Dai-me um coração atento, humilde e perseverante, para que a liturgia deste dia se torne vida concreta. Amém.',
    church_history: null,
    action_of_day: 'Releia o Evangelho em silêncio por três minutos e pratique uma obra concreta de caridade.',
    version: null,
    model: null,
    provider: 'local-fallback',
    prompt_hash: null,
    generated_at: new Date().toISOString(),
    fallback: true,
    fallback_code: failure?.code ?? 'ai_unavailable',
    fallback_message: failure?.message ?? DEFAULT_AI_FALLBACK_MESSAGE,
  };
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
  if (error) {
    const failure = await readInvokeFailure(error);
    return buildClientFallbackMeditation(isoDate, readings, failure);
  }
  const payload = data as LiturgyMeditationResponse | null;
  const row = payload?.meditation ?? null;
  if (row) return row;
  if (payload?.code || payload?.message) {
    return buildClientFallbackMeditation(isoDate, readings, {
      code: payload.code ?? 'ai_unavailable',
      message: payload.message ?? DEFAULT_AI_FALLBACK_MESSAGE,
    });
  }
  return null;
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
