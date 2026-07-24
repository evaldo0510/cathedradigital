import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

export const prayersAdapter: LibraryAdapter = {
  module: 'prayers',
  label: 'Orações',

  async list({ limit = 24, offset = 0, filters } = {}) {
    let query = supabase
      .from('prayers')
      .select('id, title, slug, subtitle, category, description, updated_at')
      .order('title', { ascending: true })
      .range(offset, offset + limit - 1);

    if (filters?.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => ({
      id: String(row.id),
      module: 'prayers',
      title: (row as { title?: string }).title ?? '',
      slug: (row as { slug?: string }).slug ?? String(row.id),
      summary:
        (row as { subtitle?: string }).subtitle ??
        (row as { description?: string }).description?.slice(0, 200) ??
        undefined,
      category: (row as { category?: string }).category ?? undefined,
      href: `/oracao/${(row as { slug?: string }).slug ?? row.id}`,
      updatedAt: (row as { updated_at?: string }).updated_at ?? undefined,
    }));
  },

  resolveHref({ slug }) {
    return `/oracao/${slug}`;
  },
};
