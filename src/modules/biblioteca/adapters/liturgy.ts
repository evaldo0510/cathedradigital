import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

/**
 * Liturgia — traz os últimos próprios do Missal publicados. O leitor real
 * continua sendo `MissaContinuousReader` / `BreviaryContinuousReader`.
 */
export const liturgyAdapter: LibraryAdapter = {
  module: 'liturgy',
  label: 'Liturgia',

  async list({ limit = 24, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from('missal_propers')
      .select('id, slug, title, subtitle, liturgical_color, date, updated_at')
      .order('date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => {
      const slug = (row as { slug?: string }).slug ?? String(row.id);
      return {
        id: String(row.id),
        module: 'liturgy',
        title: (row as { title?: string }).title ?? 'Missal',
        slug,
        summary: (row as { subtitle?: string }).subtitle ?? undefined,
        category: (row as { liturgical_color?: string }).liturgical_color ?? undefined,
        href: `/missal/${slug}`,
        updatedAt: (row as { updated_at?: string }).updated_at ?? undefined,
      };
    });
  },

  resolveHref({ slug }) {
    return `/missal/${slug}`;
  },
};
