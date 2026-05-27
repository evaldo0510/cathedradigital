import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AIFallbackReason = 'credits_exhausted' | 'rate_limited' | 'daily_limit' | 'auth' | 'network';

export interface AIResponse {
  content?: string;
  error?: string;
  limit_reached?: boolean;
  fallback_reason?: AIFallbackReason;
}

function notifyAIStatus(type: 'credits_exhausted' | 'rate_limited', message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ai-status-error', { detail: { type, message } }));
}

export const callColloquium = async (
  messages: { role: string; content: string }[],
  mode?: string | null,
  onStream?: (content: string) => void
): Promise<AIResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('colloquium', {
      body: { messages, mode }
    });

    if (error) throw error;
    
    if (data?.content && onStream) {
      onStream(data.content);
    }

    return { content: data?.content || '' };
  } catch (err: any) {
    console.error('Colloquium error:', err);
    
    if (err.message?.includes('402') || err.message?.includes('credits')) {
      notifyAIStatus('credits_exhausted');
      return { error: 'Limite de reflexões atingido. Considere o plano Premium.', limit_reached: true };
    }
    
    if (err.message?.includes('429')) {
      notifyAIStatus('rate_limited');
      return { error: 'Muitas solicitações. Aguarde um momento.' };
    }

    return { error: 'Ocorreu um erro ao conectar com o Logos.' };
  }
};


export const getSpiritualInsight = async (query?: string, tag?: string, profileId?: string | null): Promise<AIResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('logos-spiritual-insight', {
      body: { query, tag, profileId }
    });
    if (error) throw error;
    return { content: data?.insight || '' };
  } catch (err: any) {
    return { error: 'Erro ao obter insight espiritual.' };
  }
};

