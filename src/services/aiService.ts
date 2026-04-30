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
  return { error: "Serviço de IA desativado." };
};

