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
    
    // Robust extraction using string manipulation for Vatican News
    // Find the saint section
    const sectionStart = html.indexOf('section--isStatic');
    const content = sectionStart !== -1 ? html.substring(sectionStart) : html;
    
    // Extract Name
    const h2Start = content.indexOf('<h2');
    const h2End = content.indexOf('</h2>', h2Start);
    let name = "Santo do Dia";
    if (h2Start !== -1 && h2End !== -1) {
      name = content.substring(content.indexOf('>', h2Start) + 1, h2End).replace(/<[^>]*>/g, '').trim();
    }
    
    // Extract Image
    let imageUrl = null;
    const imgTagStart = content.indexOf('<img', h2End);
    if (imgTagStart !== -1) {
      const imgTagEnd = content.indexOf('>', imgTagStart);
      const imgTag = content.substring(imgTagStart, imgTagEnd);
      
      const srcMatch = imgTag.match(/data-original="([^"]*)"/) || imgTag.match(/src="([^"]*)"/);
      if (srcMatch && !srcMatch[1].includes('data:image')) {
        const src = srcMatch[1];
        imageUrl = src.startsWith('http') ? src : `https://www.vaticannews.va${src}`;
      }
    }
    
    // Extract Description
    let description = "";
    const pStart = content.indexOf('<p', h2End);
    if (pStart !== -1) {
      const pEnd = content.indexOf('</p>', pStart);
      description = content.substring(content.indexOf('>', pStart) + 1, pEnd).replace(/<[^>]*>/g, '').trim();
    }
    
    // Extract Read More Link
    let moreLink = vaticanUrl;
    const linkStart = content.indexOf('saintReadMore', h2End);
    if (linkStart !== -1) {
      const hrefStart = content.lastIndexOf('href="', linkStart) + 6;
      const hrefEnd = content.indexOf('"', hrefStart);
      const href = content.substring(hrefStart, hrefEnd);
      moreLink = href.startsWith('http') ? href : `https://www.vaticannews.va${href}`;
    }

    return new Response(
      JSON.stringify({
        name,
        image: imageUrl,
        description,
        url: moreLink,
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
