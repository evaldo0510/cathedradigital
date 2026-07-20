import { supabase } from '@/integrations/supabase/client';
import { type Saint } from '@/data/saints';
import { combinedSimilarity } from '@/lib/similarity';

// Colunas mínimas para listagens/cards (evita puxar full_bio, works e refs
// pesados). Detalhes (getSaintById) continuam com select('*').
const LIST_COLUMNS =
  'id, name, title, category, feast_day, feast_month, feast_day_num, image, patron_of, virtues, subtitle';

export const getSaintsByDate = async (month: number, day: number): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select(LIST_COLUMNS)
    .eq('feast_month', month)
    .eq('feast_day_num', day);

  if (error) {
    console.error('Error fetching saints by date:', error);
    return [];
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
    .select('*')
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
    .limit(1);

  if (error || !data?.length) return null;
  return formatSaint(data[0]);
};

export const getSaintById = async (id: string): Promise<Saint | null> => {
  const { data, error } = await supabase
    .from('saints')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching saint by id:', error);
    return null;
  }

  return formatSaint(data);
};

export const formatSaint = (dbSaint: any): Saint => {
  return {
    ...dbSaint,
    feastDay: dbSaint.feast_day,
    feastMonth: dbSaint.feast_month,
    feastDayNum: dbSaint.feast_day_num,
    patronOf: dbSaint.patron_of || [],
    fullBio: dbSaint.full_bio,
    works: Array.isArray(dbSaint.works) ? dbSaint.works : (typeof dbSaint.works === 'string' ? JSON.parse(dbSaint.works) : (dbSaint.works || [])),
    bibleRefs: Array.isArray(dbSaint.bible_refs) ? dbSaint.bible_refs : (typeof dbSaint.bible_refs === 'string' ? JSON.parse(dbSaint.bible_refs) : (dbSaint.bible_refs || [])),
    catechismRefs: dbSaint.catechism_refs || [],
    churchDocRefs: Array.isArray(dbSaint.church_doc_refs) ? dbSaint.church_doc_refs : (typeof dbSaint.church_doc_refs === 'string' ? JSON.parse(dbSaint.church_doc_refs) : (dbSaint.church_doc_refs || [])),
  };
};