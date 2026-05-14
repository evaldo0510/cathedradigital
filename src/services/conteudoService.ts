import { supabase } from "@/integrations/supabase/client";
import { AppRoute } from "@/types";

export type ContentType = 'bible' | 'catechism' | 'saint' | 'magisterium' | 'prayer' | 'apparition' | 'dogma';

export interface BaseContent {
  id: string;
  type: ContentType;
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  tags: string[];
  route: string;
  metadata?: Record<string, any>;
}

const SEARCH_CACHE: Record<string, { data: BaseContent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const searchUnified = async (query: string, types?: ContentType[], page: number = 0, limit: number = 10) => {
  const cacheKey = `${query}-${types?.join(',')}-${page}-${limit}`;
  if (SEARCH_CACHE[cacheKey] && Date.now() - SEARCH_CACHE[cacheKey].timestamp < CACHE_TTL) {
    return SEARCH_CACHE[cacheKey].data;
  }

  const results: BaseContent[] = [];
  const from = page * limit;
  const to = from + limit - 1;
  
  if (!types || types.includes('catechism')) {
    const { data } = await supabase
      .from('catechism_paragraphs' as any)
      .select('number, content, summary')
      .or(`content.ilike.%${query}%,summary.ilike.%${query}%`)
      .range(from, to);
    
    if (data) {
      (data as any[]).forEach(item => {
        results.push({
          id: `catechism-${item.number}`,
          type: 'catechism',
          title: `CIC §${item.number}`,
          summary: item.summary,
          content: item.content,
          tags: ['catecismo', 'doutrina'],
          route: `/catechism?p=${item.number}`
        });
      });
    }
  }

  // Add more sources as needed
  
  SEARCH_CACHE[cacheKey] = { data: results, timestamp: Date.now() };
  return results;
};

export const getTagCloud = async () => {
  // Centralized tags for global navigation/filtering
  return [
    { name: 'Eucaristia', category: 'sacramentos' },
    { name: 'Misericórdia', category: 'espiritualidade' },
    { name: 'Oração', category: 'vida-crista' },
    { name: 'Santos', category: 'biografia' },
    { name: 'Doutrina', category: 'teologia' }
  ];
};

export const getContentById = async (type: ContentType, id: string): Promise<BaseContent | null> => {
  switch (type) {
    case 'catechism':
      const { data: cic } = await supabase
        .from('catechism_paragraphs' as any)
        .select('*')
        .eq('number', parseInt(id))
        .single();
      
      const item = cic as any;
      if (!item) return null;
      
      return {
        id: `catechism-${item.number}`,
        type: 'catechism',
        title: `CIC §${item.number}`,
        content: item.content,
        tags: ['catecismo'],
        route: `/catechism?p=${item.number}`,
        metadata: item
      };
    default:
      return null;
  }
};
