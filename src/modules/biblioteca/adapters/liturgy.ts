import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

/**
 * Liturgia — traz os últimos próprios do Missal (chave natural: `iso_date`).
 * A tabela `missal_propers` não tem `slug/title/subtitle`; usamos
 * `iso_date` para link e `celebration_title` para o título.
 */
export const liturgyAdapter: LibraryAdapter = {
  module: 'liturgy',
  label: 'Liturgia',

  async list({ limit = 24, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from('missal_propers')
      .select('id, iso_date, celebration_title, liturgical_color, updated_at')
      .order('iso_date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return (data ?? []).map<LibraryItem>((row) => {
      const slug = row.iso_date ?? String(row.id);
      return {
        id: String(row.id),
        module: 'liturgy',
        title: row.celebration_title ?? row.iso_date ?? 'Missal',
        slug,
        summary: row.iso_date ?? undefined,
        category: row.liturgical_color ?? undefined,
        href: `/missal/${slug}`,
        updatedAt: row.updated_at ?? undefined,
      };
    });
  },

  resolveHref({ slug }) {
    return `/missal/${slug}`;
  },
};
