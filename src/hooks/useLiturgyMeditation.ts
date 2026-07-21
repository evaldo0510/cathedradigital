/**
 * useLiturgyMeditation — busca o pacote editorial do dia.
 *
 * Fluxo:
 *   1. Habilitado apenas depois que `useDailyLiturgy` retornou (evangelho).
 *   2. Consulta `liturgy_meditations` (público, read-only) por iso_date.
 *   3. Se ausente, chama a edge function `liturgy-meditation` (que gera
 *      e persiste). Ao chegar novo resultado, invalida a query.
 *   4. Cache de 24h no React Query + espelho em localStorage para
 *      sobreviver a refresh e alimentar fallback quando IA falhar.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { telemetry } from '@/utils/navigation-telemetry';
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

export type MeditationFailureCode =
  | 'ai_credits_exhausted'
  | 'ai_rate_limited'
  | 'ai_unavailable';

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
  version: number | null;
  model: string | null;
  provider: string | null;
  prompt_hash: string | null;
  generated_at: string;
  fallback?: boolean;
  fallback_code?: MeditationFailureCode | string;
  fallback_message?: string;
  /** Fonte do último fallback: cache local anterior, banco antigo, ou builder local. */
  fallback_source?: 'local-cache' | 'local-builder' | 'previous-day';
  /** Estimativa (ISO) para próxima tentativa automática, quando aplicável. */
  fallback_retry_at?: string;
}

type LiturgyMeditationResponse = {
  meditation?: LiturgyMeditationRow;
  code?: string;
  message?: string;
};

const DEFAULT_AI_FALLBACK_MESSAGE =
  'A meditação editorial automática está temporariamente indisponível. As leituras permanecem disponíveis para oração.';

const AI_CREDITS_EXHAUSTED_MESSAGE =
  'Os créditos de IA da plataforma se esgotaram. A meditação editorial voltará assim que forem recarregados.';

const AI_RATE_LIMIT_MESSAGE =
  'Muitas requisições simultâneas ao gerador de meditação. Tente novamente em instantes.';

/** Janela estimada até nova tentativa automática, em minutos, por código. */
const RETRY_WINDOW_MINUTES: Record<MeditationFailureCode, number> = {
  ai_credits_exhausted: 60,
  ai_rate_limited: 2,
  ai_unavailable: 10,
};

const CACHE_KEY_PREFIX = 'cathedra:liturgy-meditation:v1:';
const CACHE_MAX_ENTRIES = 14;
const FALLBACK_EVENTS_KEY = 'cathedra:liturgy-meditation:fallback-events:v1';
const FALLBACK_EVENTS_MAX = 500;

export interface FallbackEventLog {
  at: string;
  iso_date: string;
  code: MeditationFailureCode | string;
  source: 'local-cache' | 'local-builder' | 'previous-day';
  retry_at: string | null;
  message: string | null;
}

function persistFallbackEvent(evt: FallbackEventLog): void {
  const s = safeStorage();
  if (!s) return;
  try {
    const raw = s.getItem(FALLBACK_EVENTS_KEY);
    const list: FallbackEventLog[] = raw ? JSON.parse(raw) : [];
    // Dedupe por (iso_date|code|source) numa janela de 6h.
    const dedupeKey = `${evt.iso_date}|${evt.code}|${evt.source}`;
    const sixHoursAgo = Date.now() - 6 * 60 * 60_000;
    const isDup = list.some(
      (e) =>
        `${e.iso_date}|${e.code}|${e.source}` === dedupeKey &&
        new Date(e.at).getTime() > sixHoursAgo,
    );
    if (isDup) return;
    list.unshift(evt);
    if (list.length > FALLBACK_EVENTS_MAX) list.length = FALLBACK_EVENTS_MAX;
    s.setItem(FALLBACK_EVENTS_KEY, JSON.stringify(list));
  } catch {
    /* quota — ignora */
  }
}

export function readFallbackEvents(): FallbackEventLog[] {
  const s = safeStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(FALLBACK_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as FallbackEventLog[]) : [];
  } catch {
    return [];
  }
}

