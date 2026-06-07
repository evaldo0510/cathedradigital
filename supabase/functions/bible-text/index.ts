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

const CACHE_VERSION = "v2.2.0"; // L1/L2 & Feature Flag Rollback

async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('app_feature_flags').select('is_enabled').eq('feature_key', key).single();
    return data?.is_enabled || false;
  } catch { return false; }
}

async function getCacheL2(key: string) {
  try {
    const { data } = await supabase.from('bible_cache_l2').select('content').eq('cache_key', key).gt('expires_at', new Date().toISOString()).maybeSingle();
    return data?.content;
  } catch { return null; }
}

async function setCacheL2(key: string, content: any, hash: string) {
  try {
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 24); // 24h
    await supabase.from('bible_cache_l2').upsert({
      cache_key: key,
      content,
      hash,
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

// Fallback BollsLife para Rollback Rápido
async function fetchFromBollsLife(abbrev: string, chapter: number) {
    const BOLLS_BOOK_ID: Record<string, number> = {
        'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nm': 4, 'Dt': 5, 'Js': 6, 'Jz': 7, 'Rt': 8, '1Sm': 9, '2Sm': 10,
        '1Rs': 11, '2Rs': 12, '1Cr': 13, '2Cr': 14, 'Esd': 15, 'Ne': 16, 'Est': 17, 'Jó': 18, 'Sl': 19,
        'Pr': 20, 'Ecl': 21, 'Ct': 22, 'Is': 23, 'Jr': 24, 'Lm': 25, 'Ez': 26, 'Dn': 27, 'Os': 28,
        'Jl': 29, 'Am': 30, 'Ab': 31, 'Jn': 32, 'Mq': 33, 'Na': 34, 'Hab': 35, 'Sf': 36, 'Ag': 37,
        'Zc': 38, 'Ml': 39, 'Mt': 40, 'Mc': 41, 'Lc': 42, 'Jo': 43, 'At': 44, 'Rm': 45, '1Cor': 46,
        '2Cor': 47, 'Gl': 48, 'Ef': 49, 'Fl': 50, 'Cl': 51, '1Ts': 52, '2Ts': 53, '1Tm': 54, '2Tm': 55,
        'Tt': 56, 'Fm': 57, 'Hb': 58, 'Tg': 59, '1Pd': 60, '2Pd': 61, '1Jo': 62, '2Jo': 63, '3Jo': 64,
        'Jd': 65, 'Ap': 66
    };
    const bookId = BOLLS_BOOK_ID[abbrev];
    if (!bookId) return null;
    try {
        const res = await fetch(`https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.map((v: any) => ({ number: v.verse, text: v.text.replace(/<[^>]+>/g, '').trim() }));
    } catch { return null; }
}

serve(async (req) => {
  const startTime = performance.now();
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { abbrev, chapter } = await req.json();
    const cacheKey = `v2:${abbrev}:${chapter}`;
    
    // 1. L2 Cache Lookup
    const cached = await getCacheL2(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, metadata: { ...cached.metadata, source: 'L2 Cache', correlationId } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
      });
    }

    // 2. Feature Flag Check (Rollback Strategy)
    const isSovereigntyEnabled = await getFeatureFlag('bible_sovereignty_enabled');
    
    // 3. Data Fetch
    let result = await fetchFromCathedraDb(abbrev, chapter);
    let source = 'Cathedra (Local)';

    // ROLLBACK TRIGGER: Se a soberania estiver desligada ou se houver falha na base local
    if (!isSovereigntyEnabled || !result) {
        const fallback = await fetchFromBollsLife(abbrev, chapter);
        if (fallback) {
            result = { verses: fallback, bookName: abbrev };
            source = 'BollsLife (Rollback Fallback)';
        }
    }

    if (result) {
      const fullText = result.verses.map(v => v.text).join(' ');
      const contentHash = await sha256(fullText);
      
      const responseData = {
        book: result.bookName, chapter, verses: result.verses,
        metadata: { source, cache_version: CACHE_VERSION, correlationId, contentHash }
      };

      // Populate L2 Cache
      await setCacheL2(cacheKey, responseData, contentHash);

      return new Response(JSON.stringify(responseData), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } 
      });
    }

    return new Response(JSON.stringify({ error: 'Texto não encontrado', correlationId }), { status: 404, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro interno', correlationId }), { status: 500, headers: corsHeaders });
  }
});