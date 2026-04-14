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

    // Debug: look for a known saint name from today
    const searchName = "Hermenegildo";
    const pos = html.indexOf(searchName);
    
    if (pos === -1) {
       // Search for another one
       const pos2 = html.indexOf("Martinho");
       if (pos2 === -1) {
         return new Response(JSON.stringify({ 
           error: "Saint names not found in HTML",
           debug: { htmlLength: html.length, preview: html.substring(0, 1000) }
         }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       }
    }

    // If we reach here, we found a name.
    // Let's find the H2 around it.
    let name = "Santo do Dia";
    let imageUrl = null;
    let description = "";

    const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
    for (const h2 of h2s) {
      const cleanH2 = h2.replace(/<[^>]*>/g, '').trim();
      if (cleanH2.includes("Hermenegildo") || cleanH2.includes("Martinho")) {
        name = cleanH2;
        
        // Find image after this H2
        const posH2 = html.indexOf(h2);
        const afterH2 = html.substring(posH2, posH2 + 2000);
        
        const imgMatch = afterH2.match(/data-original="([^"]+)"/) || afterH2.match(/src="([^"]+)"/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
          if (!imageUrl.startsWith('http')) imageUrl = `https://www.vaticannews.va${imageUrl}`;
        }
        
        const pMatch = afterH2.match(/<p>(.*?)<\/p>/is);
        if (pMatch) description = pMatch[1].replace(/<[^>]*>/g, '').trim();
        
        break;
      }
    }

    return new Response(
      JSON.stringify({
        name,
        image: imageUrl,
        description: description,
        source: "Vatican News",
        debug: { h2Count: h2s.length, first5H2s: h2s.slice(0, 5) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});