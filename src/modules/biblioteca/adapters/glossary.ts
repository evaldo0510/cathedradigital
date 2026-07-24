import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem, LibraryIce } from '../types';

const iceFrom = (value: string | null | undefined): LibraryIce | undefined => {
  if (value === 'complete' || value === 'review' || value === 'draft') return value;
  return undefined;
};

export const glossaryAdapter: LibraryAdapter = {
  module: 'glossary',
  label: 'Glossário',

  async list({ limit = 24, offset = 0, filters } = {}) {
    let query = supabase
      .from('glossary')
      .select('id, term, slug, short_definition, category, editorial_completeness, updated_at')
      .eq('status', 'published')
      .order('term', { ascending: true })
      .range(offset, offset + limit - 1);

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.ice?.length) query = query.in('editorial_completeness', filters.ice);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => ({
      id: String(row.id),
      module: 'glossary',
      title: row.term ?? '',
      slug: row.slug ?? String(row.id),
      summary: row.short_definition ?? undefined,
      category: row.category ?? undefined,
      ice: iceFrom(row.editorial_completeness as string | null),
      href: `/glossario/${row.slug ?? row.id}`,
      updatedAt: row.updated_at ?? undefined,
    }));
  },

  resolveHref({ slug }) {
    return `/glossario/${slug}`;
  },
};
