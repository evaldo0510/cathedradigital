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
    // Use Brazil/Portugal timezone (UTC-3 to UTC+1)
    // For now let's just use current UTC date
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const a12Url = `https://www.a12.com/reze-no-santuario/santo-do-dia?day=${day}&month=${month}`;
    const response = await fetch(a12Url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`A12 status ${response.status}`);
    const html = await response.text();

    let saintName = "Santo do Dia";
    let imageUrl = null;
    let description = "";

    // Extract Name (usually in <h1>)
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    if (h1Match) {
      saintName = h1Match[1].replace(/<[^>]*>/g, '').trim();
    }

    // Extract Image
    // A12 has a specific structure for the saint image
    const imgMatches = html.match(/<img[^>]*src="([^"]+)"[^>]*>/gis) || [];
    for (const imgTag of imgMatches) {
      const srcMatch = imgTag.match(/src="([^"]+)"/i);
      if (srcMatch) {
        const src = srcMatch[1];
        // The saint image on A12 usually has 'originals' and the date/name
        if (src.includes('/originals/') && !src.includes('Topo_-_Santo_do_Dia')) {
          imageUrl = src;
          break;
        }
      }
    }

    // Extract Description (paragraphs after h1)
    const parts = html.split(/<h1[^>]*>/i);
    if (parts.length > 1) {
      const afterH1 = parts[1];
      const pMatches = afterH1.match(/<p>(.*?)<\/p>/gis) || [];
      for (const p of pMatches) {
        const cleanP = p.replace(/<[^>]*>/g, '').trim();
        if (cleanP.length > 50 && !cleanP.includes('Ouvir:') && !cleanP.includes('Localização:')) {
          description = cleanP;
          break;
        }
      }
    }

    // Fallback to Vatican News if A12 fails to get a name
    if (saintName === "Santo do Dia" || !saintName) {
      const vaticanUrl = `https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
      const vaticanResponse = await fetch(vaticanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (vaticanResponse.ok) {
        const vHtml = await vaticanResponse.text();
        const h2s = vHtml.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
        for (const h2 of h2s) {
          const cleanH2 = h2.replace(/<[^>]*>/g, '').trim();
          if (cleanH2.length > 3 && !['Menu', 'Busca', 'Newsletter', 'Redes', 'Siga-nos', 'Destaque'].some(w => cleanH2.includes(w))) {
            saintName = cleanH2;
            const posH2 = vHtml.indexOf(h2);
            const afterH2 = vHtml.substring(posH2, posH2 + 3000);
            const imgMatches = afterH2.match(/(data-original|src)="([^"]+)"/g) || [];
            for (const match of imgMatches) {
              const url = match.split('"')[1];
              if (url.includes('banner') || url.includes('logo') || url.includes('support-comunicazione') || url.includes('data:image')) continue;
              if (url.includes('/santi/') || url.includes('/content/dam/vaticannews/')) {
                imageUrl = url.startsWith('http') ? url : `https://www.vaticannews.va${url}`;
                break;
              }
            }
            const pMatch = afterH2.match(/<p>(.*?)<\/p>/is);
            if (pMatch) description = pMatch[1].replace(/<[^>]*>/g, '').trim();
            break;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        name: saintName,
        image: imageUrl,
        description: description,
        url: a12Url,
        source: "Portal A12"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
