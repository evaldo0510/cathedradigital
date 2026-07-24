import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

/**
 * Magistério e Patrística — ambos residem em `spiritual_contents` diferenciados
 * por `category`. Exportamos dois adapters distintos consumindo a mesma tabela.
 */
async function listSpiritualContents(category: string, limit: number, offset: number) {
  const { data, error } = await supabase
    .from('spiritual_contents')
    .select('id, title, slug, summary, description, category, updated_at')
    .eq('category', category)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

function toItem(module: 'magisterium' | 'patristics', row: Record<string, unknown>): LibraryItem {
  const slug = (row.slug as string | undefined) ?? String(row.id);
  return {
    id: String(row.id),
    module,
    title: (row.title as string | undefined) ?? '',
    slug,
    summary:
      (row.summary as string | undefined) ??
      (row.description as string | undefined)?.slice(0, 220) ??
      undefined,
    category: (row.category as string | undefined) ?? undefined,
    href: module === 'magisterium' ? `/magisterio/${slug}` : `/biblioteca/padres/${slug}`,
    updatedAt: (row.updated_at as string | undefined) ?? undefined,
  };
}

export const magisteriumAdapter: LibraryAdapter = {
  module: 'magisterium',
  label: 'Magistério',
  async list({ limit = 24, offset = 0 } = {}) {
    const rows = await listSpiritualContents('magisterium', limit, offset);
    return rows.map((r) => toItem('magisterium', r as Record<string, unknown>));
  },
  resolveHref({ slug }) {
    return `/magisterio/${slug}`;
  },
};

export const patristicsAdapter: LibraryAdapter = {
  module: 'patristics',
  label: 'Patrística',
  async list({ limit = 24, offset = 0 } = {}) {
    const rows = await listSpiritualContents('patristics', limit, offset);
    return rows.map((r) => toItem('patristics', r as Record<string, unknown>));
  },
  resolveHref({ slug }) {
    return `/biblioteca/padres/${slug}`;
  },
};
