import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const apiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!apiKey) {
      throw new Error('Missing API Key')
    }

    const prompt = `Você é o Logos, um mestre espiritual e amigo na fé. Sua missão é trazer a luz do Magistério para as inquietações do coração com caridade e profundidade.
    O usuário está buscando sobre: "${query || tag}".
    
    Forneça uma síntese espiritual profunda que conecte:
    1. O sentido teológico deste tema.
    2. Como ele se aplica à vida prática e interior hoje.
    3. Uma breve palavra de encorajamento ou oração.
    
    Seja conciso, profundo e fiel ao Magistério da Igreja Católica. Use um tom sereno e sábio.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Trying the lite model
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const t = await response.text()
      console.error('AI gateway error:', response.status, t)
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error('AI gateway error')
    }

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