export function clearFallbackEvents(): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.removeItem(FALLBACK_EVENTS_KEY);
  } catch {
    /* ignora */
  }
}

// ── Persistência local ─────────────────────────────────────────────
function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function cacheKey(isoDate: string) {
  return `${CACHE_KEY_PREFIX}${isoDate}`;
}

function readLocalMeditation(isoDate: string): LiturgyMeditationRow | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(cacheKey(isoDate));
    if (!raw) return null;
    return JSON.parse(raw) as LiturgyMeditationRow;
  } catch {
    return null;
  }
}

function writeLocalMeditation(row: LiturgyMeditationRow) {
  // Nunca persistir um fallback: só o conteúdo editorial real deve virar cache reutilizável.
  if (row.fallback) return;
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(cacheKey(row.iso_date), JSON.stringify(row));
    pruneCache(s);
  } catch {
    /* quota — silencia */
  }
}

function pruneCache(storage: Storage) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(CACHE_KEY_PREFIX)) keys.push(k);
    }
    if (keys.length <= CACHE_MAX_ENTRIES) return;
    keys.sort(); // iso_date lexicográfico == cronológico
    for (const k of keys.slice(0, keys.length - CACHE_MAX_ENTRIES)) {
      storage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

function readMostRecentLocal(beforeIso: string): LiturgyMeditationRow | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const candidates: LiturgyMeditationRow[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (!k || !k.startsWith(CACHE_KEY_PREFIX)) continue;
      try {
        const row = JSON.parse(s.getItem(k) ?? 'null') as LiturgyMeditationRow | null;
        if (row && !row.fallback && row.iso_date && row.iso_date < beforeIso) {
          candidates.push(row);
        }
      } catch {
        /* pula entrada inválida */
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.iso_date.localeCompare(a.iso_date));
    return candidates[0];
  } catch {
    return null;
  }
}

function messageForCode(code: MeditationFailureCode | string | undefined): string {
  switch (code) {
    case 'ai_credits_exhausted':
      return AI_CREDITS_EXHAUSTED_MESSAGE;
    case 'ai_rate_limited':
      return AI_RATE_LIMIT_MESSAGE;
    default:
      return DEFAULT_AI_FALLBACK_MESSAGE;
  }
}

function retryAtFor(code: MeditationFailureCode | string | undefined): string {
  const known = (code as MeditationFailureCode) in RETRY_WINDOW_MINUTES
    ? (code as MeditationFailureCode)
    : 'ai_unavailable';
  const minutes = RETRY_WINDOW_MINUTES[known];
  return new Date(Date.now() + minutes * 60_000).toISOString();
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

async function readInvokeFailure(error: unknown): Promise<{ code: MeditationFailureCode; message: string }> {
  const context = (error as { context?: unknown })?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { code?: string; message?: string; detail?: string };
      const code = (payload.code as MeditationFailureCode) ?? inferCode(context.status, payload.message ?? payload.detail);
      return {
        code,
        message: payload.message ?? messageForCode(code),
      };
    } catch {
      const code = inferCode(context.status);
      return { code, message: messageForCode(code) };
    }
  }
  const msg = (error as { message?: string })?.message;
  const code = inferCode(undefined, msg);
  return { code, message: messageForCode(code) };
}

function inferCode(status?: number, message?: string): MeditationFailureCode {
  if (status === 402 || /402|payment required|credit|insufficient|quota/i.test(message ?? '')) {
    return 'ai_credits_exhausted';
  }
  if (status === 429 || /429|rate limit|too many requests/i.test(message ?? '')) {
    return 'ai_rate_limited';
  }
  return 'ai_unavailable';
}

