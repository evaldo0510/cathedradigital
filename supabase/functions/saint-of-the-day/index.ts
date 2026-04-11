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
    
    // String split approach is often more reliable than regex for complex HTML
    let sectionHtml = "";
    if (html.includes('section--isStatic')) {
      sectionHtml = html.split('section--isStatic')[1].split('</section>')[0];
    } else if (html.includes('section--evidence')) {
      sectionHtml = html.split('section--evidence')[1].split('</section>')[0];
    } else {
      sectionHtml = html;
    }

    let name = "Santo do Dia";
    if (sectionHtml.includes('<h2')) {
      const parts = sectionHtml.split('<h2');
      for (const p of parts) {
        const text = p.split('</h2>')[0].split('>')[1]?.replace(/<[^>]*>/g, '').trim();
        if (text && text.length > 5 && !text.includes('Menu') && !text.includes('Newsletter')) {
          name = text;
          break;
        }
      }
    }

    let imageUrl = null;
    if (sectionHtml.includes('data-original="')) {
      imageUrl = sectionHtml.split('data-original="')[1].split('"')[0];
    } else if (sectionHtml.includes('src="')) {
      imageUrl = sectionHtml.split('src="')[1].split('"')[0];
    }
    
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.includes('data:image')) {
      imageUrl = `https://www.vaticannews.va${imageUrl}`;
    }

    let description = "";
    if (sectionHtml.includes('<p>')) {
      description = sectionHtml.split('<p>')[1].split('</p>')[0].replace(/<[^>]*>/g, '').trim();
    }

    return new Response(
      JSON.stringify({
        name,
        image: imageUrl,
        description,
        url: vaticanUrl,
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
