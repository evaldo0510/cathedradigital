import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const vaticanUrl = "https://www.vaticannews.va/pt/santo-do-dia.html";
    const response = await fetch(vaticanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Vatican News: ${response.status}`);
    }

    const html = await response.text();
    
    // Even smaller chunk
    const startIdx = Math.max(0, html.indexOf('section--evidence') - 200);
    const endIdx = Math.min(html.length, html.indexOf('social-utility', startIdx) + 500);
    const relevantHtml = html.substring(startIdx, endIdx);

    // Use AI to extract the data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um extrator de dados. Extraia o nome do santo, resumo e URL da imagem (resolva caminhos relativos para https://www.vaticannews.va). Retorne APENAS um JSON válido."
          },
          {
            role: "user",
            content: `HTML: ${relevantHtml}`
          }
        ],
        temperature: 0
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error('AI Error:', err);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content.replace(/```json|```/g, '').trim();
    const result = JSON.parse(content);

    return new Response(
      JSON.stringify({
        ...result,
        source: "Vatican News",
        url: vaticanUrl,
        fetched_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in saint-of-the-day:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
