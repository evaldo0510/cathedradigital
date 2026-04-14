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
    
    // Extract all saint sections
    // They are usually within <section class="section ... section--isStatic">
    const sections = [];
    const sectionStart = '<section';
    const sectionEnd = '</section>';
    let pos = 0;
    
    while ((pos = html.indexOf(sectionStart, pos)) !== -1) {
      const endPos = html.indexOf(sectionEnd, pos);
      if (endPos === -1) break;
      const sectionHtml = html.substring(pos, endPos + sectionEnd.length);
      if (sectionHtml.includes('section--isStatic') || sectionHtml.includes('section--evidence')) {
        sections.push(sectionHtml);
      }
      pos = endPos + sectionEnd.length;
    }

    let saintData = {
      name: "Santo do Dia",
      image: null,
      description: "",
      url: vaticanUrl
    };

    for (const section of sections) {
      // Skip sections that are just intro
      if (section.includes('intro--saint')) continue;

      let name = "";
      if (section.includes('<h2>')) {
        name = section.split('<h2>')[1].split('</h2>')[0].replace(/<[^>]*>/g, '').trim();
      } else if (section.includes('<h2')) {
        name = section.split('<h2')[1].split('>')[1].split('</h2>')[0].replace(/<[^>]*>/g, '').trim();
      }

      // Skip if name is too short or common nav words
      if (!name || name.length < 3 || name === "Menu" || name === "Santo do Dia") continue;

      let image = null;
      if (section.includes('data-original="')) {
        image = section.split('data-original="')[1].split('"')[0];
      } else if (section.includes('src="')) {
        const src = section.split('src="')[1].split('"')[0];
        if (!src.startsWith('data:') && !src.includes('clear.gif') && !src.includes('banner')) {
          image = src;
        }
      }

      let desc = "";
      if (section.includes('<p>')) {
        desc = section.split('<p>')[1].split('</p>')[0].replace(/<[^>]*>/g, '').trim();
      }

      let detailLink = "";
      if (section.includes('href="')) {
        const links = section.split('href="');
        for (let i = 1; i < links.length; i++) {
          const link = links[i].split('"')[0];
          if (link.includes('/santo-do-dia/santos/') && !link.includes('html')) {
            detailLink = `https://www.vaticannews.va${link}`;
            break;
          }
        }
      }

      // If we already have a saint name and this section has an image, maybe it's the same saint or a better one
      if (!saintData.image && image) {
        saintData.image = image;
      }

      if (saintData.name === "Santo do Dia" && name) {
        saintData.name = name;
        saintData.description = desc;
        if (detailLink) saintData.url = detailLink;
      }
      
      // If we found both name and image, we can stop or keep looking for the "main" one
      // Usually the first section is the main one.
      if (saintData.name !== "Santo do Dia" && saintData.image) break;
    }

    // Fix image URL if it's relative
    if (saintData.image && !saintData.image.startsWith('http') && !saintData.image.includes('data:image')) {
      saintData.image = `https://www.vaticannews.va${saintData.image}`;
    }

    let fullHistory = "";
    let writings = [];

    // If we have a detail link, try to fetch more data
    if (saintData.url && saintData.url.includes('/santos/')) {
      try {
        const detailRes = await fetch(saintData.url, {
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

            // If still no image, try to find one in the detail page
            if (!saintData.image) {
              if (detailHtml.includes('data-original="')) {
                saintData.image = detailHtml.split('data-original="')[1].split('"')[0];
              } else if (detailHtml.includes('src="')) {
                const src = detailHtml.split('src="')[1].split('"')[0];
                if (!src.startsWith('data:') && !src.includes('clear.gif') && !src.includes('banner')) {
                  saintData.image = src;
                }
              }
              if (saintData.image && !saintData.image.startsWith('http')) {
                saintData.image = `https://www.vaticannews.va${saintData.image}`;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching detail link:', err);
      }
    }

    return new Response(
      JSON.stringify({
        name: saintData.name,
        image: saintData.image,
        description: saintData.description || (fullHistory ? fullHistory.substring(0, 200) + "..." : ""),
        fullBio: fullHistory,
        writings: writings,
        url: saintData.url,
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
