import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedCatechismParagraph, cacheCatechismParagraph } from '@/lib/offlineCache';
import { DeepContent } from '@/types';

export interface CatechismParagraph extends Partial<DeepContent> {
  paragraph: number;
  content: string;
  language: string;
}

export const fetchCatechismParagraph = async (paragraph: number): Promise<CatechismParagraph> => {
  // 1) Check IndexedDB cache first
  const cached = await getCachedCatechismParagraph(paragraph);
  const isStale = cached?.content && (
    cached.content.includes('processamento') || 
    cached.content.includes('sendo carregado') ||
    cached.content.length < 20
  );
  
  if (cached?.content && !isStale) {
    return cached as CatechismParagraph;
  }

  // 2) Fetch from edge function
  const { data, error } = await supabase.functions.invoke('catechism-text', {
    body: { paragraph }
  });

  if (error) {
    throw new Error(error.message || `Erro ao carregar o parágrafo §${paragraph}`);
  }

  const parsed = typeof data === 'string' ? JSON.parse(data) : data;

  // If server returned a "loading" status, throw to trigger retry
  if (parsed.status === 'loading') {
    throw new Error(`Parágrafo §${paragraph} ainda sendo processado`);
  }

  const result: CatechismParagraph = {
    paragraph: parsed.paragraph || paragraph,
    content: parsed.content || `Parágrafo §${paragraph} — conteúdo não disponível.`,
    language: parsed.language || 'pt',
    textoBase: parsed.textoBase,
    explicacao: parsed.explicacao,
    interpretacaoProfunda: parsed.interpretacaoProfunda,
    aplicacaoPratica: parsed.aplicacaoPratica,
    reflexaoFinal: parsed.reflexaoFinal,
    exercicio: parsed.exercicio
  };

  // 3) Persist to IndexedDB for offline
  cacheCatechismParagraph(paragraph, result);

  return result;
};

export const useCatechismParagraph = (paragraph: number) => {
  return useQuery({
    queryKey: ['catechism-paragraph', paragraph],
    queryFn: () => fetchCatechismParagraph(paragraph),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
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
