import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedCatechismParagraph, cacheCatechismParagraph } from '@/lib/offlineCache';
import { DeepContent } from '@/types';
import { CATECHISM_LOCAL_DATA } from '@/data/catechism';

export interface CatechismParagraph extends Partial<DeepContent> {
  paragraph: number;
  content: string;
  language: string;
  status?: string;
}

export const fetchCatechismParagraph = async (paragraph: number, forceGenerate = false): Promise<CatechismParagraph> => {
  const isOfflineMode = localStorage.getItem('cathedra_offline_mode') === 'true';

  // 0) Check local static data first (NATIVE CONTENT)
  const localData = (CATECHISM_LOCAL_DATA as any)[paragraph];
  if (localData && !forceGenerate) {
    return {
      paragraph: localData.paragraph,
      content: localData.conteudo,
      language: 'pt',
      status: 'static',
      textoBase: localData.textoBase,
    };
  }

  // 1) Check IndexedDB cache next
  const cached = await getCachedCatechismParagraph(paragraph);
  if (cached && !forceGenerate) {
    return cached;
  }

  // 2) Check catechism_official table DIRECTLY (Bypassing AI edge function for official content)
  try {
    const { data: officialData, error: officialError } = await supabase
      .from('catechism_official')
      .select('*')
      .eq('paragraph', paragraph)
      .maybeSingle();

    if (officialData && !officialError) {
      const result: CatechismParagraph = {
        paragraph: officialData.paragraph,
        content: officialData.content,
        language: 'pt',
        status: 'official',
        textoBase: officialData.texto_base,
      };
      
      // Cache it locally
      cacheCatechismParagraph(paragraph, result);
      return result;
    }
  } catch (e) {
    console.error('Error fetching official catechism:', e);
  }

  // 2) If in Offline Mode and not cached/static, we must throw or return fallback
  if (isOfflineMode && !forceGenerate) {
    if (cached) return cached;
    throw new Error('Modo Somente-Cache ativo: Texto não disponível offline.');
  }

  // 3) Fetch from edge function
  const body: any = { paragraph };
  if (forceGenerate) body.action = 'generate';
  
  try {
    const { data, error } = await supabase.functions.invoke('catechism-text', { body });

    if (error) throw error;
    
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    const result: CatechismParagraph = {
      paragraph: parsed.paragraph || paragraph,
      content: parsed.content || `Parágrafo §${paragraph} — conteúdo não disponível.`,
      language: parsed.language || 'pt',
      status: parsed.status,
      textoBase: parsed.textoBase,
    };

    // 3) Only cache if content is real (not a fallback)
    if (!parsed.status || parsed.status !== 'not_cached') {
      cacheCatechismParagraph(paragraph, result);
    }

    return result;
  } catch (error: any) {
    window.dispatchEvent(new CustomEvent('supabase-unreachable'));
    // 4) Ultimate fallback to cache if available
    if (cached) {

      console.log(`Using cached content for §${paragraph} due to fetch error.`);
      return cached;
    }
    throw new Error(error.message || `Erro ao carregar o parágrafo §${paragraph}`);
  }
};

export const useCatechismParagraph = (paragraph: number, enabled = true) => {
  return useQuery({
    queryKey: ['catechism-paragraph', paragraph],
    queryFn: () => fetchCatechismParagraph(paragraph),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
    retryDelay: 2000,
    enabled,
  });
};

export const useGenerateCatechismParagraph = () => {
  const queryClient = useQueryClient();
  
  return async (paragraph: number) => {
    const result = await fetchCatechismParagraph(paragraph, true);
    queryClient.setQueryData(['catechism-paragraph', paragraph], result);
    return result;
  };
};

export const usePrefetchCatechismParagraph = () => {
  const queryClient = useQueryClient();

  const prefetch = (paragraph: number) => {
    if (paragraph < 1 || paragraph > 2865) return;
    
    queryClient.prefetchQuery({
      queryKey: ['catechism-paragraph', paragraph],
      queryFn: () => fetchCatechismParagraph(paragraph),
      staleTime: 1000 * 60 * 60 * 24,
    });
  };

  return prefetch;
};
