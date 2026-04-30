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
  // Feature strictly disabled for transparency and offline integrity
  return { 
    error: "O uso de IA foi desativado nesta plataforma para garantir a integridade doutrinária e o funcionamento offline.",
    content: "O Logos IA não está mais disponível. Todo o conteúdo da Cathedra agora é gerado e revisado manualmente."
  };
};


export const getSpiritualInsight = async (query?: string, tag?: string, profileId?: string | null): Promise<AIResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Não autenticado" };

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/logos-spiritual-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ query, tag, profileId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro na conexão' }));
      let reason: AIFallbackReason = 'network';
      if (response.status === 402 && err.credits_exhausted) {
        notifyAIStatus('credits_exhausted', err.error);
        toast.error('Créditos de IA esgotados.', { duration: 8000 });
        reason = 'credits_exhausted';
      } else if (response.status === 402) {
        toast.error("Este recurso é exclusivo para assinantes PRO.");
        reason = 'daily_limit';
      } else if (response.status === 429) {
        notifyAIStatus('rate_limited', err.error);
        toast.error(err.error || 'Limite de requisições atingido.');
        reason = 'rate_limited';
      } else {
        toast.error(err.error || "Erro ao gerar insight.");
      }
      return { error: err.error, fallback_reason: reason };
    }

    const data = await response.json();
    return { content: data.insight };
  } catch (error: any) {
    console.error("Spiritual Insight Error:", error);
    return { error: error.message };
  }
};
