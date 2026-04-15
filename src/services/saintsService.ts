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

export const searchSaints = async (query: string): Promise<Saint[]> => {
  if (!query.trim()) return [];
  
  // Use text search for better performance and relevance
  const { data, error } = await supabase
    .from('saints')
    .select('*')
    .textSearch('name', query, { config: 'portuguese', type: 'plain' })
    .limit(50);

  if (error) {
    // Fallback to ilike if text search fails or has issues
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('saints')
      .select('*')
      .or(`name.ilike.%${query}%,title.ilike.%${query}%`)
      .limit(50);
      
    if (fallbackError) {
      console.error('Error searching saints:', fallbackError);
      return [];
    }
    return (fallbackData || []).map(formatSaint);
  }

  return (data || []).map(formatSaint);
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