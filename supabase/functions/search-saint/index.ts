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
    const { name } = await req.json()
    const apiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!apiKey) {
      throw new Error('Missing API Key')
    }

    const prompt = `Você é uma enciclopédia hagiográfica católica. O usuário está buscando informações sobre o santo: "${name}".
    
    Forneça os dados em formato JSON estrito seguindo este esquema:
    {
      "id": "string-id-slug",
      "name": "Nome Completo do Santo",
      "title": "Título (ex: Doutor da Igreja, Mártir, etc)",
      "feastDay": "Dia e Mês de festa (ex: 28 de Agosto)",
      "feastMonth": 1-12,
      "feastDayNum": 1-31,
      "born": "Local e ano de nascimento",
      "died": "Local e ano de morte/martírio",
      "patronOf": ["Lista", "de", "Padroados"],
      "bio": "Biografia resumida (2-3 parágrafos)",
      "fullBio": "Biografia completa e detalhada",
      "works": [{"title": "Obra 1", "url": "opcional", "year": "ano"}],
      "quotes": ["Frase célebre 1", "Frase célebre 2"],
      "category": "uma de: apostle, martyr, doctor, virgin, confessor, pope, founder, mystic",
      "virtues": ["Virtude 1", "Virtude 2"],
      "prayer": "Oração curta ao santo",
      "textoBase": "Uma frase curta que resume seu ensinamento",
      "explicacao": "Explicação espiritual do ensinamento",
      "interpretacaoProfunda": "Interpretação teológica profunda",
      "aplicacaoPratica": "Como aplicar o exemplo do santo hoje",
      "reflexaoFinal": "Uma pergunta para reflexão",
      "exercicio": "Um exercício espiritual prático"
    }

    Se o santo não for encontrado ou não existir, retorne um objeto com "error": "not_found".
    Responda APENAS o JSON.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error('AI gateway error')
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Clean potential markdown code blocks
    const jsonStr = content.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const saintData = JSON.parse(jsonStr)

    return new Response(JSON.stringify(saintData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})