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
    
    // Regex based extraction
    // Find the saint's name inside the first <h2> after "intro--saint"
    const nameMatch = html.match(/section--evidence section--isStatic">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i) ||
                     html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    let name = nameMatch ? nameMatch[1].replace(/<[^>]*>/g, '').trim() : "Santo do Dia";
    
    // Image
    const imgMatch = html.match(/section--isStatic">[\s\S]*?data-original="([^"]*)"/i) ||
                    html.match(/section--isStatic">[\s\S]*?src="([^"]*)"/i);
    let imageUrl = null;
    if (imgMatch) {
      const src = imgMatch[1];
      if (src && !src.includes('data:image')) {
        imageUrl = src.startsWith('http') ? src : `https://www.vaticannews.va${src}`;
      }
    }
    
    // Description
    const pMatch = html.match(/section--isStatic">[\s\S]*?<p>([\s\S]*?)<\/p>/i);
    const description = pMatch ? pMatch[1].replace(/<[^>]*>/g, '').trim() : "";
    
    return new Response(
      JSON.stringify({
        name,
        image: imageUrl,
        description,
        url: vaticanUrl,
        source: "Vatican News"
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
