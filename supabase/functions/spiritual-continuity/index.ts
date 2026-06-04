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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // 1. Fetch user history and reflections
    const { data: history } = await supabaseAdmin
      .from("user_history")
      .select("title, type, visited_at")
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false })
      .limit(15);

    const { data: reflections } = await supabaseAdmin
      .from("reading_reflections")
      .select("content, reading_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: progress } = await supabaseAdmin
      .from("itineraria_progress")
      .select("reflection, itinerarium_id, step_id")
      .eq("user_id", user.id)
      .limit(5);

    const historyText = history?.map(h => `- ${h.title} (${h.type})`).join('\n') || 'Nenhuma leitura recente.';
    const reflectionsText = reflections?.map(r => `- [${r.reading_type}]: ${r.content}`).join('\n') || 'Nenhuma reflexão recente.';
    const progressText = progress?.map(p => `- Progresso: ${p.reflection}`).join('\n') || '';

    const systemPrompt = `Você é o Logos IA, o guia contemplativo do Cathedra Digital. 
    Analise o histórico e as reflexões do usuário para:
    1. Identificar 3-5 temas espirituais recorrentes (ex: Misericórdia, Silêncio, Paternidade, Oração).
    2. Sugerir a continuidade da caminhada espiritual (itinerários ou jornadas).
    3. Recomendar leituras de forma acolhedora.

    Responda EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
    {
      "spiritual_themes": ["Tema 1", "Tema 2", ...],
      "recommendations": [
        { "title": "Título", "description": "Por que sugerido", "route": "/rota", "type": "journey|itinerarium|reading" }
      ],
      "insight": "Uma breve frase contemplativa sobre a caminhada atual."
    }`;

    const userMessage = `Histórico de leituras:\n${historyText}\n\nReflexões recentes:\n${reflectionsText}\n\nProgresso em itinerários:\n${progressText}`;

    let result = { spiritual_themes: [], recommendations: [], insight: "" };

    if (GOOGLE_API_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GOOGLE_API_KEY}`
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.4,
            response_mime_type: "application/json"
          }
        })
      })

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) result = JSON.parse(text);
      }
    }

    // Update profile with new themes
    if (result.spiritual_themes.length > 0) {
      await supabaseAdmin
        .from("profiles")
        .update({ spiritual_themes: result.spiritual_themes })
        .eq("id", user.id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("spiritual-continuity error:", error);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})