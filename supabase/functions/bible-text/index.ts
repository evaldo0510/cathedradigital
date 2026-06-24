import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  BibleTextInputSchema,
  BibleTextErrorSchema,
  BibleTextInvalidPayloadSchema,
} from "../_shared/bibleTextSchema.ts";

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
      version: data?.metadata?.version || 1,
    };
  } catch { return { enabled: true, version: 1 }; }
}

/** TTL (em horas) lido de app_feature_flags.bible_cache_ttl_hours.metadata.hours — default 168h (7d). */
async function getCacheTtlHours(): Promise<number> {
  try {
    const { data } = await supabase
      .from('app_feature_flags')
      .select('metadata')
      .eq('feature_key', 'bible_cache_ttl_hours')
      .maybeSingle();
    const h = Number(data?.metadata?.hours);
    return Number.isFinite(h) && h > 0 && h <= 24 * 90 ? h : 168;
  } catch { return 168; }
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

async function setCacheL2(key: string, content: any, hash: string, version: number, ttlHours: number) {
  try {
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + ttlHours);
    const { error } = await supabase.from('bible_cache_l2').upsert({
      cache_key: key,
      content,
      hash,
      version,
      expires_at: expireDate.toISOString(),
    }, { onConflict: 'cache_key' });
    if (error) console.error('Cache L2 upsert error:', error);
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
import { BOLLS_MAP, bookNameFromAbbr, findBookByAbbr } from "../_shared/bibleCanon.ts";


async function fetchFromBollsLife(abbrev: string, chapter: number, correlationId: string) {
    const book = findBookByAbbr(abbrev);
    const bookId = book?.bollsId ?? BOLLS_MAP[abbrev];
    if (!bookId) {
        console.warn('[bible-text] BOLLS_MAP miss', {
          correlationId,
          received_abbrev: abbrev,
          normalized: abbrev?.toLowerCase?.(),
          known_examples: ['1Tm', '2Tm', 'Mt', 'Sl'],
        });
        return null;
    }
    console.info('[bible-text] bolls resolve', { correlationId, received_abbrev: abbrev, canonical_abbr: book?.abbr ?? null, bollsId: bookId });
    try {
        const res = await fetch(`https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`);
        if (!res.ok) {
            console.warn('[bible-text] BollsLife non-OK', { correlationId, abbrev, bookId, chapter, status: res.status });
            return null;
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('[bible-text] BollsLife empty payload', { correlationId, abbrev, bookId, chapter });
          return null;
        }
        return data.map((v: any) => ({
          number: v.verse,
          text: String(v.text || '').replace(/<[^>]+>/g, '').trim(),
          comment: v.comment
            ? String(v.comment)
                .replace(/<a\s+href=(['"])\/([^'"]+)\1/gi, "<a href=\"https://bolls.life/$2\" target=\"_blank\" rel=\"noopener\"")
            : null,
        }));
    } catch (e) {
        console.error('[bible-text] BollsLife fetch error', { correlationId, abbrev, bookId, chapter, error: String((e as any)?.message || e) });
        return null;
    }
}


serve(async (req) => {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const t0 = Date.now();
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let abbrev: string | undefined;
  let chapter: number | undefined;
  let client_cache_version: string | number | undefined;
  try {
    const raw = await req.json().catch(() => ({}));
    // Normaliza chapter para number antes do parse (clientes podem mandar string).
    const candidate = {
      ...(typeof raw === 'object' && raw ? raw : {}),
      chapter: raw?.chapter === undefined || raw?.chapter === null
        ? raw?.chapter
        : Number(raw?.chapter),
    };

    const parsed = BibleTextInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const invalidBody = BibleTextInvalidPayloadSchema.parse({
        error: `Parâmetros inválidos: ${JSON.stringify(fieldErrors)}`,
        correlationId,
      });
      console.warn('[bible-text] invalid payload', { correlationId, fieldErrors, raw });
      return new Response(JSON.stringify(invalidBody), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      });
    }

    abbrev = parsed.data.abbrev;
    chapter = parsed.data.chapter;
    client_cache_version = parsed.data.client_cache_version;

    console.info('[bible-text] start', { correlationId, abbrev, chapter });

    const cacheConfig = await getCacheConfig();
    const ttlHours = await getCacheTtlHours();
    const cacheKey = `${abbrev}:${chapter}`;
    const shouldInvalidateL1 = client_cache_version !== cacheConfig.version;

    const cached = await getCacheL2(cacheKey, cacheConfig.version);
    if (cached) {
      console.info('[bible-text] L2 hit', { correlationId, cacheKey, ttlHours, ms: Date.now() - t0 });
      return new Response(JSON.stringify({
        ...cached,
        metadata: { ...cached.metadata, source: 'L2 Cache', correlationId, shouldInvalidateL1, current_version: cacheConfig.version, ttl_hours: ttlHours }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId, 'x-cache': 'HIT' } });
    }

    const isSovereigntyEnabled = await getFeatureFlag('bible_sovereignty_enabled');
    const resolvedBook = findBookByAbbr(abbrev);
    const resolvedBollsId = resolvedBook?.bollsId ?? BOLLS_MAP[abbrev] ?? null;
    console.info('[bible-text] resolve', {
      correlationId,
      received_abbrev: abbrev,
      canonical_abbr: resolvedBook?.abbr ?? null,
      book_name: resolvedBook?.name ?? null,
      bollsId: resolvedBollsId,
      sovereignty: isSovereigntyEnabled,
    });

    let result = await fetchFromCathedraDb(abbrev, chapter);
    let source = 'Cathedra (Local)';

    if (!isSovereigntyEnabled || !result) {
      const fallback = await fetchFromBollsLife(abbrev, chapter, correlationId);
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
        metadata: {
          source,
          cache_version: CACHE_BASE_VERSION,
          logic_version: cacheConfig.version,
          correlationId,
          contentHash,
          ttl_hours: ttlHours,
          received_abbrev: abbrev,
          canonical_abbr: resolvedBook?.abbr ?? null,
          bollsId: resolvedBollsId,
        }
      };
      await setCacheL2(cacheKey, responseData, contentHash, cacheConfig.version, ttlHours);
      console.info('[bible-text] ok', { correlationId, source, abbrev, canonical_abbr: resolvedBook?.abbr, bollsId: resolvedBollsId, verses: result.verses.length, ttlHours, ms: Date.now() - t0 });
      return new Response(JSON.stringify({ ...responseData, metadata: { ...responseData.metadata, shouldInvalidateL1 } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId, 'x-cache': 'MISS' }
      });
    }


    const stale = await getCacheL2Stale(cacheKey);
    if (stale) {
      console.warn('[bible-text] stale fallback', { correlationId, cacheKey, abbrev, ms: Date.now() - t0 });
      return new Response(JSON.stringify({
        ...stale,
        metadata: { ...(stale.metadata || {}), source: 'L2 Stale (Fallback)', correlationId, shouldInvalidateL1: false, stale: true, received_abbrev: abbrev }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } });
    }

    console.error('[bible-text] not found', { correlationId, abbrev, canonical_abbr: resolvedBook?.abbr ?? null, bollsId: resolvedBollsId, chapter, ms: Date.now() - t0 });
    const reason = !resolvedBollsId
      ? `Abreviação não reconhecida: "${abbrev}". Verifique BIBLE_CANON em supabase/functions/_shared/bibleCanon.ts.`
      : `Capítulo ${chapter} de "${resolvedBook?.name ?? abbrev}" (bollsId=${resolvedBollsId}) não foi encontrado em nenhuma fonte (Cathedra, BollsLife, cache stale).`;
    // Contrato: BibleTextErrorSchema valida que TODOS os campos obrigatórios estão presentes
    // antes de devolver. Se algo divergir, cai no catch e responde 500 com correlationId.
    const errorBody = BibleTextErrorSchema.parse({
      error: 'Texto não encontrado',
      reason,
      received_abbrev: abbrev,
      canonical_abbr: resolvedBook?.abbr ?? null,
      book_name: resolvedBook?.name ?? null,
      bollsId: resolvedBollsId,
      chapter,
      correlationId,
    });
    return new Response(JSON.stringify(errorBody), {
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