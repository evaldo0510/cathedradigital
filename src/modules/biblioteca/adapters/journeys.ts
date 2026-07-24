import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

export const journeysAdapter: LibraryAdapter = {
  module: 'journeys',
  label: 'Jornadas',

  async list({ limit = 24, offset = 0, filters } = {}) {
    let query = supabase
      .from('journeys')
      .select('id, title, slug, subtitle, description, category, difficulty, status, tags, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => ({
      id: String(row.id),
      module: 'journeys',
      title: row.title ?? '',
      slug: row.slug ?? String(row.id),
      summary: row.subtitle ?? row.description ?? undefined,
      category: row.category ?? row.difficulty ?? undefined,
      themes: Array.isArray(row.tags) ? (row.tags as string[]) : undefined,
      href: `/jornadas/${row.slug ?? row.id}`,
      updatedAt: row.updated_at ?? undefined,
    }));
  },

  resolveHref({ slug }) {
    return `/jornadas/${slug}`;
  },
};
