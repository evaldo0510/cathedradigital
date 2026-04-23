import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: tags } = await supabase
      .from('tags')
      .select('slug, updated_at')

    const baseUrl = 'https://cathedradigital.com.br' 

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
      const date = tag.updated_at ? new Date(tag.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += "\n  <url>\n" +
"    <loc>" + baseUrl + "/temas/" + tag.slug + "</loc>\n" +
"    <lastmod>" + date + "</lastmod>\n" +
"    <changefreq>weekly</changefreq>\n" +
"    <priority>0.6</priority>\n" +
"  </url>";
    })

    xml += "\n</urlset>";

    return new Response(xml, {
      headers: corsHeaders,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
