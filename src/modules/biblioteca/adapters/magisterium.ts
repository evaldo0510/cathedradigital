import { supabase } from '@/integrations/supabase/client';
import type { LibraryAdapter, LibraryItem } from '../types';

/**
 * Magistério e Patrística compartilham `spiritual_contents` — diferenciados
 * pela coluna `type`. A tabela expõe: `id, title, content_text, tags, type,
 * reference_id, metadata, created_at`. Não há `slug` nem `updated_at`.
 */
type SpiritualRow = {
  id: string;
  title: string | null;
  content_text: string | null;
  type: string | null;
  tags: string[] | null;
  reference_id: string | null;
  created_at: string | null;
};

async function listSpiritualContents(type: string, limit: number, offset: number) {
  const { data, error } = await supabase
    .from('spiritual_contents')
    .select('id, title, content_text, type, tags, reference_id, created_at')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as SpiritualRow[];
}

function toItem(module: 'magisterium' | 'patristics', row: SpiritualRow): LibraryItem {
  const slug = row.reference_id ?? String(row.id);
  const encoded = encodeURIComponent(slug);
  return {
    id: String(row.id),
    module,
    title: row.title ?? '',
    slug,
    summary: row.content_text ? row.content_text.slice(0, 220) : undefined,
    themes: row.tags ?? undefined,
    href: module === 'magisterium' ? `/magisterium/${encoded}` : `/biblioteca/padres/${encoded}`,
    updatedAt: row.created_at ?? undefined,
  };
}

export const magisteriumAdapter: LibraryAdapter = {
  module: 'magisterium',
  label: 'Magistério',
  async list({ limit = 24, offset = 0 } = {}) {
    const rows = await listSpiritualContents('magisterium', limit, offset);
    return rows.map((r) => toItem('magisterium', r));
  },
  resolveHref({ slug }) {
    return `/magisterium/${encodeURIComponent(slug)}`;
  },
};

export const patristicsAdapter: LibraryAdapter = {
  module: 'patristics',
  label: 'Patrística',
  async list({ limit = 24, offset = 0 } = {}) {
    const rows = await listSpiritualContents('patristics', limit, offset);
    return rows.map((r) => toItem('patristics', r));
  },
  resolveHref({ slug }) {
    return `/biblioteca/padres/${slug}`;
  },
};
