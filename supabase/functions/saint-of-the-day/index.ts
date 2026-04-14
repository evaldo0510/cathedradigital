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
    
    if (!response.ok) throw new Error(`Status ${response.status}`);

    const html = await response.text();
    const allH2s = [];
    const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gis);
    if (h2Matches) {
      for (const m of h2Matches) {
        allH2s.push(m.replace(/<[^>]*>/g, '').trim());
      }
    }

    let saintName = "Santo do Dia";
    let imageUrl = null;
    let description = "";
    let detailLink = "";

    // Find the first saint name
    for (const h2 of allH2s) {
      if (h2.length > 5 && !['Menu', 'Newsletter', 'Redes Sociais', 'Siga-nos', 'Destaque'].some(word => h2.includes(word))) {
        saintName = h2;
        break;
      }
    }

    // Try to find image
    const imageMatches = html.match(/data-original="([^"]+\.(jpg|jpeg|png|webp))"/g) || html.match(/src="([^"]+\.(jpg|jpeg|png|webp))"/g) || [];
    for (const imgAttr of imageMatches) {
      const url = imgAttr.split('"')[1];
      if (url.includes('/santi/') || (url.includes('/content/') && !url.includes('banner') && !url.includes('logo'))) {
        imageUrl = url.startsWith('http') ? url : `https://www.vaticannews.va${url}`;
        break;
      }
    }

    // If still no image, look for ANY image that is NOT a banner
    if (!imageUrl) {
      for (const imgAttr of imageMatches) {
        const url = imgAttr.split('"')[1];
        if (!url.includes('banner') && !url.includes('logo') && !url.includes('icon') && !url.includes('radio')) {
           imageUrl = url.startsWith('http') ? url : `https://www.vaticannews.va${url}`;
           break;
        }
      }
    }

    // Find description
    if (saintName !== "Santo do Dia") {
       const parts = html.split(saintName);
       if (parts.length > 1) {
         const afterName = parts[1];
         const pMatch = afterName.match(/<p>(.*?)<\/p>/is);
         if (pMatch) description = pMatch[1].replace(/<[^>]*>/g, '').trim();
       }
    }

    return new Response(
      JSON.stringify({
        name: saintName,
        image: imageUrl,
        description: description,
        url: vaticanUrl,
        source: "Vatican News",
        debug: { h2s: allH2s.slice(0, 10) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});