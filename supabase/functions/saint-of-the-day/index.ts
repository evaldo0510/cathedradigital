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
    // Use GMT for Vatican News consistency or a slight offset to be safe
    // Vatican is GMT+2 right now (DST)
    const vaticanTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const day = String(vaticanTime.getUTCDate()).padStart(2, '0');
    const month = String(vaticanTime.getUTCMonth() + 1).padStart(2, '0');
    
    const vaticanUrl = `https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
    const response = await fetch(vaticanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const html = await response.text();

    const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
    const possibleSaints = [];

    for (const h2 of h2s) {
      const cleanH2 = h2.replace(/<[^>]*>/g, '').trim();
      if (cleanH2.length > 3 && !['Menu', 'Busca', 'Newsletter', 'Redes', 'Siga-nos', 'Destaque'].some(w => cleanH2.includes(w))) {
        const posH2 = html.indexOf(h2);
        const afterH2 = html.substring(posH2, posH2 + 3000);
        
        // Try to find image - prioritising data-original and ignoring banners
        const imgMatches = afterH2.match(/(data-original|src)="([^"]+)"/g) || [];
        let img = null;
        for (const match of imgMatches) {
          const url = match.split('"')[1];
          if (url.includes('banner') || url.includes('logo') || url.includes('support-comunicazione') || url.includes('data:image')) continue;
          if (url.includes('/santi/') || url.includes('/content/dam/vaticannews/')) {
            img = url.startsWith('http') ? url : `https://www.vaticannews.va${url}`;
            break;
          }
        }
        
        const pMatch = afterH2.match(/<p>(.*?)<\/p>/is);
        let desc = "";
        if (pMatch) desc = pMatch[1].replace(/<[^>]*>/g, '').trim();
        
        possibleSaints.push({ name: cleanH2, image: img, description: desc });
      }
    }

    const bestSaint = possibleSaints.find(s => s.image) || possibleSaints[0];

    if (!bestSaint) {
      return new Response(JSON.stringify({ name: "Santo do Dia", source: "Vatican News" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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