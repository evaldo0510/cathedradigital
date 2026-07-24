import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

/**
 * Catecismo — cada card representa um parágrafo publicado. A tabela usa
 * `paragraph` (int) como identificador natural; não há coluna `id` separada.
 */
export const catechismAdapter: LibraryAdapter = {
  module: 'catechism',
  label: 'Catecismo',

  async list({ limit = 24, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from('catechism_official')
      .select('paragraph, slug, texto_base, status')
      .eq('status', 'published')
      .order('paragraph', { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => {
      const paragraph = row.paragraph;
      const slug = row.slug ?? String(paragraph);
      return {
        id: String(paragraph),
        module: 'catechism',
        title: `§ ${paragraph}`,
        slug,
        summary: row.texto_base ? row.texto_base.slice(0, 240) : undefined,
        href: `/catechism/${paragraph}`,
      };
    });
  },

  resolveHref({ slug }) {
    return `/catechism/${slug}`;
  },
};
