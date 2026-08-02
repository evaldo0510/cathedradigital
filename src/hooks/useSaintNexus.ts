/**
 * useSaintNexus — Nexus do santo: heurístico (adapter) + relações
 * CURADAS do grafo (`nexus_relations`), nas duas direções.
 *
 * Garante a navegação Santos ⇄ Catecismo mediada exclusivamente pelo Nexus.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { resolveSaintAutoNexus } from '@/core/knowledge/adapters/saintAutoNexus';
import {
  mergeCuratedEdges,
  type CuratedNexusEdge,
} from '@/core/knowledge/adapters/nexusGraphMerge';
import type { ReaderNexusBucket } from '@/core/knowledge/adapters/ReaderAutoNexus';
import { getSaintCuratedEdges } from '@/services/saintNexusService';

const ORDER: readonly ReaderNexusBucket[] = [
  'catechism', 'bible', 'prayer', 'glossary', 'father', 'magisterium', 'journey', 'liturgy',
];

export function useSaintNexus(
  slug: string,
  name: string,
  virtues: readonly string[],
) {
  const { data: edges } = useQuery<CuratedNexusEdge[]>({
    queryKey: ['saint-nexus', slug],
    queryFn: () => getSaintCuratedEdges(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const virtueKey = virtues.join('|');

  return useMemo(() => {
    const base = resolveSaintAutoNexus({ slug, name, virtues: [...virtues] });
    return mergeCuratedEdges(base, edges ?? [], ORDER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, name, virtueKey, edges]);
}
