import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";

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
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    // Vatican News structure for Saint of the Day
    // The main content is usually inside .section or .article
    const mainSection = doc.querySelector("main") || doc.querySelector(".section") || doc.querySelector(".article");
    if (!mainSection) {
        throw new Error("Main content section not found");
    }

    // Find the first <h2> which is the Saint's name
    // Exclude header menus if they use <h2>
    const titleElement = mainSection.querySelector("h2");
    const name = titleElement ? titleElement.textContent.trim() : "Santo do Dia";
    
    // Find the image
    // Typically inside a <figure> or an <img> with class responsive-img
    let imageUrl = null;
    const imgElement = mainSection.querySelector("img.img-responsive") || 
                      mainSection.querySelector("figure img") ||
                      mainSection.querySelector("img");
    
    if (imgElement) {
      const src = imgElement.getAttribute("src");
      if (src) {
        imageUrl = src.startsWith("http") ? src : `https://www.vaticannews.va${src}`;
      }
    }

    // Find the description
    // Often in a .teaser or the first <p>
    const teaserElement = mainSection.querySelector(".teaser") || mainSection.querySelector(".text p") || mainSection.querySelector("p");
    const description = teaserElement ? teaserElement.textContent.trim() : "";

    // Find the more link
    const linkElement = mainSection.querySelector("a.link-read-more") || mainSection.querySelector("a[href*='/santo-do-dia/']");
    let moreLink = vaticanUrl;
    if (linkElement) {
      const href = linkElement.getAttribute("href");
      if (href) {
        moreLink = href.startsWith("http") ? href : `https://www.vaticannews.va${href}`;
      }
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
