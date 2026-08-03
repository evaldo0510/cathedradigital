/**
 * useNextPath — hook do Nexus Intelligence.
 *
 * Devolve as recomendações de continuidade após a conclusão de uma
 * jornada. A regra vive no `nextPathEngine` (função pura); aqui só há
 * cache e ligação com o usuário autenticado.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  resolveNextPath,
  type JourneyCandidate,
  type NextPathRecommendation,
} from '@/core/knowledge/intelligence/nextPathEngine';
import { getNextPathData } from '@/services/nextPathService';

export function useNextPath(
  current: JourneyCandidate | null,
  userId?: string | null,
  limit = 3,
): NextPathRecommendation[] {
  const { data } = useQuery({
    queryKey: ['next-path', userId ?? 'anon'],
    queryFn: () => getNextPathData(userId),
    enabled: Boolean(current),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return useMemo(() => {
    if (!current || !data) return [];
    return resolveNextPath({
      current,
      candidates: data.candidates,
      nexusByJourney: data.nexusByJourney,
      completedJourneyIds: data.completedJourneyIds,
      limit,
    });
  }, [current, data, limit]);
}
