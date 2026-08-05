import { supabase } from "@/integrations/supabase/client";

export type SearchResultType = 
  | 'bible' 
  | 'catechism' 
  | 'saint' 
  | 'patristic' 
  | 'magisterium' 
  | 'prayer' 
  | 'journey' 
  | 'glossary';

export interface GlobalSearchHit {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  item_type: SearchResultType;
  slug: string;
  rank: number;
}

/**
 * Biblioteca Inteligente (Global Search V2)
 * Busca unificada em todos os módulos do Cathedra.
 */
export async function globalSearchV2(query: string, limit: number = 20): Promise<GlobalSearchHit[]> {
  const { data, error } = await supabase.rpc('global_search_v2', {
    p_query: query,
    p_limit: limit
  });

  if (error) {
    console.error('Error in globalSearchV2:', error);
    return [];
  }

  return (data as any[]) || [];
}
