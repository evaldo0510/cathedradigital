const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Edge function that fetches document text from Vatican.va
 * Accepts { url: string } in the body and returns { text: string, title: string }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      // Decode entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&laquo;/g, '«')
      .replace(/&raquo;/g, '»')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
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
