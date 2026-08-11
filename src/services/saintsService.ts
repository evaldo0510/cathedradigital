import { supabase } from '@/integrations/supabase/client';
import { type Saint } from '@/data/saints';
import { combinedSimilarity } from '@/lib/similarity';

// Colunas mínimas para listagens/cards (evita puxar full_bio, works e refs
// pesados). Detalhes (getSaintById) continuam com select('*').
const LIST_COLUMNS =
  'id, name, title, category, feast_day, feast_month, feast_day_num, image, patron_of, virtues, born, died, bio';

const DETAIL_COLUMNS = '*';

export const getSaintsByDate = async (month: number, day: number): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select(LIST_COLUMNS)
    .eq('feast_month', month)
    .eq('feast_day_num', day)
    .neq('status', 'merged');

  if (error) {
    console.error('Error fetching saints by date:', error);
    return [];
  }

  return (data || []).map(formatSaint);
};

/**
 * Variante que lança a exceção em vez de silenciar o erro. Use em telas
 * onde o usuário precisa poder tentar novamente (React Query `isError`).
 */
export const getSaintsByDateOrThrow = async (
  month: number,
  day: number,
): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select(LIST_COLUMNS)
    .eq('feast_month', month)
    .eq('feast_day_num', day)
    .neq('status', 'merged');

  if (error) {
    console.error('Error fetching saints by date:', error);
    throw new Error(error.message || 'Falha ao carregar santos do dia.');
  }

  return (data || []).map(formatSaint);
};




export interface SaintWithScore extends Saint {
  similarityScore?: number;
}

export const searchSaints = async (query: string): Promise<SaintWithScore[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Use pg_trgm-powered RPC for fast, relevance-ranked fuzzy search
  const { data, error } = await supabase.rpc('search_saints_fuzzy', {
    search_query: trimmed,
    result_limit: 50,
  });

  const attachScore = (saint: Saint): SaintWithScore => ({
    ...saint,
    similarityScore: combinedSimilarity(trimmed, saint.name || '', saint.title || '', 0.7),
  });

  if (error) {
    console.error('Fuzzy search failed, falling back to ILIKE:', error);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('saints')
      .select('*')
      .or(`name.ilike.%${trimmed}%,title.ilike.%${trimmed}%`)
      .neq('status', 'merged')
      .limit(50);


    if (fallbackError) {
      console.error('Error searching saints:', fallbackError);
      return [];
    }
    return (fallbackData || []).map(formatSaint).map(attachScore);
  }

  return (data || []).map(formatSaint).map(attachScore);
};

export const getSaintsByCategory = async (category: string): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select(LIST_COLUMNS)
    .eq('category', category)
    .neq('status', 'merged')
    .order('name');

  if (error) {
    console.error('Error fetching saints by category:', error);
    return [];
  }

  return (data || []).map(formatSaint);
};

export const getSaintsByVirtue = async (virtue: string): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select(LIST_COLUMNS)
    .contains('virtues', [virtue])
    .neq('status', 'merged')
    .limit(10);

  if (error) {
    console.error('Error fetching saints by virtue:', error);
    return [];
  }

  return (data || []).map(formatSaint);
};


export const findSaintByVirtues = async (virtues: string[]): Promise<Saint | null> => {
  for (const virtue of virtues) {
    const saints = await getSaintsByVirtue(virtue);
    if (saints.length > 0) return saints[0];
  }
  return null;
};

export const getAllSaints = async (limit: number = 100): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select(LIST_COLUMNS)
    .neq('status', 'merged')
    .order('name')
    .limit(limit);

  if (error) {
    console.error('Error fetching all saints:', error);
    return [];
  }

  return (data || []).map(formatSaint);
};

export const getSaintBySubtitle = async (subtitle: string): Promise<Saint | null> => {
  if (!subtitle.trim()) return null;
  const { data, error } = await supabase
    .from('saints')
    .select('*')
    .ilike('name', `%${subtitle}%`)
    .neq('status', 'merged')
    .limit(1);

  if (error || !data?.length) return null;
  return formatSaint(data[0]);
};


export const getSaintById = async (id: string): Promise<Saint | null> => {
  const { data, error } = await supabase
    .from('saints')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching saint by id:', error);
    return null;
  }

  return formatSaint(data);
};

const parseJson = <T>(v: any, fallback: T): T => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return fallback; }
  }
  return v as T;
};

