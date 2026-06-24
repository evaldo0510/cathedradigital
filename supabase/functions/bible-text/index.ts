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

/**
 * Fallback de cache: retorna o snapshot mais recente do capítulo
 * IGNORANDO versão e expiração. Usado apenas quando todas as fontes
 * vivas falham, para evitar invalidação agressiva e manter 100% PT
 * sem travar a interface.
 */
async function getCacheL2Stale(key: string) {
  try {
    const { data } = await supabase
      .from('bible_cache_l2')
      .select('content')
      .eq('cache_key', key)
      .order('updated_at', { ascending: false })
      .limit(1)
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

// Mapa abrev → ID bolls.life (NAA) vem do cânon compartilhado.
import { BOLLS_MAP, bookNameFromAbbr } from "../_shared/bibleCanon.ts";


async function fetchFromBollsLife(abbrev: string, chapter: number) {
    const bookId = BOLLS_MAP[abbrev];
    if (!bookId) {
        console.warn(`[bible-text] BOLLS_MAP miss for abbrev="${abbrev}"`);
        return null;
    }
    try {
        const res = await fetch(`https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`);
        if (!res.ok) {
            console.warn(`[bible-text] BollsLife ${res.status} for ${abbrev} ${chapter}`);
            return null;
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        return data.map((v: any) => ({
          number: v.verse,
          text: String(v.text || '').replace(/<[^>]+>/g, '').trim(),
          comment: v.comment
            ? String(v.comment)
                // rewrite bolls relative refs to absolute https links opened in new tab
                .replace(/<a\s+href=(['"])\/([^'"]+)\1/gi, "<a href=\"https://bolls.life/$2\" target=\"_blank\" rel=\"noopener\"")
            : null,
        }));
    } catch (e) {
        console.error(`[bible-text] BollsLife fetch error ${abbrev} ${chapter}:`, e);
        return null;
    }
}

serve(async (req) => {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const t0 = Date.now();
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let abbrev: string | undefined;
  let chapter: number | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    abbrev = body?.abbrev;
    chapter = Number(body?.chapter);
    const client_cache_version = body?.client_cache_version;

    // Validação defensiva: protege contra payloads malformados (não joga 500).
    if (!abbrev || typeof abbrev !== 'string' || !Number.isFinite(chapter) || chapter <= 0) {
      console.warn('[bible-text] invalid payload', { correlationId, abbrev, chapter });
      return new Response(JSON.stringify({
        error: 'Parâmetros inválidos: informe { abbrev: string, chapter: number > 0 }',
        correlationId,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
    }

    console.info('[bible-text] start', { correlationId, abbrev, chapter });

    const cacheConfig = await getCacheConfig();
    const cacheKey = `${abbrev}:${chapter}`;
    const shouldInvalidateL1 = client_cache_version !== cacheConfig.version;

    const cached = await getCacheL2(cacheKey, cacheConfig.version);
    if (cached) {
      console.info('[bible-text] L2 hit', { correlationId, cacheKey, ms: Date.now() - t0 });
      return new Response(JSON.stringify({
        ...cached,
        metadata: { ...cached.metadata, source: 'L2 Cache', correlationId, shouldInvalidateL1, current_version: cacheConfig.version }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
    }

    const isSovereigntyEnabled = await getFeatureFlag('bible_sovereignty_enabled');
    let result = await fetchFromCathedraDb(abbrev, chapter);
    let source = 'Cathedra (Local)';

    if (!isSovereigntyEnabled || !result) {
      const fallback = await fetchFromBollsLife(abbrev, chapter);
      if (fallback) {
        result = { verses: fallback, bookName: bookNameFromAbbr(abbrev) };
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
      console.info('[bible-text] ok', { correlationId, source, verses: result.verses.length, ms: Date.now() - t0 });
      return new Response(JSON.stringify({ ...responseData, metadata: { ...responseData.metadata, shouldInvalidateL1 } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
      });
    }

    const stale = await getCacheL2Stale(cacheKey);
    if (stale) {
      console.warn('[bible-text] stale fallback', { correlationId, cacheKey, ms: Date.now() - t0 });
      return new Response(JSON.stringify({
        ...stale,
        metadata: { ...(stale.metadata || {}), source: 'L2 Stale (Fallback)', correlationId, shouldInvalidateL1: false, stale: true }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
    }

    console.error('[bible-text] not found', { correlationId, abbrev, chapter, ms: Date.now() - t0 });
    return new Response(JSON.stringify({ error: 'Texto não encontrado', correlationId }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
    });


  } catch (error: any) {
    console.error('[bible-text] unexpected error', { correlationId, abbrev, chapter, error: String(error?.message || error) });
    // Última linha de defesa: tentar stale em qualquer erro inesperado
    try {
      if (abbrev && chapter) {
        const stale = await getCacheL2Stale(`${abbrev}:${chapter}`);
        if (stale) {
          return new Response(JSON.stringify({
            ...stale,
            metadata: { ...(stale.metadata || {}), source: 'L2 Stale (Error Recovery)', correlationId, shouldInvalidateL1: false, stale: true }
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
        }
      }
    } catch {}
    return new Response(JSON.stringify({ error: 'Erro interno', correlationId }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
    });
  }
});