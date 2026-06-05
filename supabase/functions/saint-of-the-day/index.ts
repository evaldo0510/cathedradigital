import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchFromA12(day: string, month: string) {
  const url = `https://www.a12.com/reze-no-santuario/santo-do-dia?day=${day}&month=${month}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    if (!response.ok) return null;
    const html = await response.text();
    
    let name = "";
    let image = null;
    let description = "";

    // Name - PRIORITY: use feature__name class (the actual saint name)
    const featureNameMatch = html.match(/class="feature__name"[^>]*>(.*?)<\/h1>/is) ||
                            html.match(/class="feature__name"[^>]*>(.*?)<\/h2>/is) ||
                            html.match(/class="feature__name"[^>]*>(.*?)<\//is);
    
    if (featureNameMatch) {
      name = featureNameMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // Fallback: try marquee text which has format "Santo do Dia - Name"
    if (!name || name === "Santo do Dia") {
      const marqueeMatch = html.match(/data-title-article[^>]*>(.*?)<\/marquee>/is);
      if (marqueeMatch) {
        const marqueeText = marqueeMatch[1].replace(/<[^>]*>/g, '').trim();
        // Format is "Santo do Dia - Santa Liduína (Lidvina)"
        if (marqueeText.includes(' - ')) {
          name = marqueeText.split(' - ').slice(1).join(' - ').trim();
        } else {
          name = marqueeText;
        }
      }
    }

    // Fallback: report error title which has "Santo do Dia - Name"
    if (!name || name === "Santo do Dia") {
      const reportMatch = html.match(/wg-report-body__title[^>]*>(.*?)<\/h3>/is);
      if (reportMatch) {
        const reportText = reportMatch[1].replace(/<[^>]*>/g, '').trim();
        if (reportText.includes(' - ')) {
          name = reportText.split(' - ').slice(1).join(' - ').trim();
        }
      }
    }

    // Image - look for originals images (saint photos)
    const allImgs = html.match(/src="([^"]+\.jpg)"/gi) || [];
    for (const m of allImgs) {
      const src = m.split('"')[1];
      if (src.includes('/originals/') && !src.includes('Topo') && !src.includes('Meta_image')) {
        image = src;
        break;
      }
    }

    // Description - get first paragraph from wg-text
    const wgTextMatch = html.match(/<div class="wg-text">(.*?)<\/div>/is);
    if (wgTextMatch) {
      const pMatches = wgTextMatch[1].match(/<p[^>]*>(.*?)<\/p>/gis);
      if (pMatches) {
        for (const p of pMatches) {
          const cleanP = p.replace(/<[^>]*>/g, '').trim();
          if (cleanP.length > 50 && !cleanP.startsWith('Reflexão:') && !cleanP.startsWith('Oração:')) {
            description = cleanP.substring(0, 300);
            break;
          }
        }
      }
    }

    // Get full bio (all paragraphs before "Reflexão:")
    let fullBio = "";
    if (wgTextMatch) {
      const allP = wgTextMatch[1].match(/<p[^>]*>(.*?)<\/p>/gis) || [];
      const bioP = [];
      for (const p of allP) {
        const cleanP = p.replace(/<[^>]*>/g, '').trim();
        if (cleanP.startsWith('Reflexão:') || cleanP.startsWith('Oração:')) break;
        if (cleanP.length > 20) bioP.push(cleanP);
      }
      fullBio = bioP.join('\n\n');
    }

    if (name && name !== "Santo do Dia") {
      return {
        name,
        image: image ? (image.startsWith('http') ? image : `https://www.a12.com${image}`) : null,
        description,
        fullBio,
        url,
        source: "Portal A12"
      };
    }
  } catch (e) { console.error('A12 error:', e); }
  return null;
}

async function fetchFromVatican(day: string, month: string) {
  const url = `https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    const html = await response.text();

    const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
    for (const h2 of h2s) {
      const name = h2.replace(/<[^>]*>/g, '').trim();
      if (name.length > 5 && !['Menu', 'Busca', 'Newsletter'].some(w => name.includes(w))) {
        const posH2 = html.indexOf(h2);
        const afterH2 = html.substring(posH2, posH2 + 2500);
        
        const imgMatch = afterH2.match(/data-original="([^"]+)"/) || afterH2.match(/src="([^"]+)"/);
        let image = null;
        if (imgMatch && !imgMatch[1].includes('banner')) {
          image = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://www.vaticannews.va${imgMatch[1]}`;
        }

        const pMatch = afterH2.match(/<p>(.*?)<\/p>/is);
        let description = "";
        if (pMatch) description = pMatch[1].replace(/<[^>]*>/g, '').trim();

        return { name, image, description, url, source: "Vatican News" };
      }
    }
  } catch (e) { console.error('Vatican error:', e); }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const now = new Date();
    // Use GMT-3 (Brazil) or local time logic
    const day = now.getDate();
    const month = now.getMonth() + 1;
    
    // 1. Try to fetch from internal database first
    const { data: dbSaint, error: dbError } = await supabase
      .from('saints')
      .select('*')
      .eq('feast_month', month)
      .eq('feast_day_num', day)
      .limit(1)
      .maybeSingle();

    if (dbSaint && !dbError) {
      return new Response(JSON.stringify({
        ...dbSaint,
        description: dbSaint.bio,
        fullBio: dbSaint.full_bio,
        source: "Cathedra Database"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Fallback to external scraping
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    
    let result = await fetchFromA12(dayStr, monthStr);
    if (!result || !result.image) {
      const vResult = await fetchFromVatican(dayStr, monthStr);
      if (vResult) result = vResult;
    }
    
    if (!result) {
      return new Response(JSON.stringify({ name: "Santo do Dia", source: "None Found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('saint-of-the-day error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
