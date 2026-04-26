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
    const { query, tag, profileId } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    if (!LOVABLE_API_KEY) {
      throw new Error('Missing LOVABLE_API_KEY')
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado. Token ausente." }), {
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

    const profileContext = profileId ? ` Considere que o usuário tem o perfil espiritual: ${profileId}.` : '';
    const prompt = `Você é o Logos, um mestre espiritual e amigo na fé. Sua missão é trazer a luz do Magistério para as inquietações do coração com caridade e profundidade.${profileContext}
    O usuário está buscando sobre: "${query || tag}".
    
    Forneça uma síntese espiritual profunda que conecte:
    1. O sentido teológico deste tema.
    2. Como ele se aplica à vida prática e interior hoje.
    3. Uma breve palavra de encorajamento ou oração.
    
    Rigor católico: Suas respostas devem ser 100% fiéis ao Magistério da Igreja Católica, Sagrada Escritura e Tradição. Se o tema for contrário à fé católica (ex: ocultismo, relativismo moral extremo), responda com firmeza e caridade sobre a verdade católica, sem comprometer a doutrina.
    
    Seja conciso, profundo e fiel ao Magistério da Igreja Católica. Use um tom sereno e sábio.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const t = await response.text()
      console.error('AI gateway error:', response.status, t)
      return new Response(JSON.stringify({ error: 'Erro no gateway de IA' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const insight = data.choices[0].message.content

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("logos-spiritual-insight error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
