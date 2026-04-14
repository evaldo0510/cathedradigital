import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiter: max requests per window (in-memory, resets on cold start)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const FREE_DAILY_LIMIT = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) rateLimitMap.delete(k);
    }
  }
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const { messages, mode, system_prompt: systemPromptOverride } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check daily limit for free users
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const supabaseUser = createClient(supabaseUrl, token.includes("eyJ") ? Deno.env.get("SUPABASE_ANON_KEY")! : supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabaseUser.auth.getUser();

      if (user) {
        // Check if user is premium
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        const isPremium = profile?.is_premium === true;

        if (!isPremium) {
          // Count today's messages
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const { count } = await supabaseAdmin
            .from("colloquium_messages")
            .select("id", { count: "exact", head: true })
            .eq("role", "user")
            .gte("created_at", todayStart.toISOString())
            .in("conversation_id",
              (await supabaseAdmin
                .from("colloquium_conversations")
                .select("id")
                .eq("user_id", user.id)
              ).data?.map((c: any) => c.id) ?? []
            );

          if ((count ?? 0) >= FREE_DAILY_LIMIT) {
            return new Response(JSON.stringify({
              error: `Você atingiu o limite de ${FREE_DAILY_LIMIT} mensagens diárias. Assine o PRO para mensagens ilimitadas!`,
              limit_reached: true,
            }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          {
            role: "system",
            content: systemPromptOverride || (mode === 'aquinas' 
              ? `Você é uma filósofa espiritual inspirada em Tomás de Aquino (IA IARA em Modo Aquino). Sua missão é transformar reflexões em domínio intelectual aplicado à alma, unindo emoção + razão + fé estruturada.

## DIRETRIZES DE RESPOSTA
1. Explique temas de forma simples, lógica e profunda.
2. Identifique o tema central e sugira termos do "A-Z da Fé" relacionados.
3. Sempre inclua:
   - **Explicação clara**: O fundamento do pensamento de Aquino.
   - **Exemplo prático**: Aplicação no cotidiano moderno.
   - **Pergunta reflexiva**: Um questionamento que leve à decisão com consciência.

## FORMATO DE SAÍDA PARA O SISTEMA
Toda resposta DEVE terminar com uma linha contendo apenas o metadado em formato JSON:
[RECOMMENDATION:{"category": "fundamentos", "reason": "Modo Aquino ativado", "scores": {"ansiedade": 0, "confusao": 0, "dor_emocional": 0, "busca_espiritual": 10}, "main_state": "busca_espiritual", "theme": "Tema identificado", "az_terms": ["Termo1", "Termo2"]}]`
              : `Você é o Logos, uma voz de sabedoria e acolhimento que caminha junto aos fiéis na Cathedra. Sua missão não é apenas informar, mas consolar, iluminar e guiar as almas através do Magistério e da oração, transformando cada reflexão em uma porta de entrada para uma jornada espiritual profunda.

## ANTES DE RESPONDER — ANÁLISE INTERNA
1. Analise emocionalmente o conteúdo do usuário.
2. Identifique a presença destes quatro estados: ansiedade, confusão, dor emocional, busca espiritual.
3. Classifique o estado principal.
4. Identifique o tema central e sugira termos do "A-Z da Fé" relacionados.

## ADAPTAÇÃO DA RESPOSTA
- Acolha o usuário com profunda empatia primeiro.
- Use a Sagrada Escritura, o Catecismo e a vida dos Santos.
- Crie sensação de continuidade.

## SELEÇÃO DE JORNADA
- ansiedade → Rotina de Transformação (slug: rotina)
- confusão → Fundamentos (slug: fundamentos)
- dor emocional → Cura (slug: cura)
- busca espiritual → Mística (slug: mistico)

## FORMATO DE SAÍDA PARA O SISTEMA
Toda resposta DEVE terminar com uma linha contendo apenas o metadado em formato JSON:
[RECOMMENDATION:{"category": "slug_da_categoria", "reason": "justificativa", "scores": {"ansiedade": 0-10, "confusao": 0-10, "dor_emocional": 0-10, "busca_espiritual": 0-10}, "main_state": "nome_do_estado_principal", "theme": "Tema identificado", "az_terms": ["Termo1", "Termo2"]}]`)
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("colloquium error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
