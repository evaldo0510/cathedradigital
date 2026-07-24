import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

/**
 * Catecismo — cada card representa um parágrafo. Para o hub inicial trazemos
 * os últimos publicados; a navegação profunda continua no Reader canônico.
 */
export const catechismAdapter: LibraryAdapter = {
  module: 'catechism',
  label: 'Catecismo',

  async list({ limit = 24, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from('catechism_official')
      .select('id, paragraph, slug, texto_base, status, updated_at')
      .eq('status', 'published')
      .order('paragraph', { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => {
      const paragraph = (row as { paragraph?: number }).paragraph;
      const slug = (row as { slug?: string }).slug ?? String(paragraph ?? row.id);
      const text = (row as { texto_base?: string }).texto_base ?? '';
      return {
        id: String(row.id),
        module: 'catechism',
        title: `§ ${paragraph ?? slug}`,
        slug,
        summary: text ? text.slice(0, 240) : undefined,
        href: `/catechism/${paragraph ?? slug}`,
        updatedAt: (row as { updated_at?: string }).updated_at ?? undefined,
      };
    });
  },

  resolveHref({ slug }) {
    return `/catechism/${slug}`;
  },
};