function buildClientFallbackMeditation(
  isoDate: string,
  readings: DailyLiturgy,
  failure?: { code: MeditationFailureCode | string; message: string },
): LiturgyMeditationRow {
  // 1. Preferir cache local do MESMO dia (meditação editorial anterior real).
  const localSame = readLocalMeditation(isoDate);
  if (localSame && !localSame.fallback) {
    return {
      ...localSame,
      fallback: true,
      fallback_code: (failure?.code as MeditationFailureCode) ?? 'ai_unavailable',
      fallback_message: failure?.message ?? messageForCode(failure?.code),
      fallback_source: 'local-cache',
      fallback_retry_at: retryAtFor(failure?.code),
    };
  }

  // 2. Reaproveitar meditação editorial de dia anterior armazenada localmente.
  const previous = readMostRecentLocal(isoDate);
  if (previous) {
    return {
      ...previous,
      iso_date: isoDate,
      fallback: true,
      fallback_code: (failure?.code as MeditationFailureCode) ?? 'ai_unavailable',
      fallback_message: failure?.message ?? messageForCode(failure?.code),
      fallback_source: 'previous-day',
      fallback_retry_at: retryAtFor(failure?.code),
    };
  }

  // 3. Último recurso: montar a partir das leituras do dia.
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
    fallback_code: (failure?.code as MeditationFailureCode) ?? 'ai_unavailable',
    fallback_message: failure?.message ?? messageForCode(failure?.code),
    fallback_source: 'local-builder',
    fallback_retry_at: retryAtFor(failure?.code),
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
  if (row) {
    // A edge function pode devolver um fallback (200) — só cacheia quando é real.
    if (!row.fallback) writeLocalMeditation(row);
    else {
      // Enriquecer fallback do servidor com fonte local se disponível.
      return buildClientFallbackMeditation(isoDate, readings, {
        code: (payload?.code as MeditationFailureCode) ?? (row.fallback_code as MeditationFailureCode) ?? 'ai_unavailable',
        message: payload?.message ?? row.fallback_message ?? messageForCode(row.fallback_code),
      });
    }
    return row;
  }
  if (payload?.code || payload?.message) {
    return buildClientFallbackMeditation(isoDate, readings, {
      code: (payload.code as MeditationFailureCode) ?? 'ai_unavailable',
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
      if (cached) {
        if (!cached.fallback) writeLocalMeditation(cached);
        return cached;
      }
      if (!readings) return null;
      return await generate(isoDate, readings);
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 0,
    // Enquanto carrega, oferece imediatamente o cache local como placeholder.
    placeholderData: () => readLocalMeditation(isoDate) ?? undefined,
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

  const retry = useCallback(async () => {
    if (!readings) return;
    await qc.invalidateQueries({ queryKey: ['liturgy-meditation', isoDate] });
    await query.refetch();
  }, [qc, isoDate, readings, query]);

  // ── Telemetria de fallback ──
  // Sempre que a meditação em cache/essencial for exibida, emitimos um
  // evento único (dedupe por date+code+source) para acompanharmos com
  // que frequência a IA falha e qual código dispara — visível no
  // TelemetryDashboard / navigation-telemetry buffer + buffer local
  // consumido pelo painel /admin/liturgia-meditation-fallback.
  const lastLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    const row = query.data;
    if (!row || !row.fallback) return;
    const code = (row.fallback_code as MeditationFailureCode | undefined) ?? 'ai_unavailable';
    const source = row.fallback_source ?? 'local-builder';
    const key = `${row.iso_date}|${code}|${source}`;
    if (lastLoggedRef.current === key) return;
    lastLoggedRef.current = key;
    const payload = {
      iso_date: row.iso_date,
      code,
      source,
      retry_at: row.fallback_retry_at ?? null,
      message: row.fallback_message ?? null,
    };
    telemetry.log('liturgy.meditation.fallback', 'warn', payload);
    persistFallbackEvent({ ...payload, at: new Date().toISOString() });
  }, [query.data]);

  return {
    meditation: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry,
  };
}

// ── Exportações para testes unitários ─────────────────────────────
export const __testables__ = {
  buildClientFallbackMeditation,
  retryAtFor,
  messageForCode,
  inferCode,
  readLocalMeditation,
  writeLocalMeditation,
  readMostRecentLocal,
  persistFallbackEvent,
  RETRY_WINDOW_MINUTES,
  CACHE_KEY_PREFIX,
  FALLBACK_EVENTS_KEY,
};
