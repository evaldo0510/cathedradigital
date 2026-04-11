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
    
    // Extract a chunk of HTML that likely contains the saint info to save tokens
    const startIdx = html.indexOf('section--isStatic') !== -1 ? html.indexOf('section--isStatic') : html.indexOf('section--evidence');
    const endIdx = html.indexOf('banner-donazioni') !== -1 ? html.indexOf('banner-donazioni') : html.length;
    const relevantHtml = html.substring(Math.max(0, startIdx - 500), Math.min(html.length, endIdx + 500));

    // Use AI to extract the data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: "Você é um extrator de dados estruturados. Extraia o nome do santo, uma breve descrição e a URL da imagem principal do HTML fornecido. Retorne apenas JSON."
          },
          {
            role: "user",
            content: `Extraia o Santo do Dia deste HTML da Vatican News. 
            Retorne um JSON com os campos: "name" (nome do santo), "description" (resumo da vida), "image" (URL da imagem, resolva caminhos relativos para https://www.vaticannews.va), "url" (link 'leia tudo').
            
            HTML: ${relevantHtml}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    return new Response(
      JSON.stringify({
        ...result,
        source: "Vatican News",
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
