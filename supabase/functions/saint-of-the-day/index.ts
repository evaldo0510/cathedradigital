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

    // Target the specific section for Saint of the Day
    const saintSection = doc.querySelector(".section--isStatic") || doc.querySelector(".section--evidence");
    
    if (!saintSection) {
        throw new Error("Saint section not found");
    }

    const titleElement = saintSection.querySelector("h2");
    const name = titleElement ? titleElement.textContent.trim() : "Santo do Dia";
    
    let imageUrl = null;
    const imgElement = saintSection.querySelector("img");
    if (imgElement) {
      // Vatican News uses data-original for lazy loading
      const src = imgElement.getAttribute("data-original") || imgElement.getAttribute("src");
      if (src && !src.includes("data:image/gif")) {
        imageUrl = src.startsWith("http") ? src : `https://www.vaticannews.va${src}`;
      }
    }

    const descElement = saintSection.querySelector("p");
    const description = descElement ? descElement.textContent.trim() : "";

    const linkElement = saintSection.querySelector("a.saintReadMore") || saintSection.querySelector("a[href*='/santo-do-dia/']");
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
