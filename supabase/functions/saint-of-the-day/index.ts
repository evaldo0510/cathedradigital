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
    // Use GMT+2 for Vatican/Portugal/etc
    const vaticanTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const day = String(vaticanTime.getUTCDate()).padStart(2, '0');
    const month = String(vaticanTime.getUTCMonth() + 1).padStart(2, '0');
    
    // PRIMARY SOURCE: A12 (Better images, Portuguese)
    const a12Url = `https://www.a12.com/reze-no-santuario/santo-do-dia?day=${day}&month=${month}`;
    const a12Response = await fetch(a12Url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    
    let saintName = "Santo do Dia";
    let imageUrl = null;
    let description = "";
    let source = "Portal A12";
    let finalUrl = a12Url;

    if (a12Response.ok) {
      const html = await a12Response.text();
      
      // Name
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
      if (h1Match) saintName = h1Match[1].replace(/<[^>]*>/g, '').trim();

      // Image
      const portraitMatch = html.match(/class="feature__portrait"[^>]*src="([^"]+)"/i) || 
                           html.match(/src="([^"]+)"[^>]*class="feature__portrait"/i);
      if (portraitMatch) {
        imageUrl = portraitMatch[1];
      } else {
        // Fallback image search in A12
        const imgMatches = html.match(/src="([^"]+\.jpg)"/gi) || [];
        for (const match of imgMatches) {
          const src = match.split('"')[1];
          if (src.includes('/originals/') && !src.includes('Topo')) {
            imageUrl = src;
            break;
          }
        }
      }

      // Description
      const descMatch = html.match(/<div class="wg-text">(.*?)<\/div>/is);
      if (descMatch) {
        const firstP = descMatch[1].match(/<p>(.*?)<\/p>/is);
        if (firstP) description = firstP[1].replace(/<[^>]*>/g, '').trim();
      }
    }

    // Fix relative image URL
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://www.a12.com${imageUrl}`;
    }

    // SECONDARY SOURCE: Vatican News (if A12 failed to get a good saint or image)
    if (!imageUrl || saintName === "Santo do Dia") {
       const vaticanUrl = `https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
       try {
         const vResponse = await fetch(vaticanUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
         if (vResponse.ok) {
           const vHtml = await vResponse.text();
           const vH2s = vHtml.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
           for (const h2 of vH2s) {
             const name = h2.replace(/<[^>]*>/g, '').trim();
             if (name.length > 5 && !['Menu', 'Busca', 'Newsletter'].some(w => name.includes(w))) {
               if (saintName === "Santo do Dia") {
                 saintName = name;
                 source = "Vatican News";
                 finalUrl = vaticanUrl;
                 const pMatch = vHtml.substring(vHtml.indexOf(h2)).match(/<p>(.*?)<\/p>/is);
                 if (pMatch) description = pMatch[1].replace(/<[^>]*>/g, '').trim();
               }
               // Check for image
               const afterH2 = vHtml.substring(vHtml.indexOf(h2), vHtml.indexOf(h2) + 2000);
               const vImgMatch = afterH2.match(/data-original="([^"]+)"/) || afterH2.match(/src="([^"]+)"/);
               if (vImgMatch && !vImgMatch[1].includes('banner')) {
                 const vImg = vImgMatch[1].startsWith('http') ? vImgMatch[1] : `https://www.vaticannews.va${vImgMatch[1]}`;
                 if (!imageUrl) imageUrl = vImg;
                 break;
               }
             }
           }
         }
       } catch (e) { console.error(e); }
    }

    return new Response(
      JSON.stringify({
        name: saintName,
        image: imageUrl,
        description: description,
        url: finalUrl,
        source: source
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});