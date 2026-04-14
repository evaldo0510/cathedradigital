import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchFromA12(day: string, month: string) {
  const url = `https://www.a12.com/reze-no-santuario/santo-do-dia?day=${day}&month=${month}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    if (!response.ok) return null;
    const html = await response.text();
    
    let name = "";
    let image = null;
    let description = "";

    // Name - try multiple patterns
    const nameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is) || 
                     html.match(/<h2[^>]*class="feature__name"[^>]*>(.*?)<\/h2>/is) ||
                     html.match(/class="feature__name"[^>]*>(.*?)<\//is);
    
    if (nameMatch) name = nameMatch[1].replace(/<[^>]*>/g, '').trim();

    // Image
    const portraitMatch = html.match(/class="feature__portrait"[^>]*src="([^"]+)"/i) || 
                         html.match(/src="([^"]+)"[^>]*class="feature__portrait"/i) ||
                         html.match(/<img[^>]*src="([^"]+)"[^>]*class="feature__portrait"/i);
    if (portraitMatch) {
      image = portraitMatch[1];
    } else {
      const allImgs = html.match(/src="([^"]+\.jpg)"/gi) || [];
      for (const m of allImgs) {
        const src = m.split('"')[1];
        if (src.includes('/originals/') && !src.includes('Topo')) {
          image = src;
          break;
        }
      }
    }

    // Description
    const wgTextMatch = html.match(/<div class="wg-text">(.*?)<\/div>/is);
    if (wgTextMatch) {
      const pMatches = wgTextMatch[1].match(/<p>(.*?)<\/p>/is);
      if (pMatches) description = pMatches[1].replace(/<[^>]*>/g, '').trim();
    }

    if (name && image) {
      return {
        name,
        image: image.startsWith('http') ? image : `https://www.a12.com${image}`,
        description: description,
        url,
        source: "Portal A12"
      };
    }
  } catch (e) { console.error(e); }
  return null;
}

async function fetchFromVatican(day: string, month: string) {
  const url = `https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    const html = await response.text();

    const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
    for (const h2 of h2s) {
      const name = h2.replace(/<[^>]*>/g, '').trim();
      if (name.length > 5 && !['Menu', 'Busca', 'Newsletter'].some(w => name.includes(w))) {
        const posH2 = html.indexOf(h2);
        const afterH2 = html.substring(posH2, posH2 + 2500);
        
        const imgMatch = afterH2.match(/data-original="([^"]+)"/) || afterH2.match(/src="([^"]+)"/);
        let image = null;
        if (imgMatch && !imgMatch[1].includes('banner')) {
          image = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://www.vaticannews.va${imgMatch[1]}`;
        }

        const pMatch = afterH2.match(/<p>(.*?)<\/p>/is);
        let description = "";
        if (pMatch) description = pMatch[1].replace(/<[^>]*>/g, '').trim();

        return { name, image, description, url, source: "Vatican News" };
      }
    }
  } catch (e) { console.error(e); }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const now = new Date();
    // Use Brazil/Portugal offset
    const offsetTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const day = String(offsetTime.getUTCDate()).padStart(2, '0');
    const month = String(offsetTime.getUTCMonth() + 1).padStart(2, '0');
    
    let result = await fetchFromA12(day, month);
    if (!result || !result.image) {
      const vResult = await fetchFromVatican(day, month);
      if (vResult) result = vResult;
    }
    
    if (!result) {
      return new Response(JSON.stringify({ name: "Santo do Dia", source: "None Found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});