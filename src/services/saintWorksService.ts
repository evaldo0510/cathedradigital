/**
 * Biblioteca Patrística — Serviço de acesso.
 *
 * Regra COS §11 (Editorial License Rule): só publica com licença.
 * Regra Reader Architecture: este serviço NÃO renderiza; apenas provê dados.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  SaintWork,
  SaintWorkChapter,
  SaintWorkCategory,
} from '@/types/saintWorks';

const WORKS_TABLE = 'saint_works';
const CHAPTERS_TABLE = 'saint_work_chapters';

/** Lista todas as obras publicadas de um santo. */
export async function listWorksBySaint(saintId: string): Promise<SaintWork[]> {
  const { data, error } = await supabase
    .from(WORKS_TABLE)
    .select('*')
    .eq('saint_id', saintId)
    .eq('status', 'published')
    .order('year_written', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('[saintWorksService] listWorksBySaint', error);
    return [];
  }
  return (data ?? []) as SaintWork[];
}

/** Lista todas as obras publicadas por categoria (escola espiritual). */
export async function listWorksByCategory(
  category: SaintWorkCategory
): Promise<SaintWork[]> {
  const { data, error } = await supabase
    .from(WORKS_TABLE)
    .select('*')
    .eq('category', category)
    .eq('status', 'published')
    .order('title', { ascending: true });

  if (error) {
    console.error('[saintWorksService] listWorksByCategory', error);
    return [];
  }
  return (data ?? []) as SaintWork[];
}

/** Lista todas as obras publicadas (índice geral da biblioteca). */
export async function listAllPublishedWorks(): Promise<SaintWork[]> {
  const { data, error } = await supabase
    .from(WORKS_TABLE)
    .select('*')
    .eq('status', 'published')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('[saintWorksService] listAllPublishedWorks', error);
    return [];
  }
  return (data ?? []) as SaintWork[];
}

/** Obtém uma obra publicada por slug do santo e slug da obra. */
export async function getWorkBySlug(
  saintSlug: string,
  workSlug: string
): Promise<SaintWork | null> {
  // Na Cathedra atual `saints.id` é o próprio slug (TEXT). Não existe coluna `slug`.
  // Usamos o parâmetro `saintSlug` diretamente como id.
  const saintId = saintSlug;


  const { data, error } = await supabase
    .from(WORKS_TABLE)
    .select('*')
    .eq('saint_id', saintId)
    .eq('slug', workSlug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('[saintWorksService] getWorkBySlug', error);
    return null;
  }
  return data as SaintWork | null;
}

/** Lista capítulos (ordem + título) de uma obra — leve, sem body. */
export async function listChapters(workId: string): Promise<
  Array<Pick<SaintWorkChapter, 'id' | 'order' | 'title' | 'subtitle' | 'reading_minutes'>>
> {
  const { data, error } = await supabase
    .from(CHAPTERS_TABLE)
    .select('id, order, title, subtitle, reading_minutes')
    .eq('work_id', workId)
    .order('order', { ascending: true });

  if (error) {
    console.error('[saintWorksService] listChapters', error);
    return [];
  }
  return (data ?? []) as Array<
    Pick<SaintWorkChapter, 'id' | 'order' | 'title' | 'subtitle' | 'reading_minutes'>
  >;
}

/** Carrega um capítulo completo (com body_html). */
export async function getChapter(
  workId: string,
  order: number
): Promise<SaintWorkChapter | null> {
  const { data, error } = await supabase
    .from(CHAPTERS_TABLE)
    .select('*')
    .eq('work_id', workId)
    .eq('order', order)
    .maybeSingle();

  if (error) {
    console.error('[saintWorksService] getChapter', error);
    return null;
  }
  return data as SaintWorkChapter | null;
}

/** Busca textual dentro de uma obra (fallback ILIKE em body_plain). */
export async function searchInWork(
  workId: string,
  query: string
): Promise<Array<Pick<SaintWorkChapter, 'id' | 'order' | 'title'>>> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from(CHAPTERS_TABLE)
    .select('id, order, title')
    .eq('work_id', workId)
    .ilike('body_plain', `%${q}%`)
    .order('order', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[saintWorksService] searchInWork', error);
    return [];
  }
  return (data ?? []) as Array<Pick<SaintWorkChapter, 'id' | 'order' | 'title'>>;
}

/* ---------------------------------------------------------------------- */
/* Global full-text search (E1.4)                                          */
/* ---------------------------------------------------------------------- */

export interface PatristicSearchHit {
  work_id: string;
  work_slug: string;
  work_title: string;
  saint_id: string;
  saint_name: string | null;
  category: string;
  year_written: number | null;
  chapter_id: string | null;
  chapter_order: number | null;
  chapter_title: string | null;
  /** Trecho já contendo <mark> em torno dos termos. Sanitizado no server. */
  snippet: string;
  rank: number;
  total_count: number;
}

export interface PatristicSearchResult {
  hits: PatristicSearchHit[];
  total: number;
  page: number;
  pageSize: number;
}

export async function searchPatristicLibrary(
  query: string,
  page = 1,
  pageSize = 10,
): Promise<PatristicSearchResult> {
  const q = query.trim();
  if (q.length < 2) {
    return { hits: [], total: 0, page, pageSize };
  }
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: { search_query: string; page_number: number; page_size: number },
  ) => Promise<{ data: PatristicSearchHit[] | null; error: Error | null }>)(
    'search_patristic_library',
    { search_query: q, page_number: page, page_size: pageSize },
  );
  if (error) {
    console.error('[saintWorksService] searchPatristicLibrary', error);
    return { hits: [], total: 0, page, pageSize };
  }
  const hits = data ?? [];
  return {
    hits,
    total: hits[0]?.total_count ?? 0,
    page,
    pageSize,
  };
}

/* ---------------------------------------------------------------------- */
/* Audit log (E1.3.1)                                                      */
/* ---------------------------------------------------------------------- */

export interface SaintWorksAuditEntry {
  id: string;
  work_id: string;
  chapter_id: string | null;
  action:
    | 'created'
    | 'updated'
    | 'status_changed'
    | 'chapter_created'
    | 'chapter_updated'
    | 'chapter_deleted';
  from_status: string | null;
  to_status: string | null;
  changed_fields: string[];
  actor_id: string | null;
  actor_email: string | null;
  notes: string | null;
  created_at: string;
}

export async function listWorkAudit(workId: string, limit = 100): Promise<SaintWorksAuditEntry[]> {
  const { data, error } = await supabase
    .from('saint_works_audit')
    .select('*')
    .eq('work_id', workId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[saintWorksService] listWorkAudit', error);
    return [];
  }
  return (data ?? []) as SaintWorksAuditEntry[];
}

