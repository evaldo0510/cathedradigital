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

    const saints = [];
    const h2Start = '<h2';
    const h2End = '</h2>';
    let pos = 0;

    while ((pos = html.indexOf(h2Start, pos)) !== -1) {
      const tagEnd = html.indexOf('>', pos);
      if (tagEnd === -1) break;
      const endPos = html.indexOf(h2End, tagEnd);
      if (endPos === -1) break;

      const name = html.substring(tagEnd + 1, endPos).replace(/<[^>]*>/g, '').trim();
      
      // Look for content until next H2 or end of section
      const nextH2 = html.indexOf(h2Start, endPos + h2End.length);
      const nextSection = html.indexOf('</section>', endPos + h2End.length);
      const limit = (nextH2 !== -1 && nextSection !== -1) ? Math.min(nextH2, nextSection) : (nextH2 !== -1 ? nextH2 : nextSection);
      const content = limit !== -1 ? html.substring(endPos + h2End.length, limit) : html.substring(endPos + h2End.length);

      let image = null;
      if (content.includes('data-original="')) {
        image = content.split('data-original="')[1].split('"')[0];
      } else if (content.includes('src="')) {
        const srcMatches = content.match(/src="([^"]+)"/g);
        if (srcMatches) {
          for (const m of srcMatches) {
            const url = m.split('"')[1];
            if (url.includes('/santi/')) { image = url; break; }
          }
        }
      }

      let desc = "";
      if (content.includes('<p>')) {
        desc = content.split('<p>')[1].split('</p>')[0].replace(/<[^>]*>/g, '').trim();
      }

      let detailLink = "";
      if (content.includes('href="')) {
         const links = content.split('href="');
         for (let i = 1; i < links.length; i++) {
            const l = links[i].split('"')[0];
            if (l.includes('/santo-do-dia/santos/')) { detailLink = l; break; }
         }
      }

      if (name.length > 5 && !['Menu', 'Busca', 'Newsletter', 'Redes', 'Siga-nos'].some(w => name.includes(w))) {
        saints.push({ name, image, desc, detailLink });
      }
      
      pos = endPos + h2End.length;
    }

    // Try to find any saint that HAS an image
    let bestSaint = saints.find(s => s.image) || saints[0];

    if (!bestSaint) {
      return new Response(JSON.stringify({ name: "Santo do Dia", source: "Vatican News" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = {
      name: bestSaint.name,
      image: bestSaint.image ? (bestSaint.image.startsWith('http') ? bestSaint.image : `https://www.vaticannews.va${bestSaint.image}`) : null,
      description: bestSaint.desc,
      url: bestSaint.detailLink ? `https://www.vaticannews.va${bestSaint.detailLink}` : vaticanUrl,
      source: "Vatican News"
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});