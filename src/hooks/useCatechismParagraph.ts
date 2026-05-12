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
  explicacao?: string;
  interpretacaoProfunda?: string;
  aplicacaoPratica?: string;
  reflexaoFinal?: string;
  exercicio?: string;
}

export const fetchCatechismParagraph = async (paragraph: number, forceGenerate = false): Promise<CatechismParagraph> => {
  const isOfflineMode = localStorage.getItem('cathedra_offline_mode') === 'true';

  // 1) Check IndexedDB cache first
  const cached = await getCachedCatechismParagraph(paragraph);
  if (cached && !forceGenerate) {
    return cached;
  }

  // 2) Check catechism_official table DIRECTLY (Priority: Direct Connection as requested)
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
        explicacao: officialData.explicacao,
        interpretacaoProfunda: officialData.interpretacao_profunda,
        aplicacaoPratica: officialData.aplicacao_pratica,
        reflexaoFinal: officialData.reflexao_final,
        exercicio: officialData.exercicio,
      };
      
      // Cache it locally
      cacheCatechismParagraph(paragraph, result);
      return result;
    }
  } catch (e) {
    console.error('Error fetching official catechism:', e);
  }

  // 3) Check local static data next (NATIVE CONTENT fallback)
  const localData = (CATECHISM_LOCAL_DATA as any)[paragraph];
  if (localData && !forceGenerate) {
    const result: CatechismParagraph = {
      paragraph: localData.paragraph,
      content: localData.conteudo,
      language: 'pt',
      status: 'static',
      textoBase: localData.textoBase,
    };
    cacheCatechismParagraph(paragraph, result);
    return result;
  }

  // 4) If in Offline Mode and not cached/static, we must throw or return fallback
  if (isOfflineMode && !forceGenerate) {
    if (cached) return cached;
    throw new Error('Modo Somente-Cache ativo: Texto não disponível offline.');
  }

  // 5) Fetch from edge function (STRICTLY FETCH ONLY - NO AI GENERATION FALLBACK)
  if (forceGenerate) {
    console.warn('AI generation requested but blocked by security policy.');
  }
  const body: any = { paragraph, action: 'fetch' };

  try {
    const { data, error } = await supabase.functions.invoke('catechism-text', { body });

    if (error) throw error;
    
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (!parsed || (parsed.status === 'not_cached' && !forceGenerate)) {
       // If not found and not forcing generation, just throw to handle in UI
       throw new Error(`Parágrafo §${paragraph} não disponível.`);
    }

    const result: CatechismParagraph = {
      paragraph: parsed.paragraph || paragraph,
      content: parsed.content || `Parágrafo §${paragraph} — conteúdo não disponível.`,
      language: parsed.language || 'pt',
      status: parsed.status,
      textoBase: parsed.textoBase,
      explicacao: parsed.explicacao,
      interpretacaoProfunda: parsed.interpretacaoProfunda,
      aplicacaoPratica: parsed.aplicacaoPratica,
      reflexaoFinal: parsed.reflexaoFinal,
      exercicio: parsed.exercicio,
    };

    // Cache it locally
    cacheCatechismParagraph(paragraph, result);
    return result;
  } catch (error: any) {
    window.dispatchEvent(new CustomEvent('supabase-unreachable'));
    if (cached) return cached;
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
