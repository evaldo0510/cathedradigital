import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

export const saintsAdapter: LibraryAdapter = {
  module: 'saints',
  label: 'Santos',

  async list({ limit = 24, offset = 0, filters } = {}) {
    let query = supabase
      .from('saints')
      .select('id, name, title, bio, category, updated_at')
      .neq('status', 'merged')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);


    if (filters?.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => ({
      id: String(row.id),
      module: 'saints',
      title: row.name ?? '',
      slug: String(row.id),
      summary: row.title ?? row.bio?.slice(0, 220) ?? undefined,
      category: row.category ?? undefined,
      href: `/santos/${row.id}`,
      updatedAt: row.updated_at ?? undefined,
    }));
  },

  resolveHref({ slug }) {
    return `/santos/${slug}`;
  },
};
