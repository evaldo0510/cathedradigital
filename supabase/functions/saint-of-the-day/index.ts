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
    const response = await fetch(vaticanUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Vatican News: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple parsing for Saint of the Day
    // We look for the first <h2> inside the main content or similar
    // Note: In a production environment, a more robust parser like deno-dom would be better
    // but here we can use regex for simplicity if the structure is consistent.
    
    const titleMatch = html.match(/<h2[^>]*>(.*?)<\/h2>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Santo do Dia";
    
    // Look for the first image in the article section
    const imgMatch = html.match(/<section class="section">[\s\S]*?<img[^>]*src="([^"]*)"/i) || 
                   html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*img-responsive[^"]*"/i) ||
                   html.match(/<img[^>]*src="([^"]*)"/i);
    let imageUrl = imgMatch ? imgMatch[1] : null;
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://www.vaticannews.va${imageUrl}`;
    }

    // Look for description (usually the first <p> after the <h2> or title)
    // Actually, Vatican News has a specific structure
    const descMatch = html.match(/<div class="teaser">[\s\S]*?<p>(.*?)<\/p>/) || 
                     html.match(/<div class="text">[\s\S]*?<p>(.*?)<\/p>/);
    const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "";

    const linkMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*link-read-more[^"]*"/i);
    let moreLink = linkMatch ? linkMatch[1] : vaticanUrl;
    if (moreLink && !moreLink.startsWith('http')) {
      moreLink = `https://www.vaticannews.va${moreLink}`;
    }

    return new Response(
      JSON.stringify({
        name: title,
        image: imageUrl,
        description: description,
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
