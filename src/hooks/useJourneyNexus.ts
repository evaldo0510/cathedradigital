/**
 * useJourneyNexus — espelha `useSaintNexus` / `useCatechismNexus`:
 * funde o Nexus heurístico da jornada com as relações CURADAS do banco
 * (`nexus_relations`), nas duas direções.
 *
 * Devolve um `ReaderAutoNexusOutput` pronto para o `NexusPanel` e para o
 * `ReaderContinuation` — sem componente ou arquitetura nova.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  resolveJourneyAutoNexus,
  type JourneyLike,
} from '@/core/knowledge/adapters/journeyAutoNexus';
import {
  mergeCuratedEdges,
  type CuratedNexusEdge,
} from '@/core/knowledge/adapters/nexusGraphMerge';
import {
  BUCKET_LABEL,
  type ReaderAutoNexusOutput,
  type ReaderNexusBucket,
} from '@/core/knowledge/adapters/ReaderAutoNexus';
import { getJourneyCuratedEdges } from '@/services/journeyNexusService';

/** Ordem canônica das Jornadas: prática primeiro, depois estudo. */
export const JOURNEY_NEXUS_ORDER: readonly ReaderNexusBucket[] = [
  'saint', 'catechism', 'bible', 'magisterium', 'father', 'prayer', 'glossary', 'liturgy',
];

export interface JourneyNexusInput extends JourneyLike {
  slug?: string | null;
}

export function useJourneyNexus(
  journey: JourneyNexusInput | null,
): ReaderAutoNexusOutput | null {
  const keys = useMemo(
    () => [journey?.slug ?? '', journey?.id ?? ''].filter(Boolean) as string[],
    [journey?.slug, journey?.id],
  );

  const { data: edges } = useQuery<CuratedNexusEdge[]>({
    queryKey: ['journey-nexus', keys.join('|')],
    queryFn: () => getJourneyCuratedEdges(keys),
    enabled: keys.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const fingerprint = journey
    ? [journey.id, journey.title, journey.subtitle ?? '', journey.category ?? '', (journey.tags ?? []).join('|')].join('#')
    : '';

  return useMemo(() => {
    if (!journey) return null;
    const heuristic = resolveJourneyAutoNexus(journey);
    const base: ReaderAutoNexusOutput = {
      selfId: null,
      byBucket: heuristic.byKind as ReaderAutoNexusOutput['byBucket'],
      labels: BUCKET_LABEL,
      suggestions: [],
    };
    return mergeCuratedEdges(base, edges ?? [], JOURNEY_NEXUS_ORDER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, edges]);
}
