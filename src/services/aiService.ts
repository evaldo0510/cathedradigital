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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Você precisa estar logado para usar o Logos.");
      return { error: "Não autenticado" };
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colloquium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages, mode, stream: !!onStream }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro na conexão' }));
      
      if (response.status === 402 || err.credits_exhausted) {
        notifyAIStatus('credits_exhausted', err.error);
        toast.error('Créditos de IA esgotados. O administrador precisa recarregar o workspace.', { duration: 8000 });
        return { error: err.error, limit_reached: true, fallback_reason: 'credits_exhausted' };
      }

      if (response.status === 429 && err.limit_reached) {
        toast.error('Limite diário atingido! Assine o PRO para mensagens ilimitadas.');
        return { error: err.error, limit_reached: true, fallback_reason: 'daily_limit' };
      }

      if (response.status === 429) {
        notifyAIStatus('rate_limited', err.error);
        toast.error(err.error || 'Limite de requisições atingido. Aguarde um momento.');
        return { error: err.error, fallback_reason: 'rate_limited' };
      }
      
      if (response.status === 401) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return { error: "Sessão expirada", fallback_reason: 'auth' };
      }

      const errorMessage = err.error || `Erro ${response.status}`;
      toast.error(errorMessage);
      return { error: errorMessage, fallback_reason: 'network' };
    }

    if (onStream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                onStream(assistantContent);
              }
            } catch { /* partial */ }
          }
        }
      }
      return { content: assistantContent };
    } else {
      const data = await response.json();
      return { content: data.choices?.[0]?.message?.content || data.insight };
    }
  } catch (error: any) {
    console.error("AI Service Error:", error);
    const msg = error.message || "Erro ao consultar a IA.";
    toast.error(msg);
    return { error: msg, fallback_reason: 'network' };
  }
};

export const getSpiritualInsight = async (query?: string, tag?: string): Promise<AIResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Não autenticado" };

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/logos-spiritual-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ query, tag }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro na conexão' }));
      if (response.status === 402 && err.credits_exhausted) {
        notifyAIStatus('credits_exhausted', err.error);
        toast.error('Créditos de IA esgotados.', { duration: 8000 });
      } else if (response.status === 402) {
        toast.error("Este recurso é exclusivo para assinantes PRO.");
      } else if (response.status === 429) {
        notifyAIStatus('rate_limited', err.error);
        toast.error(err.error || 'Limite de requisições atingido.');
      } else {
        toast.error(err.error || "Erro ao gerar insight.");
      }
      return { error: err.error };
    }

    const data = await response.json();
    return { content: data.insight };
  } catch (error: any) {
    console.error("Spiritual Insight Error:", error);
    return { error: error.message };
  }
};
