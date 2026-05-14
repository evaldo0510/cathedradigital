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

export const searchUnified = async (query: string, types?: ContentType[]) => {
  // Mocking search across multiple tables (usually requires a unified search index or RPC)
  // For now, implementing a basic version that can be expanded
  const results: BaseContent[] = [];
  
  if (!types || types.includes('catechism')) {
    const { data } = await supabase
      .from('catechism_paragraphs')
      .select('number, content, summary')
      .or(`content.ilike.%${query}%,summary.ilike.%${query}%`)
      .limit(10);
    
    if (data) {
      data.forEach(item => {
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
        .from('catechism_paragraphs')
        .select('*')
        .eq('number', parseInt(id))
        .single();
      if (!cic) return null;
      return {
        id: `catechism-${cic.number}`,
        type: 'catechism',
        title: `CIC §${cic.number}`,
        content: cic.content,
        tags: ['catecismo'],
        route: `/catechism?p=${cic.number}`,
        metadata: cic
      };
    // Implement others
    default:
      return null;
  }
};
