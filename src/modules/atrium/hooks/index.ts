/**
 * Hooks internos do Ambiente Átrio.
 *
 * Regra: componentes-bloco chamam apenas estes hooks.
 * Nada de React Query, fetch ou Supabase — quem conversa com o mundo é o adapter.
 */

import { useEffect, useState } from 'react';
import { atriumAdapters } from '../adapters';
import type {
  AnnouncementItem,
  AtriumUser,
  RecommendationItem,
  SearchSuggestion,
  ThemeEntry,
} from '../adapters/types';
import type { LiturgicalContext, ResumeItem } from '../types';

function useAsync<T>(loader: () => Promise<T>, initial: T, deps: unknown[] = []): T {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    let alive = true;
    loader().then((v) => { if (alive) setValue(v); }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

export function useAtriumProfile(): AtriumUser {
  return useAsync<AtriumUser>(
    () => atriumAdapters.profile.getCurrent(),
    { profile: 'recurrent', isAuthenticated: true },
  );
}

export function useResume(): ResumeItem[] {
  return useAsync(() => atriumAdapters.journey.getResume(), []);
}

export function useSearchSuggestions(): SearchSuggestion[] {
  return useAsync(() => atriumAdapters.search.getSuggestions(), []);
}

export function useFeaturedThemes(): ThemeEntry[] {
  return useAsync(() => atriumAdapters.theme.getFeatured(), []);
}

export function useLiturgyToday(): LiturgicalContext | null {
  return useAsync<LiturgicalContext | null>(
    () => atriumAdapters.liturgy.getToday(),
    null,
  );
}

/**
 * Recomendações do usuário atual.
 * O hook resolve o perfil internamente — componentes NUNCA passam perfil.
 * (Exigência 1: só `composition.ts` conhece perfil.)
 */
export function useRecommendations(): RecommendationItem[] {
  const user = useAtriumProfile();
  return useAsync(
    () => atriumAdapters.recommendation.getForProfile(user.profile),
    [],
    [user.profile],
  );
}

export function useAnnouncements(): AnnouncementItem[] {
  return useAsync(() => atriumAdapters.announcement.getRecent(), []);
}

// Placeholder da Fase 1 mantido para compat:
export function useAtriumState() { return null; }
