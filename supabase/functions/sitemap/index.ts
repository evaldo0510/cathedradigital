import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
};

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger('sitemap', cid);
  const baseHeaders = { ...corsHeaders, ...cidH };

  if (req.method === 'OPTIONS') return new Response(null, { headers: baseHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { 'x-correlation-id': cid } } },
    );

    const { data: tags } = await supabase
      .from('tags')
      .select('slug, updated_at');

    const baseUrl = 'https://cathedradigital.com.br';

    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
"<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
"  <url>\n" +
"    <loc>" + baseUrl + "/</loc>\n" +
"    <changefreq>daily</changefreq>\n" +
"    <priority>1.0</priority>\n" +
"  </url>\n" +
"  <url>\n" +
"    <loc>" + baseUrl + "/temas</loc>\n" +
"    <changefreq>daily</changefreq>\n" +
"    <priority>0.8</priority>\n" +
"  </url>";

    tags?.forEach((tag: any) => {
      const date = tag.updated_at
        ? new Date(tag.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      xml += "\n  <url>\n" +
"    <loc>" + baseUrl + "/temas/" + tag.slug + "</loc>\n" +
"    <lastmod>" + date + "</lastmod>\n" +
"    <changefreq>weekly</changefreq>\n" +
"    <priority>0.6</priority>\n" +
"  </url>";
    });

    xml += "\n</urlset>";

    return new Response(xml, {
      headers: { ...baseHeaders, 'Content-Type': 'application/xml' },
    });
  } catch (error: any) {
    log.error('unhandled', { err: String(error) });
    // A2.b Wave 1: envelope de erro estrito
    return new Response(
      JSON.stringify({ error: 'internal_error', details: { message: error.message }, correlation_id: cid }),
      { headers: { ...baseHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