export const formatSaint = (dbSaint: any): Saint => {
  return {
    ...dbSaint,
    feastDay: dbSaint.feast_day,
    feastMonth: dbSaint.feast_month,
    feastDayNum: dbSaint.feast_day_num,
    patronOf: dbSaint.patron_of || [],
    fullBio: dbSaint.full_bio,
    works: Array.isArray(dbSaint.works) ? dbSaint.works : parseJson(dbSaint.works, []),
    bibleRefs: Array.isArray(dbSaint.bible_refs) ? dbSaint.bible_refs : parseJson(dbSaint.bible_refs, []),
    catechismRefs: dbSaint.catechism_refs || [],
    churchDocRefs: Array.isArray(dbSaint.church_doc_refs) ? dbSaint.church_doc_refs : parseJson(dbSaint.church_doc_refs, []),
    // Sanctorum 2.0
    biographyFull: parseJson(dbSaint.biography_full, {}),
    historicalContext: dbSaint.historical_context ?? undefined,
    century: dbSaint.century ?? undefined,
    timeline: parseJson(dbSaint.timeline, []),
    miracles: parseJson(dbSaint.miracles, []),
    iconography: parseJson(dbSaint.iconography, {}),
    patronages: dbSaint.patronages || [],
    curiosities: dbSaint.curiosities || [],
    sources: parseJson(dbSaint.sources, []),
    spiritualPractice: parseJson(dbSaint.spiritual_practice, {}),
    quotesRich: parseJson(dbSaint.quotes_rich, []),
    contentStatus: dbSaint.content_status ?? 'stub',
    // v3 — Biblioteca Viva
    country: dbSaint.country ?? undefined,
    vocation: dbSaint.vocation ?? undefined,
    aiReflection: parseJson(dbSaint.ai_reflection, undefined),
    // Onda 2 — complementos editoriais (TEXT)
    // Onda 2 — complementos editoriais (TEXT)
    conversionStory: dbSaint.conversion_story ?? undefined,
    mission: dbSaint.mission ?? undefined,
    legacy: dbSaint.legacy ?? undefined,
    // Sprint 3.2.1 — narrativa espiritual
    spiritualitySummary: dbSaint.spirituality_summary ?? undefined,
    keyEvents: parseJson(dbSaint.key_events, []),
  };

};

// ── v3 — Filtros combinados da Biblioteca dos Santos ───────────
export type SaintsSortOption = 'name-asc' | 'name-desc' | 'feast-asc' | 'feast-desc';

export interface SaintsFilterInput {
  query?: string;
  category?: string;         // apostle | martyr | doctor | pope | founder ...
  century?: number;
  country?: string;
  virtue?: string;
  vocation?: string;
  limit?: number;
  offset?: number;
  sort?: SaintsSortOption;
}

export interface SaintsAdvancedResult {
  items: Saint[];
  total: number;
}

export const searchSaintsAdvanced = async (
  filters: SaintsFilterInput,
): Promise<SaintsAdvancedResult> => {
  let q = supabase
    .from('saints')
    .select(LIST_COLUMNS + ', century, country, vocation', { count: 'exact' })
    .neq('status', 'merged');



  if (filters.category) q = q.eq('category', filters.category);
  if (filters.century) q = q.eq('century', filters.century);
  if (filters.country) q = q.ilike('country', `%${filters.country}%`);
  if (filters.vocation) q = q.ilike('vocation', `%${filters.vocation}%`);
  if (filters.virtue) q = q.contains('virtues', [filters.virtue]);
  if (filters.query && filters.query.trim()) {
    const t = filters.query.trim();
    q = q.or(`name.ilike.%${t}%,title.ilike.%${t}%`);
  }

  const sort = filters.sort ?? 'name-asc';
  switch (sort) {
    case 'name-desc':
      q = q.order('name', { ascending: false });
      break;
    case 'feast-asc':
      q = q
        .order('feast_month', { ascending: true, nullsFirst: false })
        .order('feast_day_num', { ascending: true, nullsFirst: false })
        .order('name');
      break;
    case 'feast-desc':
      q = q
        .order('feast_month', { ascending: false, nullsFirst: false })
        .order('feast_day_num', { ascending: false, nullsFirst: false })
        .order('name');
      break;
    case 'name-asc':
    default:
      q = q.order('name', { ascending: true });
  }

  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) {
    console.error('searchSaintsAdvanced error:', error);
    return { items: [], total: 0 };
  }
  return { items: (data || []).map(formatSaint), total: count ?? 0 };
};

export const getSaintsFilterFacets = async (): Promise<{
  countries: string[];
  vocations: string[];
  virtues: string[];
  centuries: number[];
}> => {
  const { data } = await supabase
    .from('saints')
    .select('country, vocation, virtues, century')
    .neq('status', 'merged')
    .limit(2000);


  const countries = new Set<string>();
  const vocations = new Set<string>();
  const virtues = new Set<string>();
  const centuries = new Set<number>();

  for (const row of data || []) {
    if (row.country) countries.add(row.country);
    if (row.vocation) vocations.add(row.vocation);
    if (row.century) centuries.add(row.century);
    if (Array.isArray(row.virtues)) row.virtues.forEach((v: string) => v && virtues.add(v));
  }

  return {
    countries: [...countries].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    vocations: [...vocations].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    virtues: [...virtues].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    centuries: [...centuries].sort((a, b) => a - b),
  };
};