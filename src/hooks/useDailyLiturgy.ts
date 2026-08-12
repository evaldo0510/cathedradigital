/**
 * useDailyLiturgy — hook único para as leituras do dia.
 *
 * Substitui a lógica inline anterior (`useQuery` embutido em LiturgiaPage).
 * Camadas:
 *   1. React Query (cache in-memory + dedupe)
 *   2. IndexedDB via getCachedLiturgy/cacheLiturgy (persistente + offline)
 *   3. LiturgyProvider (fonte oficial atual)
 *
 * Prefetch: ±3 dias adjacentes silenciosamente, respeitando o guard.
 * Métricas: registra hit/miss em localStorage sob 'cathedra_liturgy_stats'.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type DailyLiturgy,
  getLiturgyProvider,
  toIsoDateKey,
} from '@/core/liturgy/LiturgyProvider';
import { cacheLiturgy, getCachedLiturgy } from '@/lib/offlineCache';
import { isLiturgicalPrefetchDisabled } from '@/lib/litcalPrefetchGuard';

const OFFLINE_FLAG_KEY = 'cathedra_offline_mode';
const STATS_KEY = 'cathedra_liturgy_stats';
const STALE_MS = 1000 * 60 * 60; // 1h

export interface DailyLiturgyResult {
  liturgy: DailyLiturgy | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isOfflineData: boolean;
  refresh: () => Promise<void>;
}

function isOfflineMode(): boolean {
  try {
    return localStorage.getItem(OFFLINE_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

function bumpStats(kind: 'hit-memory' | 'hit-disk' | 'miss' | 'offline-hit' | 'error'): void {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const s = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    s[kind] = (s[kind] ?? 0) + 1;
    s.lastAt = Date.now();
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch { /* silent */ }
}

async function fetchDay(date: Date): Promise<{ data: DailyLiturgy; offline: boolean }> {
  const key = toIsoDateKey(date);
  const cached = (await getCachedLiturgy(key)) as DailyLiturgy | null;

  if (isOfflineMode()) {
    if (cached) {
      bumpStats('offline-hit');
      return { data: cached, offline: true };
    }
    bumpStats('error');
    throw new Error('Modo Somente-Cache ativo: Liturgia não disponível offline.');
  }

  try {
    const fresh = await getLiturgyProvider().getDayLiturgy(date);
    await cacheLiturgy(key, fresh);
    bumpStats('miss');
    return { data: fresh, offline: false };
  } catch (e) {
    if (cached) {
      bumpStats('hit-disk');
      return { data: cached, offline: true };
    }
    bumpStats('error');
    
    // Dispara evento global para UI reagir à falha de infra
    window.dispatchEvent(new CustomEvent('supabase-unreachable'));
    
    throw e;
  }

}

function queryKey(date: Date): [string, string] {
  return ['daily-liturgy', toIsoDateKey(date)];
}

export function useDailyLiturgy(date: Date): DailyLiturgyResult {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKey(date),
    queryFn: () => fetchDay(date),
    staleTime: STALE_MS,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Prefetch dos ±3 dias adjacentes, silenciosamente.
  useEffect(() => {
    if (isLiturgicalPrefetchDisabled()) return;
    if (isOfflineMode()) return;
    const offsets = [-1, 1, -2, 2, -3, 3];
    for (const off of offsets) {
      const d = new Date(date);
      d.setDate(d.getDate() + off);
      const k = queryKey(d);
      if (qc.getQueryData(k)) continue;
      qc.prefetchQuery({
        queryKey: k,
        queryFn: () => fetchDay(d),
        staleTime: STALE_MS,
      }).catch(() => { /* silent */ });
    }
  }, [date, qc]);

  return {
    liturgy: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isOfflineData: query.data?.offline ?? false,
    refresh: async () => { await query.refetch(); },
  };
}

/** Utilitário para leitura de estatísticas em painéis de dev. */
export function getLiturgyProviderStats(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}
