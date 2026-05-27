import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const rawBody = await req.json().catch(() => ({}));

    const sanitizeText = (val: unknown, maxLen: number): string => {
      if (typeof val !== 'string') return '';
      return val
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLen);
    };

    const ALLOWED_TYPES = new Set(['bible', 'catechism', 'magisterium', 'general', 'lectio', 'study']);
    const rawType = typeof rawBody.type === 'string' ? rawBody.type.toLowerCase().trim() : 'general';
    const type = ALLOWED_TYPES.has(rawType) ? rawType : 'general';

    const query = sanitizeText(rawBody.query, 2000);
    const context = sanitizeText(rawBody.context, 2000);
    const selectedText = sanitizeText(rawBody.selectedText, 2000);

    // History: only keep recent valid user/assistant turns with sanitized content
    const ALLOWED_ROLES = new Set(['user', 'assistant']);
    const history = Array.isArray(rawBody.history)
      ? rawBody.history
          .slice(-20)
          .filter((m: any) => m && ALLOWED_ROLES.has(m.role) && typeof m.content === 'string')
          .map((m: any) => ({ role: m.role, content: sanitizeText(m.content, 2000) }))
      : [];

    if (!query) {
      return new Response(JSON.stringify({ error: "Pergunta vazia." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    if (!LOVABLE_API_KEY) {
      throw new Error('Missing LOVABLE_API_KEY')
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user and premium status
    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, token.includes("eyJ") ? Deno.env.get("SUPABASE_ANON_KEY")! : supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    if (!profile?.is_premium) {
      return new Response(JSON.stringify({ error: "Recurso exclusivo para assinantes PRO." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é o Logos IA, uma inteligência integrada ao Cathedra Digital, um mosteiro digital moderno. Sua missão é ajudar o usuário na contemplação da Bíblia, do Catecismo e do Magistério.
    
    Contexto atual: ${type}
    ${context ? `Trecho de referência: ${context}` : ''}
    ${selectedText ? `Texto selecionado pelo usuário: "${selectedText}"` : ''}

    DIRETRIZES:
    1. Fidelidade Total: Seja 100% fiel à Tradição, Escritura e Magistério da Igreja Católica.
    2. Tom: Use um tom sereno, sábio, encorajador e profundamente contemplativo. Evite respostas superficiais.
    3. Formatação: Use markdown para estruturar a resposta se for longa.
    4. Limitação: Se o usuário perguntar algo fora da fé católica ou de cunho polêmico não relacionado, redirecione suavemente para a beleza da verdade católica.
    
    Aja como um guia que ajuda a "mastigar" a Palavra e a Doutrina para uma vida de oração.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: query }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite',
        messages,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Erro no processamento da IA' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("logos-ai error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})