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
