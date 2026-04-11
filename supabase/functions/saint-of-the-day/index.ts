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

    // Attempt to find the saint's name
    // It's usually the first H2 in the main content area
    const h2s = Array.from(doc.querySelectorAll("h2"));
    let saintTitle = null;
    for (const h2 of h2s) {
      const text = h2.textContent.trim();
      // Heuristic: skip short titles or common menu items
      if (text.length > 5 && !['Menu', 'Siga-nos', 'Newsletter'].includes(text)) {
        saintTitle = h2;
        break;
      }
    }

    const name = saintTitle ? saintTitle.textContent.trim() : "Santo do Dia";
    
    // Find image
    // Look for image with 'santi' in the path or inside the same parent as the title
    let imageUrl = null;
    const allImgs = Array.from(doc.querySelectorAll("img"));
    for (const img of allImgs) {
      const src = img.getAttribute("data-original") || img.getAttribute("src");
      if (src && (src.includes("/santi/") || src.includes("/santo/"))) {
        imageUrl = src.startsWith("http") ? src : `https://www.vaticannews.va${src}`;
        break;
      }
    }

    // Find description
    // It's usually a <p> near the title
    let description = "";
    if (saintTitle) {
      // Look for next sibling or p in parent
      const parent = saintTitle.closest(".section") || saintTitle.parentElement;
      const p = parent?.querySelector("p:not([style*='justify'])");
      if (p) description = p.textContent.trim();
    }

    // More Link
    const readMore = doc.querySelector("a.saintReadMore") || doc.querySelector("a[href*='/santo-do-dia/']");
    let moreLink = vaticanUrl;
    if (readMore) {
      const href = readMore.getAttribute("href");
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
