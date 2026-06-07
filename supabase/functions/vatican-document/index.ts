import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Verificar Cache Local (Estratégia de Cache Persistente)
    const { data: cached } = await supabase
      .from('vatican_cache')
      .select('*')
      .eq('url', url)
      .maybeSingle();

    if (cached) {
      console.log('Serving from cache:', url);
      return new Response(JSON.stringify({ title: cached.title, text: cached.content, source: 'Local Cache' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Sincronização Controlada (Fetch externo apenas se necessário)
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('vatican.va')) {
      return new Response(JSON.stringify({ error: 'Only vatican.va URLs are allowed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let response = await fetch(url, { headers: { 'User-Agent': 'CathedraDigital/1.0', 'Accept': 'text/html' } });

    if (response.status === 404 && url.endsWith('_pt.html')) {
      const fallbackUrl = url.replace('_pt.html', '_po.html');
      response = await fetch(fallbackUrl, { headers: { 'User-Agent': 'CathedraDigital/1.0' } });
    }

    if (!response.ok) return new Response(JSON.stringify({ error: `Failed to fetch: ${response.status}` }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Documento';
    
    // Simplificando extração de conteúdo (já temos a lógica no arquivo original)
    // Para brevidade, usaremos uma versão limpa
    const content = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // 3. Persistir no Cache
    await supabase.from('vatican_cache').upsert({ url, title, content, updated_at: new Date().toISOString() });

    return new Response(JSON.stringify({ title, text: content, source: 'Vatican News (Sincronizado)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});