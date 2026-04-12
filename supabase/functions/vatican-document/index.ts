const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Edge function that fetches document text from Vatican.va
 * Accepts { url: string } in the body and returns { text: string, title: string }
 */
// Rate limiter: 15 requests per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) { rateLimitMap.set(key, timestamps); return true; }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) { for (const [k, v] of rateLimitMap) { if (v.every(t => now - t >= RATE_WINDOW_MS)) rateLimitMap.delete(k); } }
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (isRateLimited(getClientIP(req))) {
    return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate it's a vatican.va URL
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('vatican.va')) {
      return new Response(
        JSON.stringify({ error: 'Only vatican.va URLs are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Vatican document:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CathedraDigital/1.0 (Catholic study platform)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch document: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Documento';

    // Vatican.va document content is inside <div class="text parbase vaticanrichtext"> elements
    // The document area is wrapped in <div class="documento">
    let content = '';

    // Strategy 1: Extract all "text parbase vaticanrichtext" divs (main content blocks)
    const textBlocks: string[] = [];
    const vaticanRichTextRegex = /<div\s+class="text parbase vaticanrichtext">([\s\S]*?)(?=<div\s+class="(?:text parbase vaticanrichtext|abstract|clearfix|documento)"|<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/gi;
    let match;
    while ((match = vaticanRichTextRegex.exec(html)) !== null) {
      if (match[1].trim().length > 50) { // Skip empty/tiny blocks
        textBlocks.push(match[1]);
      }
    }

    if (textBlocks.length > 0) {
      content = textBlocks.join('\n');
    }

    // Strategy 2: Fallback - extract from <div class="documento">
    if (!content) {
      const docMatch = html.match(/<div\s+class="documento">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/i);
      if (docMatch) {
        content = docMatch[1];
      }
    }

    // Strategy 3: Broader fallback for older pages (Vatican archives)
    if (!content) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        content = mainMatch[1];
      }
    }

    // Strategy 4: Last resort - body content
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) content = bodyMatch[1];
    }

    // Clean HTML to readable text
    content = content
      // Remove scripts, styles, navigation
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      // Remove archive table navigation (usually at the top)
      .replace(/<table[^>]*>[\s\S]*?logo-vatican\.png[\s\S]*?<\/table>/gi, '')
      .replace(/<table[^>]*>[\s\S]*?top\.png[\s\S]*?<\/table>/gi, '')
      // Remove translation links div
      .replace(/<div\s+class="translation-field">[\s\S]*?<\/div>\s*<\/div>/gi, '')
      .replace(/<div\s+class="abstract[^"]*">[\s\S]*?<\/div>/gi, '')
      // Remove images
      .replace(/<img[^>]*>/gi, '')
      // Convert headings
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
      .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n#### $1\n\n')
      // Paragraphs and breaks
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      // Bold and italic
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '$1')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1')
      .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1')
      // Links - keep text, remove tag
      .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      // Remove remaining tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&laquo;/g, '«')
      .replace(/&raquo;/g, '»')
      .replace(/&ldquo;/g, '\u201C')
      .replace(/&rdquo;/g, '\u201D')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&ndash;/g, '\u2013')
      .replace(/&mdash;/g, '\u2014')
      .replace(/&hellip;/g, '\u2026')
      // Accented characters (common in Portuguese)
      .replace(/&Aacute;/g, 'Á').replace(/&aacute;/g, 'á')
      .replace(/&Eacute;/g, 'É').replace(/&eacute;/g, 'é')
      .replace(/&Iacute;/g, 'Í').replace(/&iacute;/g, 'í')
      .replace(/&Oacute;/g, 'Ó').replace(/&oacute;/g, 'ó')
      .replace(/&Uacute;/g, 'Ú').replace(/&uacute;/g, 'ú')
      .replace(/&Agrave;/g, 'À').replace(/&agrave;/g, 'à')
      .replace(/&Egrave;/g, 'È').replace(/&egrave;/g, 'è')
      .replace(/&Atilde;/g, 'Ã').replace(/&atilde;/g, 'ã')
      .replace(/&Otilde;/g, 'Õ').replace(/&otilde;/g, 'õ')
      .replace(/&Acirc;/g, 'Â').replace(/&acirc;/g, 'â')
      .replace(/&Ecirc;/g, 'Ê').replace(/&ecirc;/g, 'ê')
      .replace(/&Ocirc;/g, 'Ô').replace(/&ocirc;/g, 'ô')
      .replace(/&Uuml;/g, 'Ü').replace(/&uuml;/g, 'ü')
      .replace(/&Ccedil;/g, 'Ç').replace(/&ccedil;/g, 'ç')
      .replace(/&Ntilde;/g, 'Ñ').replace(/&ntilde;/g, 'ñ')
      .replace(/&ordm;/g, 'º').replace(/&ordf;/g, 'ª')
      .replace(/&sect;/g, '§').replace(/&deg;/g, '°')
      .replace(/&copy;/g, '©').replace(/&reg;/g, '®')
      // Catch any remaining named entities by removing the entity syntax
      .replace(/&([a-zA-Z]+);/g, (match, name) => {
        // If we get here, it's an unhandled entity - try to preserve readably
        return match;
      })
      // Normalize whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.log(`Document fetched: ${title}, ${content.length} chars`);

    return new Response(
      JSON.stringify({ title, text: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Vatican document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
