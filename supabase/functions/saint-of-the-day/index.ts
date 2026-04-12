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
    
    // Extract section containing the saint
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

    // Try to get a longer description or full story
    let description = "";
    let fullHistory = "";
    let writings = [];

    // Basic description
    if (sectionHtml.includes('<p>')) {
      description = sectionHtml.split('<p>')[1].split('</p>')[0].replace(/<[^>]*>/g, '').trim();
    }

    // Try to find the full story link
    let detailLink = "";
    if (sectionHtml.includes('href="')) {
      const links = sectionHtml.split('href="');
      for (let i = 1; i < links.length; i++) {
        const link = links[i].split('"')[0];
        if (link.includes('/santo-do-dia/santos/') && !link.includes('html')) {
          detailLink = `https://www.vaticannews.va${link}`;
          break;
        }
      }
    }

    // If we have a detail link, try to fetch more data
    if (detailLink) {
      try {
        const detailRes = await fetch(detailLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          
          // Extract history (often in a specific div)
          if (detailHtml.includes('section--content')) {
            const content = detailHtml.split('section--content')[1].split('</section>')[0];
            fullHistory = content.replace(/<p>/g, '\n\n').replace(/<[^>]*>/g, '').trim();
            
            // Try to find writings/quotes
            if (detailHtml.includes('citazione')) {
              const quote = detailHtml.split('citazione')[1].split('</span>')[0].replace(/<[^>]*>/g, '').trim();
              if (quote) writings.push(quote);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching detail link:', err);
      }
    }

    return new Response(
      JSON.stringify({
        name,
        image: imageUrl,
        description: description || fullHistory.substring(0, 200) + "...",
        fullBio: fullHistory,
        writings: writings,
        url: detailLink || vaticanUrl,
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
