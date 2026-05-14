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

export interface SearchMetrics {
  responseTime: number;
  cacheHit: boolean;
  resultsCount: number;
  query: string;
}

const SEARCH_CACHE: Record<string, { data: BaseContent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Unified search for all content types
 */
export const searchUnified = async (
  query: string, 
  types?: ContentType[], 
  page: number = 0, 
  limit: number = 10,
  signal?: AbortSignal
) => {
  const startTime = performance.now();
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = `${normalizedQuery}-${types?.sort().join(',')}-${page}-${limit}`;
  
  if (SEARCH_CACHE[cacheKey] && Date.now() - SEARCH_CACHE[cacheKey].timestamp < CACHE_TTL) {
    const metrics: SearchMetrics = {
      responseTime: performance.now() - startTime,
      cacheHit: true,
      resultsCount: SEARCH_CACHE[cacheKey].data.length,
      query
    };
    return { data: SEARCH_CACHE[cacheKey].data, metrics };
  }

  const results: BaseContent[] = [];
  const from = page * limit;
  const to = from + limit - 1;
  
  // Search in Catechism
  if (!types || types.includes('catechism')) {
    const queryBuilder = supabase
      .from('catechism_paragraphs' as any)
      .select('number, content, summary')
      .or(`content.ilike.%${query}%,summary.ilike.%${query}%`)
      .range(from, to);

    if (signal) {
      (queryBuilder as any).abortSignal = signal;
    }

    const { data } = await queryBuilder;
    
    if (data) {
      (data as any[]).forEach(item => {
        results.push({
          id: `catechism-${item.number}`,
          type: 'catechism',
          title: `CIC §${item.number}`,
          summary: item.summary,
          content: item.content,
          tags: ['catecismo', 'doutrina'],
          route: `${AppRoute.CATECHISM}?p=${item.number}`
        });
      });
    }
  }

  // Potential for other types (Bible, Saints, etc)
  
  SEARCH_CACHE[cacheKey] = { data: results, timestamp: Date.now() };
  
  const metrics: SearchMetrics = {
    responseTime: performance.now() - startTime,
    cacheHit: false,
    resultsCount: results.length,
    query
  };
  
  return { data: results, metrics };
};

/**
 * Get global tag cloud
 */
export const getGlobalTags = async () => {
  return [
    { name: 'Eucaristia', category: 'sacramentos', count: 120 },
    { name: 'Confissão', category: 'sacramentos', count: 85 },
    { name: 'Oração', category: 'vida-crista', count: 210 },
    { name: 'Dogma', category: 'doutrina', count: 45 },
    { name: 'Graça', category: 'teologia', count: 67 },
    { name: 'Santos', category: 'biografia', count: 154 }
  ];
};

/**
 * Get content by ID across all types
 */
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
        route: `${AppRoute.CATECHISM}?p=${item.number}`,
        metadata: item
      };
    default:
      return null;
  }
};
