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
    
    // Look for sections with class section--isStatic which contain individual saints
    const sections = html.split('<section class="section section--evidence section--isStatic">').slice(1);
    
    let name = "Santo do Dia";
    let imageUrl = null;
    let description = "";
    let detailLink = "";

    if (sections.length > 0) {
      // Pick the first saint section
      const firstSection = sections[0].split('</section>')[0];
      
      // Extract Name
      if (firstSection.includes('<h2>')) {
        name = firstSection.split('<h2>')[1].split('</h2>')[0].replace(/<[^>]*>/g, '').trim();
      } else if (firstSection.includes('<h2')) {
        name = firstSection.split('<h2')[1].split('>')[1].split('</h2>')[0].replace(/<[^>]*>/g, '').trim();
      }

      // Extract Image - Look for data-original first (lazy loading)
      if (firstSection.includes('data-original="')) {
        imageUrl = firstSection.split('data-original="')[1].split('"')[0];
      } else if (firstSection.includes('src="')) {
        const src = firstSection.split('src="')[1].split('"')[0];
        // Ignore data-uris or very small images
        if (!src.startsWith('data:') && !src.includes('clear.gif')) {
          imageUrl = src;
        }
      }

      // Extract Description
      if (firstSection.includes('<p>')) {
        description = firstSection.split('<p>')[1].split('</p>')[0].replace(/<[^>]*>/g, '').trim();
      }

      // Extract Detail Link
      if (firstSection.includes('href="')) {
        const links = firstSection.split('href="');
        for (let i = 1; i < links.length; i++) {
          const link = links[i].split('"')[0];
          if (link.includes('/santo-do-dia/santos/') && !link.includes('html')) {
            detailLink = `https://www.vaticannews.va${link}`;
            break;
          }
        }
      }

      // If no image in first section, try second section
      if (!imageUrl && sections.length > 1) {
        const secondSection = sections[1].split('</section>')[0];
        if (secondSection.includes('data-original="')) {
          imageUrl = secondSection.split('data-original="')[1].split('"')[0];
        } else if (secondSection.includes('src="')) {
          const src = secondSection.split('src="')[1].split('"')[0];
          if (!src.startsWith('data:') && !src.includes('clear.gif')) {
            imageUrl = src;
          }
        }
      }
    } else {
      // Fallback for different structure
      if (html.includes('<h2')) {
        name = html.split('<h2')[1].split('>')[1].split('</h2>')[0].replace(/<[^>]*>/g, '').trim();
      }
      if (html.includes('data-original="')) {
        imageUrl = html.split('data-original="')[1].split('"')[0];
      }
    }
    
    // Fix image URL if it's relative
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.includes('data:image')) {
      imageUrl = `https://www.vaticannews.va${imageUrl}`;
    }

    // Default image if still null (from the Vatican News banner maybe?)
    if (!imageUrl && html.includes('banner santi.jpg')) {
      // No, let's not use a banner. Maybe use a fallback.
    }

    let fullHistory = "";
    let writings = [];

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
          
          if (detailHtml.includes('section--content')) {
            const content = detailHtml.split('section--content')[1].split('</section>')[0];
            fullHistory = content.replace(/<p>/g, '\n\n').replace(/<[^>]*>/g, '').trim();
            
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
        description: description || (fullHistory ? fullHistory.substring(0, 200) + "..." : ""),
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