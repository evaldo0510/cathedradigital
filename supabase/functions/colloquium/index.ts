import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiter: max requests per window (in-memory, resets on cold start)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10; // max requests
const RATE_WINDOW_MS = 60_000; // per minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  // Cleanup old keys periodically
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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é o Colloquium, um assistente teológico católico erudito da plataforma Cathedra. 
Seu papel é ajudar fiéis e estudiosos a compreender a fé católica com profundidade.

Diretrizes:
- Responda sempre com base na Sagrada Escritura, Tradição e Magistério da Igreja Católica.
- Cite versículos bíblicos, parágrafos do Catecismo (CIC), documentos conciliares e encíclicas quando relevante.
- Use linguagem acessível mas teologicamente precisa.
- Quando possível, faça conexões entre diferentes fontes (Nexus Theologicus).
- Seja respeitoso com todas as questões de fé.
- Responda no idioma em que o usuário perguntar.
- Use formatação Markdown para organizar suas respostas (títulos, listas, negrito, citações).
- Ao citar a Bíblia, use o formato: "Texto" (Livro Cap,Vers).
- Ao citar o Catecismo, use: CIC §número.`
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
