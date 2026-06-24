import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedCatechismParagraph, cacheCatechismParagraph } from '@/lib/offlineCache';
import { DeepContent } from '@/types';
import { CATECHISM_LOCAL_DATA } from '@/data/catechism';
import {
  logCatechismDiag,
  classifyCatechismError,
} from '@/lib/catechismDiagnostics';

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

export class CatechismFetchError extends Error {
  code: 'unauthorized' | 'forbidden' | 'not_found' | 'network' | 'unknown';
  status?: number;
  paragraph: number;
  constructor(paragraph: number, code: CatechismFetchError['code'], message: string, status?: number) {
    super(message);
    this.name = 'CatechismFetchError';
    this.code = code;
    this.status = status;
    this.paragraph = paragraph;
  }
}

export const fetchCatechismParagraph = async (paragraph: number, forceGenerate = false): Promise<CatechismParagraph> => {
  const isOfflineMode = localStorage.getItem('cathedra_offline_mode') === 'true';

  // 1) IndexedDB cache
  const cached = await getCachedCatechismParagraph(paragraph);
  if (cached && !forceGenerate) {
    logCatechismDiag({ paragraph, step: 'cache_hit' });
    return cached;
  }

  // 2) Direct table read (now allowed by RLS public read policy)
  try {
    logCatechismDiag({ paragraph, step: 'official_query' });
    const { data: officialData, error: officialError } = await supabase
      .from('catechism_official')
      .select('*')
      .eq('paragraph', paragraph)
      .maybeSingle();

    if (officialError) {
      const classified = classifyCatechismError(officialError);
      logCatechismDiag({
        paragraph,
        step: classified.code === 'unauthorized' ? 'unauthorized'
          : classified.code === 'forbidden' ? 'forbidden'
          : 'official_error',
        status: classified.status,
        message: officialError.message,
        meta: { hint: (officialError as any)?.hint, details: (officialError as any)?.details },
      });
    } else if (officialData) {
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
      logCatechismDiag({ paragraph, step: 'official_hit', meta: { source: 'catechism_official' } });
      cacheCatechismParagraph(paragraph, result);
      return result;
    }
  } catch (e: any) {
    const classified = classifyCatechismError(e);
    logCatechismDiag({
      paragraph,
      step: 'official_error',
      status: classified.status,
      message: e?.message,
    });
  }

  // 3) Local static data
  const localData = (CATECHISM_LOCAL_DATA as any)[paragraph];
  if (localData && !forceGenerate) {
    const result: CatechismParagraph = {
      paragraph: localData.paragraph,
      content: localData.conteudo,
      language: 'pt',
      status: 'static',
      textoBase: localData.textoBase,
    };
    logCatechismDiag({ paragraph, step: 'local_hit' });
    cacheCatechismParagraph(paragraph, result);
    return result;
  }

  // 4) Offline mode hard stop
  if (isOfflineMode && !forceGenerate) {
    if (cached) return cached;
    const err = new CatechismFetchError(paragraph, 'network', 'Modo Somente-Cache ativo: Texto não disponível offline.');
    logCatechismDiag({ paragraph, step: 'final_error', message: err.message });
    throw err;
  }

  // 5) Edge function (service-role backed)
  try {
    logCatechismDiag({ paragraph, step: 'edge_invoke' });
    const { data, error } = await supabase.functions.invoke('catechism-text', { body: { paragraph, action: 'fetch' } });

    if (error) {
      const classified = classifyCatechismError(error);
      logCatechismDiag({
        paragraph,
        step: classified.code === 'unauthorized' ? 'unauthorized'
          : classified.code === 'forbidden' ? 'forbidden'
          : 'edge_error',
        status: classified.status,
        message: error.message,
      });
      if (cached) return cached;
      throw new CatechismFetchError(paragraph, classified.code, classified.message, classified.status);
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (!parsed || parsed.status === 'not_found' || parsed.status === 'not_cached') {
      logCatechismDiag({ paragraph, step: 'edge_not_found', status: parsed?.status });
      throw new CatechismFetchError(paragraph, 'not_found', `Parágrafo §${paragraph} não disponível no banco oficial.`, 404);
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

    logCatechismDiag({ paragraph, step: 'edge_hit', meta: { source: parsed.status } });
    cacheCatechismParagraph(paragraph, result);
    return result;
  } catch (error: any) {
    if (error instanceof CatechismFetchError) throw error;
    window.dispatchEvent(new CustomEvent('supabase-unreachable'));
    if (cached) {
      logCatechismDiag({ paragraph, step: 'fallback_cached', message: error?.message });
      return cached;
    }
    const classified = classifyCatechismError(error);
    logCatechismDiag({ paragraph, step: 'final_error', status: classified.status, message: error?.message });
    throw new CatechismFetchError(paragraph, classified.code, classified.message, classified.status);
  }
};

export const useCatechismParagraph = (paragraph: number, enabled = true) => {
  return useQuery({
    queryKey: ['catechism-paragraph', paragraph],
    queryFn: () => fetchCatechismParagraph(paragraph),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: (failureCount, err: any) => {
      // No reintenta erros semânticos (not_found / 401 / 403)
      if (err instanceof CatechismFetchError && ['not_found', 'unauthorized', 'forbidden'].includes(err.code)) {
        return false;
      }
      return failureCount < 1;
    },
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
