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

    let saintName = "Santo do Dia";
    let imageUrl = null;
    let description = "";
    let detailLink = "";

    // Log HTML first 500 chars in the response temporarily for debugging
    const htmlPreview = html.substring(0, 500);

    const h2Parts = html.split(/<h2[^>]*>/i);
    for (let i = 1; i < h2Parts.length; i++) {
      const part = h2Parts[i];
      const text = part.split('</h2>')[0].replace(/<[^>]*>/g, '').trim();
      
      if (text && text.length > 5 && !['Menu', 'Newsletter', 'Redes Sociais', 'Siga-nos', 'Destaque'].some(word => text.includes(word))) {
        saintName = text;
        const nextContent = part + (h2Parts[i+1] || "");
        
        if (nextContent.includes('data-original="')) {
          imageUrl = nextContent.split('data-original="')[1].split('"')[0];
        } else if (nextContent.includes('src="')) {
          const srcMatches = nextContent.match(/src="([^"]+)"/g);
          if (srcMatches) {
            for (const match of srcMatches) {
              const src = match.split('"')[1];
              if (src.includes('/santi/') || (src.includes('/content/') && !src.includes('banner') && !src.includes('logo'))) {
                imageUrl = src;
                break;
              }
            }
          }
        }

        if (part.includes('<p>')) {
          description = part.split('<p>')[1].split('</p>')[0].replace(/<[^>]*>/g, '').trim();
        }

        if (part.includes('href="')) {
          const links = part.split('href="');
          for (let j = 1; j < links.length; j++) {
            const link = links[j].split('"')[0];
            if (link.includes('/santo-do-dia/santos/') && !link.includes('html')) {
              detailLink = `https://www.vaticannews.va${link}`;
              break;
            }
          }
        }
        break;
      }
    }

    if (!imageUrl) {
      const allImages = html.match(/data-original="([^"]+)"/g) || html.match(/src="([^"]+)"/g) || [];
      for (const imgAttr of allImages) {
        const url = imgAttr.split('"')[1];
        if (url.includes('/santi/')) {
          imageUrl = url;
          break;
        }
      }
    }

    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.includes('data:image')) {
      imageUrl = `https://www.vaticannews.va${imageUrl}`;
    }

    return new Response(
      JSON.stringify({
        name: saintName,
        image: imageUrl,
        description: description,
        url: detailLink || vaticanUrl,
        source: "Vatican News",
        debug: { htmlLength: html.length, preview: htmlPreview }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});