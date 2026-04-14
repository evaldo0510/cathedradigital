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
    const now = new Date();
    // Offset for Brazil/Portugal if needed, but Vatican is GMT+1/2
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Try current date URL
    const vaticanUrl = `https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
    console.log("Fetching:", vaticanUrl);

    const response = await fetch(vaticanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`Status ${response.status} for ${vaticanUrl}`);
    const html = await response.text();

    let saintName = "Santo do Dia";
    let imageUrl = null;
    let description = "";

    // The title in <h1> is usually "Santo do Dia"
    // The actual saint names are in <h2>
    const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
    const possibleSaints = [];

    for (const h2 of h2s) {
      const cleanH2 = h2.replace(/<[^>]*>/g, '').trim();
      if (cleanH2.length > 3 && !['Menu', 'Busca', 'Newsletter', 'Redes', 'Siga-nos', 'Destaque'].some(w => cleanH2.includes(w))) {
        // Find image after this H2
        const posH2 = html.indexOf(h2);
        const afterH2 = html.substring(posH2, posH2 + 2000);
        
        const imgMatch = afterH2.match(/data-original="([^"]+)"/) || afterH2.match(/src="([^"]+)"/);
        let img = null;
        if (imgMatch) {
          img = imgMatch[1];
          if (!img.startsWith('http')) img = `https://www.vaticannews.va${img}`;
        }
        
        const pMatch = afterH2.match(/<p>(.*?)<\/p>/is);
        let desc = "";
        if (pMatch) desc = pMatch[1].replace(/<[^>]*>/g, '').trim();
        
        possibleSaints.push({ name: cleanH2, image: img, description: desc });
      }
    }

    // Pick first saint with image, or just the first one
    const bestSaint = possibleSaints.find(s => s.image) || possibleSaints[0];

    if (!bestSaint) {
       // Fallback to searching the whole page if specific date URL failed to yield saints
       return new Response(JSON.stringify({ 
         name: "Santo do Dia", 
         source: "Vatican News",
         debug: { h2Count: h2s.length, h2s: h2s.slice(0, 5) }
       }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({
        name: bestSaint.name,
        image: bestSaint.image,
        description: bestSaint.description,
        url: vaticanUrl,
        source: "Vatican News"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});