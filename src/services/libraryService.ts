/**
 * libraryService — camada de acesso à Biblioteca Católica unificada.
 *
 * Consome a view `library_items_v1` e a RPC `search_library_items`
 * criadas na Onda 1 (Fundação). Nenhum novo dado é escrito por aqui —
 * a Biblioteca é uma leitura agregada dos módulos canônicos.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  LibraryFilter,
  LibraryItem,
  LibrarySearchResult,
} from '@/types/library';

const DEFAULT_LIMIT = 24;

/**
 * Busca híbrida (FTS português + filtros) sobre toda a Biblioteca.
 * Cobre Escritos, Patrística, Doutores, Clássicos e Magistério (quando disponível).
 */
export async function searchLibrary(
  filter: LibraryFilter = {},
): Promise<LibrarySearchResult> {
  const limit = filter.limit ?? DEFAULT_LIMIT;
  const offset = filter.offset ?? 0;

  const { data, error } = await supabase.rpc('search_library_items', {
    p_query: filter.query?.trim() || null,
    p_kinds: filter.kinds?.length ? filter.kinds : null,
    p_access: filter.access ?? null,
    p_completeness: filter.completeness?.length ? filter.completeness : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('[libraryService] searchLibrary error', error);
    throw error;
  }

  const rows = (data ?? []) as Array<LibraryItem & { total_count: number | string | null }>;
  const total = rows.length ? Number(rows[0].total_count ?? 0) : 0;

  const items: LibraryItem[] = rows.map(({ total_count: _t, ...item }) => item);

  return { items, total };
}

/**
 * Contagem por tipo (para os cards da landing).
 */
export async function countLibraryByKind(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('library_items_v1')
    .select('library_kind');

  if (error) {
    console.error('[libraryService] countLibraryByKind error', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { library_kind: string }) => {
    counts[row.library_kind] = (counts[row.library_kind] ?? 0) + 1;
  });
  return counts;
}

/**
 * Destaques editoriais (obras com ficha completa, ordenadas por score).
 * Usado na landing.
 */
export async function fetchLibraryFeatured(limit = 6): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from('library_items_v1')
    .select('*')
    .eq('ficha_completeness', 'complete')
    .order('editorial_score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[libraryService] fetchLibraryFeatured error', error);
    throw error;
  }
  return (data ?? []) as LibraryItem[];
}
