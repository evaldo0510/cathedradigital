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

// Mapa completo das abreviações em PT → IDs do bolls.life (NAA, ordem católica/protestante padrão)
const BOLLS_MAP: Record<string, number> = {
  // Antigo Testamento
  'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nm': 4, 'Dt': 5,
  'Js': 6, 'Jz': 7, 'Rt': 8,
  '1Sm': 9, '2Sm': 10, '1Rs': 11, '2Rs': 12,
  '1Cr': 13, '2Cr': 14, 'Ed': 15, 'Ne': 16, 'Et': 17,
  'Jó': 18, 'Job': 18, 'Sl': 19, 'Pv': 20, 'Ec': 21, 'Ct': 22,
  'Is': 23, 'Jr': 24, 'Lm': 25, 'Ez': 26, 'Dn': 27,
  'Os': 28, 'Jl': 29, 'Am': 30, 'Ab': 31, 'Abd': 31, 'Jn': 32, 'Jon': 32, 'Mq': 33, 'Mi': 33,
  'Na': 34, 'Nm2': 34, 'Hc': 35, 'Hab': 35, 'Hb2': 35, 'Sf': 36, 'Sof': 36, 'Ag': 37, 'Ageu': 37,
  'Zc': 38, 'Zac': 38, 'Ml': 39, 'Mal': 39,
  // Novo Testamento
  'Mt': 40, 'Mc': 41, 'Lc': 42, 'Jo': 43, 'At': 44,
  'Rm': 45, '1Co': 46, '2Co': 47, 'Gl': 48, 'Ef': 49,
  'Fp': 50, 'Cl': 51, '1Ts': 52, '2Ts': 53,
  '1Tm': 54, '2Tm': 55, 'Tt': 56, 'Fm': 57,
  'Hb': 58, 'Tg': 59, '1Pe': 60, '2Pe': 61,
  '1Jo': 62, '2Jo': 63, '3Jo': 64, 'Jd': 65, 'Ap': 66,
};

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

    // Stale fallback: serve último snapshot conhecido em vez de invalidar
    const stale = await getCacheL2Stale(cacheKey);
    if (stale) {
      return new Response(JSON.stringify({
        ...stale,
        metadata: { ...(stale.metadata || {}), source: 'L2 Stale (Fallback)', correlationId, shouldInvalidateL1: false, stale: true }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
    }

    return new Response(JSON.stringify({ error: 'Texto não encontrado', correlationId }), { status: 404, headers: corsHeaders });

  } catch (error: any) {
    // Última linha de defesa: tentar stale em qualquer erro inesperado
    try {
      const body = await req.clone().json().catch(() => ({}));
      const key = body?.abbrev && body?.chapter ? `${body.abbrev}:${body.chapter}` : null;
      if (key) {
        const stale = await getCacheL2Stale(key);
        if (stale) {
          return new Response(JSON.stringify({
            ...stale,
            metadata: { ...(stale.metadata || {}), source: 'L2 Stale (Error Recovery)', correlationId, shouldInvalidateL1: false, stale: true }
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
        }
      }
    } catch {}
    return new Response(JSON.stringify({ error: 'Erro interno', correlationId }), { status: 500, headers: corsHeaders });
  }
});