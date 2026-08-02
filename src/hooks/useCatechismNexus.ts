/**
 * useCatechismNexus — funde o Nexus heurístico do Catecismo com as
 * relações CURADAS lidas do banco (`nexus_relations`), nas duas direções.
 *
 * Sem componente novo: devolve um `ReaderAutoNexusOutput` pronto para o
 * `NexusPanel` e para o `ReaderContinuation` já existentes.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { resolveCatechismAutoNexus } from '@/core/knowledge/adapters/catechismAutoNexus';
import {
  mergeCuratedEdges,
  type CuratedNexusEdge,
} from '@/core/knowledge/adapters/nexusGraphMerge';
import type { ReaderNexusBucket } from '@/core/knowledge/adapters/ReaderAutoNexus';
import { getCatechismCuratedEdges } from '@/services/catechismNexusService';

/** Ordem canônica do Catecismo (mesma do adapter). */
const ORDER: readonly ReaderNexusBucket[] = [
  'bible', 'glossary', 'saint', 'father', 'magisterium', 'prayer', 'journey', 'liturgy',
];

export function useCatechismNexus(
  paragraph: number,
  range: readonly [number, number],
) {
  const [from, to] = range;

  const { data: edges } = useQuery<CuratedNexusEdge[]>({
    queryKey: ['catechism-nexus', from, to],
    queryFn: () => getCatechismCuratedEdges(from, to),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return useMemo(() => {
    const base = resolveCatechismAutoNexus({ paragraph, excerpt: null });
    return mergeCuratedEdges(base, edges ?? [], ORDER);
  }, [paragraph, edges]);
}
