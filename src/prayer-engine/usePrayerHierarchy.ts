/**
 * usePrayerHierarchy — hook React Query que carrega a hierarquia de uma oração
 * e devolve blocos achatados prontos para o Reader.
 *
 * Sprint 1.0 — o Reader legado (`PrayerEngineReader`) consome `PrayerBlock[]`, então
 * fazemos o achatamento aqui até que a navegação hierárquica nativa entre.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  loadPrayerHierarchyBySlug,
  flattenSectionToBlocks,
  pickSectionForDay,
  type PrayerHierarchy,
  type DBSection,
} from './loadPrayerHierarchy';
import type { PrayerBlock } from '@/types/prayer';

interface UsePrayerHierarchyResult {
  hierarchy: PrayerHierarchy | null;
  activeSection: DBSection | null;
  blocks: PrayerBlock[];
  loading: boolean;
  error: Error | null;
}

export function usePrayerHierarchy(
  slug: string | undefined,
  sectionSlug?: string,
): UsePrayerHierarchyResult {
  const query = useQuery({
    queryKey: ['prayer-hierarchy', slug],
    queryFn: () => (slug ? loadPrayerHierarchyBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const activeSection = useMemo<DBSection | null>(() => {
    const h = query.data;
    if (!h) return null;
    if (sectionSlug) {
      const match = h.sections.find((s) => s.slug === sectionSlug);
      if (match) return match;
    }
    return pickSectionForDay(h.sections);
  }, [query.data, sectionSlug]);

  const blocks = useMemo<PrayerBlock[]>(() => {
    if (!query.data || !activeSection) return [];
    return flattenSectionToBlocks(query.data, activeSection);
  }, [query.data, activeSection]);

  return {
    hierarchy: query.data ?? null,
    activeSection,
    blocks,
    loading: query.isLoading,
    error: query.error as Error | null,
  };
}
