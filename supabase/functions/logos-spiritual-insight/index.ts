import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, tag } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiKey) {
      throw new Error('Missing OpenAI Key')
    }

    const prompt = `Você é o Logos, uma inteligência teológica avançada focada na espiritualidade católica.
    O usuário está buscando sobre: "${query || tag}".
    
    Forneça uma síntese espiritual profunda que conecte:
    1. O sentido teológico deste tema.
    2. Como ele se aplica à vida prática e interior hoje.
    3. Uma breve palavra de encorajamento ou oração.
    
    Seja conciso, profundo e fiel ao Magistério da Igreja Católica. Use um tom sereno e sábio.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const insight = data.choices[0].message.content

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
