import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Check if saint already exists in the database
    const { data: existingSaint } = await supabase
      .from('saints')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(1)
      .maybeSingle()

    if (existingSaint) {
      console.log(`Found existing saint in database: ${existingSaint.name}`)
      return new Response(JSON.stringify(existingSaint), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Not found in DB, call AI
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('Missing API Key')

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

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    let aiResponse;

    if (GOOGLE_API_KEY) {
      console.log('Using direct Google Gemini API for saint search')
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`
      
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Gemini API error:', res.status, errorText)
        throw new Error(`Erro na API Gemini: ${res.status}`)
      }

      const geminiData = await res.json()
      const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
      
      aiResponse = { ok: true, json: async () => ({ choices: [{ message: { content } }] }) }
    } else {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.1,
        }),
      })
    }

    if (!aiResponse.ok) throw new Error('AI gateway error')

    const aiData = await aiResponse.json()
    const content = aiData.choices[0].message.content.trim()
    const jsonStr = content.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const saintData = JSON.parse(jsonStr)

    if (saintData.error === "not_found") {
      return new Response(JSON.stringify(saintData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Save result to database for future use
    const { error: insertError } = await supabase.from('saints').upsert({
      id: saintData.id,
      name: saintData.name,
      title: saintData.title,
      feast_day: saintData.feastDay,
      feast_month: saintData.feastMonth,
      feast_day_num: saintData.feastDayNum,
      born: saintData.born,
      died: saintData.died,
      patron_of: saintData.patronOf,
      bio: saintData.bio,
      full_bio: saintData.fullBio,
      works: saintData.works,
      quotes: saintData.quotes,
      category: saintData.category,
      virtues: saintData.virtues,
      prayer: saintData.prayer,
      bible_refs: [],
      catechism_refs: [],
      church_doc_refs: []
    })

    if (insertError) console.error('Error saving saint to DB:', insertError)

    return new Response(JSON.stringify(saintData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('search-saint error:', error)
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})