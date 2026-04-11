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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Vatican News: ${response.status}`);
    }

    const html = await response.text();
    
    // Find the main section for the saint
    // Usually <section class="section section--evidence section--isStatic">
    const sectionMatch = html.match(/<section[^>]*class="[^"]*section--isStatic[^"]*"[\s\S]*?<\/section>/i) ||
                        html.match(/<section[^>]*class="[^"]*section--evidence[^"]*"[\s\S]*?<\/section>/i);
    
    const sectionHtml = sectionMatch ? sectionMatch[0] : html;

    // Extract Name from H2
    const nameMatch = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    let name = nameMatch ? nameMatch[1].replace(/<[^>]*>/g, '').trim() : "Santo do Dia";
    
    // Extract Image
    let imageUrl = null;
    const imgMatch = sectionHtml.match(/<img[^>]*data-original="([^"]*)"/i) || 
                   sectionHtml.match(/<img[^>]*src="([^"]*)"/i);
    
    if (imgMatch) {
      const src = imgMatch[1];
      if (src && !src.includes('data:image')) {
        imageUrl = src.startsWith('http') ? src : `https://www.vaticannews.va${src}`;
      }
    }
    
    // Extract Description
    const pMatch = sectionHtml.match(/<p>([\s\S]*?)<\/p>/i);
    const description = pMatch ? pMatch[1].replace(/<[^>]*>/g, '').trim() : "";
    
    // Extract Read More Link
    const linkMatch = sectionHtml.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*saintReadMore[^"]*"/i) ||
                     sectionHtml.match(/<a[^>]*href="([^"]*)"[^>]*title="[^"]*Leia tudo[^"]*"/i);
    let moreLink = vaticanUrl;
    if (linkMatch) {
      const href = linkMatch[1];
      moreLink = href.startsWith('http') ? href : `https://www.vaticannews.va${href}`;
    }

    // Clean up name if it contains whitespace or newlines
    name = name.split('\n')[0].trim();

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
