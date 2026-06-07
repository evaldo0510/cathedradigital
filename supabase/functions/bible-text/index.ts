import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, if-none-match, x-correlation-id',
  'Access-Control-Expose-Headers': 'ETag, x-correlation-id',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CACHE_BASE_VERSION = "v2.3.0"; 

async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getCacheConfig() {
  try {
    const { data } = await supabase.from('app_feature_flags').select('is_enabled, metadata').eq('feature_key', 'bible_cache_global_version').single();
    return { 
      enabled: data?.is_enabled || false, 
      version: data?.metadata?.version || 1 
    };
  } catch { return { enabled: true, version: 1 }; }
}

async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('app_feature_flags').select('is_enabled').eq('feature_key', key).single();
    return data?.is_enabled || false;
  } catch { return false; }
}

async function getCacheL2(key: string, currentVersion: number) {
  try {
    const { data } = await supabase
      .from('bible_cache_l2')
      .select('content')
      .eq('cache_key', key)
      .eq('version', currentVersion)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    return data?.content;
  } catch { return null; }
}

async function setCacheL2(key: string, content: any, hash: string, version: number) {
  try {
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 168); // 7 dias
    await supabase.from('bible_cache_l2').upsert({
      cache_key: key,
      content,
      hash,
      version,
      expires_at: expireDate.toISOString()
    });
  } catch (e) { console.error('Cache L2 Error:', e); }
}

async function fetchFromCathedraDb(abbrev: string, chapter: number) {
  try {
    const { data: book } = await supabase.from('bible_books').select('id, name').eq('abbrev', abbrev).single();
    if (!book) return null;
    const { data: ch } = await supabase.from('bible_chapters').select('id').eq('book_id', book.id).eq('number', chapter).single();
    if (!ch) return null;
    const { data: verses } = await supabase.from('bible_verses').select('number, text').eq('chapter_id', ch.id).order('number');
    if (!verses || verses.length === 0) return null;
    return { verses, bookName: book.name };
  } catch { return null; }
}

async function fetchFromBollsLife(abbrev: string, chapter: number) {
    // Mapa ID bolls (abreviado para este exemplo, no real seria completo)
    const BOLLS_MAP: Record<string, number> = { 'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nm': 4, 'Dt': 5 };
    const bookId = BOLLS_MAP[abbrev];
    if (!bookId) return null;
    try {
        const res = await fetch(`https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.map((v: any) => ({ number: v.verse, text: v.text.replace(/<[^>]+>/g, '').trim() }));
    } catch { return null; }
}

serve(async (req) => {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { abbrev, chapter, client_cache_version } = await req.json();
    const cacheConfig = await getCacheConfig();
    const cacheKey = `${abbrev}:${chapter}`;
    
    // Invalidação L1 sugerida para o cliente
    const shouldInvalidateL1 = client_cache_version !== cacheConfig.version;

    // 1. L2 Cache Lookup com check de versão
    const cached = await getCacheL2(cacheKey, cacheConfig.version);
    if (cached) {
      return new Response(JSON.stringify({ 
        ...cached, 
        metadata: { ...cached.metadata, source: 'L2 Cache', correlationId, shouldInvalidateL1, current_version: cacheConfig.version } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
      });
    }

    const isSovereigntyEnabled = await getFeatureFlag('bible_sovereignty_enabled');
    let result = await fetchFromCathedraDb(abbrev, chapter);
    let source = 'Cathedra (Local)';

    if (!isSovereigntyEnabled || !result) {
        const fallback = await fetchFromBollsLife(abbrev, chapter);
        if (fallback) {
            result = { verses: fallback, bookName: abbrev };
            source = 'BollsLife (Fallback)';
        }
    }

    if (result) {
      const fullText = result.verses.map(v => v.text).join(' ');
      const contentHash = await sha256(fullText);
      const responseData = {
        book: result.bookName, chapter, verses: result.verses,
        metadata: { source, cache_version: CACHE_BASE_VERSION, logic_version: cacheConfig.version, correlationId, contentHash }
      };

      await setCacheL2(cacheKey, responseData, contentHash, cacheConfig.version);

      return new Response(JSON.stringify({ ...responseData, metadata: { ...responseData.metadata, shouldInvalidateL1 } }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } 
      });
    }

    return new Response(JSON.stringify({ error: 'Texto não encontrado', correlationId }), { status: 404, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro interno', correlationId }), { status: 500, headers: corsHeaders });
  }
});