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
    
    // Look for the saint's name which usually starts with S. or São
    const nameMatch = html.match(/<h2>(S\.|São|Santa|S\.\s|Santos|Santas)(.*?)<\/h2>/i);
    let name = nameMatch ? nameMatch[0].replace(/<[^>]*>/g, '').trim() : "Santo do Dia";
    
    // If name is too short or still "Menu", try to find any h2 that isn't menu
    if (name.toLowerCase().includes("menu") || name.length < 5) {
       const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
       for (const h2 of h2s) {
         const clean = h2.replace(/<[^>]*>/g, '').trim();
         if (clean.length > 5 && !clean.toLowerCase().includes("menu") && !clean.toLowerCase().includes("newsletter")) {
           name = clean;
           break;
         }
       }
    }

    // Extract image near the name
    let imageUrl = null;
    const allImgs = html.match(/<img[^>]*src="([^"]*)"[^>]*>/gi) || [];
    for (const img of allImgs) {
      if (img.includes("/santi/") || img.includes("/santo/")) {
        const srcMatch = img.match(/src="([^"]*)"/i);
        if (srcMatch) {
          const src = srcMatch[1];
          imageUrl = src.startsWith('http') ? src : `https://www.vaticannews.va${src}`;
          break;
        }
      }
    }
    
    // Extract description
    const pMatch = html.match(/<section class="section section--evidence section--isStatic">[\s\S]*?<p>([\s\S]*?)<\/p>/i) ||
                  html.match(/<div class="teaser">[\s\S]*?<p>([\s\S]*?)<\/p>/i);
    const description = pMatch ? pMatch[1].replace(/<[^>]*>/g, '').trim() : "";
    
    // Read more
    const linkMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*saintReadMore[^"]*"/i);
    let moreLink = vaticanUrl;
    if (linkMatch) {
      const href = linkMatch[1];
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
