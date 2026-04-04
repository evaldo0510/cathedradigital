import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CatechismParagraph {
  paragraph: number;
  content: string;
  language: string;
}

export const fetchCatechismParagraph = async (paragraph: number): Promise<CatechismParagraph> => {
  const { data, error } = await supabase.functions.invoke('catechism-text', {
    body: { paragraph }
  });

  if (error) {
    throw new Error(error.message || `Erro ao carregar o parágrafo §${paragraph}`);
  }

  // Handle case where data comes as string (text/plain response)
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;

  return {
    paragraph: parsed.paragraph || paragraph,
    content: parsed.content || `Parágrafo §${paragraph} — conteúdo não disponível.`,
    language: parsed.language || 'pt'
  };
};

export const useCatechismParagraph = (paragraph: number) => {
  return useQuery({
    queryKey: ['catechism-paragraph', paragraph],
    queryFn: () => fetchCatechismParagraph(paragraph),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (static content)
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
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
