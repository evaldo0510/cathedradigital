import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

export const saintsAdapter: LibraryAdapter = {
  module: 'saints',
  label: 'Santos',

  async list({ limit = 24, offset = 0, filters } = {}) {
    let query = supabase
      .from('saints')
      .select('id, name, slug, short_bio, biography, category, updated_at')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (filters?.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => ({
      id: String(row.id),
      module: 'saints',
      title: (row as { name?: string }).name ?? '',
      slug: (row as { slug?: string }).slug ?? String(row.id),
      summary:
        (row as { short_bio?: string }).short_bio ??
        (row as { biography?: string }).biography?.slice(0, 240) ??
        undefined,
      category: (row as { category?: string }).category ?? undefined,
      href: `/santos/${(row as { slug?: string }).slug ?? row.id}`,
      updatedAt: (row as { updated_at?: string }).updated_at ?? undefined,
    }));
  },

  resolveHref({ slug }) {
    return `/santos/${slug}`;
  },
};
