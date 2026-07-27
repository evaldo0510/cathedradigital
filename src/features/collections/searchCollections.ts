/**
 * searchCollections — busca simples em `collections` (published) por título,
 * subtítulo, descrição e track. Usada pela busca do Acervo para incluir
 * trilhas de formação junto aos trechos patrísticos.
 *
 * Sem RPC dedicada: `.ilike` cobre bem o volume atual de coleções curadas
 * (dezenas). Se ultrapassar centenas, migrar para FTS `tsvector`.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Collection } from './types';

export interface CollectionSearchHit {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover: string | null;
  estimated_reading_time_minutes: number | null;
  difficulty_level: string | null;
  track: string | null;
  certificate_eligible: boolean | null;
  items_count: number | null;
}

export async function searchCollections(
  query: string,
  limit = 6,
): Promise<CollectionSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

  const { data, error } = await supabase
    .from('collections')
    .select(
      'slug,title,subtitle,description,cover,estimated_reading_time_minutes,difficulty_level,track,certificate_eligible',
    )
    .eq('status', 'published')
    .or(
      `title.ilike.${pattern},subtitle.ilike.${pattern},description.ilike.${pattern},track.ilike.${pattern}`,
    )
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[searchCollections]', error.message);
    return [];
  }

  return ((data ?? []) as Partial<Collection>[]).map((c) => ({
    slug: c.slug as string,
    title: c.title as string,
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    cover: c.cover ?? null,
    estimated_reading_time_minutes: c.estimated_reading_time_minutes ?? null,
    difficulty_level: (c.difficulty_level as string | null) ?? null,
    track: (c.track as string | null) ?? null,
    certificate_eligible: c.certificate_eligible ?? null,
    items_count: null,
  }));
}
