import { supabase } from '@/integrations/supabase/client';
import { type Saint } from '@/data/saints';

export const getSaintsByDate = async (month: number, day: number): Promise<Saint[]> => {
  const { data, error } = await supabase
    .from('saints')
    .select('*')
    .eq('feast_month', month)
    .eq('feast_day_num', day);

  if (error) {
    console.error('Error fetching saints by date:', error);
    return [];
  }

  return (data || []).map(formatSaint);
};

/**
 * Compute a similarity score (0-1) between query and target using a
 * lightweight trigram-style approximation. Used purely for client-side
 * UI hints — the authoritative ranking still comes from Postgres pg_trgm.
 */
const computeSimilarity = (query: string, target: string): number => {
  if (!query || !target) return 0;
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(query);
  const t = norm(target);
  if (t.includes(q)) return Math.min(1, q.length / Math.max(t.length, 1) + 0.5);

  const trigrams = (s: string): Set<string> => {
    const padded = `  ${s} `;
    const set = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
    return set;
  };
  const a = trigrams(q);
  const b = trigrams(t);
  let shared = 0;
  a.forEach(g => { if (b.has(g)) shared++; });
  return shared / (a.size + b.size - shared || 1);
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
    similarityScore: Math.max(
      computeSimilarity(trimmed, saint.name || ''),
      computeSimilarity(trimmed, saint.title || '') * 0.7
    ),
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
    .select('*')
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
    .select('*')
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