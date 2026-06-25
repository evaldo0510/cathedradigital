import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  BibleTextInputSchema,
  BibleTextErrorSchema,
  BibleTextInvalidPayloadSchema,
} from "../_shared/bibleTextSchema.ts";
import { BOLLS_MAP, bookNameFromAbbr, findBookByAbbr, normalizeAbbr } from "../_shared/bibleCanon.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, if-none-match, x-correlation-id',
  'Access-Control-Expose-Headers': 'ETag, x-correlation-id, x-cache, x-cache-age-s, x-source',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CACHE_BASE_VERSION = "v2.5.0";

// =========================================================================
// Estratégia de cache por tipo de livro
// =========================================================================
// "hot" — alta releitura (Salmos, Evangelhos, Provérbios) → TTL 30d, SWR 7d
// "core" — protocanônicos restantes → TTL 14d, SWR 3d
// "deutero" — deuterocanônicos / fontes mais voláteis → TTL 7d, SWR 1d
type CacheTier = 'hot' | 'core' | 'deutero';

const HOT_ABBRS = new Set(['Sl', 'Pv', 'Mt', 'Mc', 'Lc', 'Jo']);

function tierFor(abbrev: string): CacheTier {
  const book = findBookByAbbr(abbrev);
  if (book?.deuterocanonical) return 'deutero';
  if (HOT_ABBRS.has(book?.abbr ?? abbrev)) return 'hot';
  return 'core';
}

function cachePolicy(tier: CacheTier) {
  // ttlHours = janela "fresca" no servidor; swrHours = janela onde servimos stale
  // enquanto revalidamos. browserMaxAge < ttl para forçar revalidação periódica.
  switch (tier) {
    case 'hot':
      return { ttlHours: 720, swrHours: 168, browserMaxAge: 21600, browserSwr: 604800 };
    case 'core':
      return { ttlHours: 336, swrHours: 72,  browserMaxAge: 7200,  browserSwr: 259200 };
    case 'deutero':
    default:
      return { ttlHours: 168, swrHours: 24,  browserMaxAge: 3600,  browserSwr: 86400 };
  }
}

// =========================================================================
// Utilitários
// =========================================================================
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

async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('app_feature_flags').select('is_enabled').eq('feature_key', key).single();
    return data?.is_enabled || false;
  } catch { return false; }
}

// =========================================================================
// L2 cache com SWR: lê a linha sem filtrar por expires_at e classifica
// como fresh | stale | miss.
// =========================================================================
type L2Lookup =
  | { state: 'fresh'; content: any; ageS: number; expiresAt: string }
  | { state: 'stale'; content: any; ageS: number; expiresAt: string | null }
  | { state: 'miss' };

async function lookupCacheL2(key: string, currentVersion: number): Promise<L2Lookup> {
  try {
    const { data } = await supabase
      .from('bible_cache_l2')
      .select('content, expires_at, version, created_at')
      .eq('cache_key', key)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.content) return { state: 'miss' };
    const expires = data.expires_at ? new Date(data.expires_at).getTime() : 0;
    const now = Date.now();
    const createdAt = data.created_at ? new Date(data.created_at).getTime() : now;
    const ageS = Math.max(0, Math.round((now - createdAt) / 1000));
    if (data.version === currentVersion && expires > now) {
      return { state: 'fresh', content: data.content, ageS, expiresAt: data.expires_at };
    }
    return { state: 'stale', content: data.content, ageS, expiresAt: data.expires_at };
  } catch {
    return { state: 'miss' };
  }
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

// =========================================================================
// Métricas estruturadas (legíveis pelos logs do dashboard)
// =========================================================================
function metric(event: string, fields: Record<string, unknown>) {
  console.info(JSON.stringify({ t: 'metric', event, ts: Date.now(), ...fields }));
}

// =========================================================================
// Fontes
// =========================================================================
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

interface ReqCtx {
  bolls?: { ok: boolean; ms: number };
  /** Soma dos tempos gastos em queries Supabase (ms). */
  sqlMs?: number;
}

/** Mede uma chamada async e soma o tempo em ctx.sqlMs. */
async function timedSql<T>(ctx: ReqCtx, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    ctx.sqlMs = (ctx.sqlMs ?? 0) + (Date.now() - t0);
  }
}

async function fetchFromBollsLife(abbrev: string, chapter: number, correlationId: string, ctx: ReqCtx) {
  const book = findBookByAbbr(abbrev);
  const bookId = book?.bollsId ?? BOLLS_MAP[abbrev];
  if (!bookId) {
    console.warn('[bible-text] BOLLS_MAP miss', { correlationId, received_abbrev: abbrev });
    return null;
  }
  const t0 = Date.now();
  try {
    const res = await fetch(`https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`);
    const upstreamMs = Date.now() - t0;
    ctx.bolls = { ok: res.ok, ms: upstreamMs };
    if (!res.ok) {
      metric('bolls_fetch', { ok: false, status: res.status, abbrev, chapter, ms: upstreamMs });
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      ctx.bolls = { ok: false, ms: upstreamMs };
      metric('bolls_fetch', { ok: false, reason: 'empty', abbrev, chapter, ms: upstreamMs });
      return null;
    }
    metric('bolls_fetch', { ok: true, abbrev, chapter, ms: upstreamMs, verses: data.length });
    return data.map((v: any) => ({
      number: v.verse,
      text: String(v.text || '').replace(/<[^>]+>/g, '').trim(),
      comment: v.comment
        ? String(v.comment).replace(/<a\s+href=(['"])\/([^'"]+)\1/gi, "<a href=\"https://bolls.life/$2\" target=\"_blank\" rel=\"noopener\"")
        : null,
    }));
  } catch (e) {
    const upstreamMs = Date.now() - t0;
    ctx.bolls = { ok: false, ms: upstreamMs };
    metric('bolls_fetch', { ok: false, reason: 'exception', abbrev, chapter, error: String((e as any)?.message || e) });
    return null;
  }
}

// ---- Fallback: bibliacatolica.com.br (Ave-Maria) ----
// Usado quando bolls.life devolve vazio/erro para deuterocanônicos PT-cat.
const BIBLIACATOLICA_SLUG: Record<string, string> = {
  Gn: 'genesis', Ex: 'exodo', Lv: 'levitico', Nm: 'numeros', Dt: 'deuteronomio',
  Js: 'josue', Jz: 'juizes', Rt: 'rute',
  '1Sm': 'i-samuel', '2Sm': 'ii-samuel', '1Rs': 'i-reis', '2Rs': 'ii-reis',
  '1Cr': 'i-cronicas', '2Cr': 'ii-cronicas', Ed: 'esdras', Ne: 'neemias',
  Tb: 'tobias', Jdt: 'judite', Et: 'ester',
  '1Mc': 'i-macabeus', '2Mc': 'ii-macabeus',
  'Jó': 'jo', Sl: 'salmos', Pv: 'proverbios', Ec: 'eclesiastes', Ct: 'canticos',
  Sb: 'sabedoria', Eclo: 'eclesiastico',
  Is: 'isaias', Jr: 'jeremias', Lm: 'lamentacoes', Br: 'baruc', Ez: 'ezequiel', Dn: 'daniel',
  Os: 'oseias', Jl: 'joel', Am: 'amos', Ab: 'abdias', Jn: 'jonas', Mq: 'miqueias',
  Na: 'naum', Hc: 'habacuc', Sf: 'sofonias', Ag: 'ageu', Zc: 'zacarias', Ml: 'malaquias',
  Mt: 'sao-mateus', Mc: 'sao-marcos', Lc: 'sao-lucas', Jo: 'sao-joao',
  At: 'atos-dos-apostolos', Rm: 'romanos', '1Co': 'i-corintios', '2Co': 'ii-corintios',
  Gl: 'galatas', Ef: 'efesios', Fp: 'filipenses', Cl: 'colossenses',
  '1Ts': 'i-tessalonicenses', '2Ts': 'ii-tessalonicenses',
  '1Tm': 'i-timoteo', '2Tm': 'ii-timoteo', Tt: 'tito', Fm: 'filemon',
  Hb: 'hebreus', Tg: 'tiago',
  '1Pe': 'i-pedro', '2Pe': 'ii-pedro', '1Jo': 'i-joao', '2Jo': 'ii-joao', '3Jo': 'iii-joao',
  Jd: 'judas', Ap: 'apocalipse',
};

async function fetchFromBibliaCatolica(abbrev: string, chapter: number, correlationId: string) {
  const slug = BIBLIACATOLICA_SLUG[abbrev];
  if (!slug) {
    console.warn('[bible-text] bibliacatolica slug miss', { correlationId, abbrev });
    return null;
  }
  const url = `https://www.bibliacatolica.com.br/biblia-ave-maria/${slug}/${chapter}/`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CathedraBot/1.0; +https://cathedradigital.com.br)' },
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      metric('bibliacatolica_fetch', { ok: false, status: res.status, abbrev, chapter, ms });
      return null;
    }
    const html = await res.text();
    // Estrutura: cada versículo vem em <p>, com <strong>N.</strong> seguido do texto.
    const verses: { number: number; text: string; comment: null }[] = [];
    const re = /<strong[^>]*>\s*(\d+)\.?\s*<\/strong>\s*([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const n = parseInt(m[1], 10);
      const text = m[2]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (n && text && text.length > 3) verses.push({ number: n, text, comment: null });
    }
    if (verses.length === 0) {
      metric('bibliacatolica_fetch', { ok: false, reason: 'empty_parse', abbrev, chapter, ms });
      return null;
    }
    metric('bibliacatolica_fetch', { ok: true, abbrev, chapter, ms, verses: verses.length });
    return verses;
  } catch (e) {
    metric('bibliacatolica_fetch', { ok: false, reason: 'exception', abbrev, chapter, error: String((e as any)?.message || e) });
    return null;
  }
}

/** Insere um evento cru para a agregação horária. Fire-and-forget. */
function recordEvent(fields: {
  abbrev: string; chapter: number; cache: string; source: string | null;
  status_code: number; total_ms: number; correlation_id: string; ctx: ReqCtx;
}) {
  const sqlMs = fields.ctx.sqlMs ?? 0;
  const bollsMs = fields.ctx.bolls?.ms ?? 0;
  // edge_ms = tempo gasto na função excluindo SQL e rede upstream.
  // Pode ser pequeno em cache HIT, maior em MISS (parsing, serialização).
  const edgeMs = Math.max(0, fields.total_ms - sqlMs - bollsMs);
  const row = {
    abbrev: fields.abbrev,
    chapter: fields.chapter,
    cache: fields.cache,
    source: fields.source,
    status_code: fields.status_code,
    total_ms: fields.total_ms,
    bolls_called: !!fields.ctx.bolls,
    bolls_ok: fields.ctx.bolls?.ok ?? null,
    bolls_ms: fields.ctx.bolls?.ms ?? null,
    sql_ms: sqlMs,
    edge_ms: edgeMs,
    correlation_id: fields.correlation_id,
  };
  waitUntil(
    supabase.from('bible_cache_metric_events').insert(row).then(({ error }) => {
      if (error) console.warn('[bible-text] metric event insert failed:', error.message);
    })
  );
}

// =========================================================================
// Pipeline de revalidação (compartilhado entre request normal e SWR background)
// =========================================================================
async function revalidate(
  abbrev: string,
  chapter: number,
  correlationId: string,
  cacheVersion: number,
  ttlHours: number,
  ctx: ReqCtx,
): Promise<{ data: any; source: string } | null> {
  const isSovereigntyEnabled = await timedSql(ctx, () => getFeatureFlag('bible_sovereignty_enabled'));
  const resolvedBook = findBookByAbbr(abbrev);
  const resolvedBollsId = resolvedBook?.bollsId ?? BOLLS_MAP[abbrev] ?? null;

  let result = await timedSql(ctx, () => fetchFromCathedraDb(abbrev, chapter));
  let source = 'Cathedra (Local)';
  if (!isSovereigntyEnabled || !result) {
    const fallback = await fetchFromBollsLife(abbrev, chapter, correlationId, ctx);
    if (fallback) {
      result = { verses: fallback, bookName: bookNameFromAbbr(abbrev) };
      source = 'BollsLife (Fallback)';
    }
  }
  // Segunda fonte pública: bibliacatolica.com.br (Ave-Maria) — usada quando
  // bolls.life retorna vazio para deuterocanônicos / capítulos PT-cat.
  if (!result) {
    const ave = await fetchFromBibliaCatolica(abbrev, chapter, correlationId);
    if (ave && ave.length > 0) {
      result = { verses: ave, bookName: bookNameFromAbbr(abbrev) };
      source = 'BibliaCatolica (Ave-Maria)';
    }
  }
  if (!result) return null;

  const fullText = result.verses.map((v: any) => v.text).join(' ');
  const contentHash = await sha256(fullText);
  const responseData = {
    book: result.bookName, chapter, verses: result.verses,
    metadata: {
      source,
      cache_version: CACHE_BASE_VERSION,
      logic_version: cacheVersion,
      correlationId,
      contentHash,
      ttl_hours: ttlHours,
      received_abbrev: abbrev,
      canonical_abbr: resolvedBook?.abbr ?? null,
      bollsId: resolvedBollsId,
    },
  };
  await timedSql(ctx, () => setCacheL2(`${abbrev}:${chapter}`, responseData, contentHash, cacheVersion, ttlHours));
  return { data: responseData, source };
}

function waitUntil(promise: Promise<unknown>) {
  // EdgeRuntime.waitUntil mantém a tarefa viva após a resposta ser enviada.
  // @ts-ignore EdgeRuntime é injetado pelo runtime do Supabase Functions.
  const er = (globalThis as any).EdgeRuntime;
  if (er && typeof er.waitUntil === 'function') {
    try { er.waitUntil(promise); return; } catch { /* fallthrough */ }
  }
  // Fallback: silencia a promise para não vazar unhandled rejection.
  promise.catch((e) => console.error('[bible-text] background revalidate error:', e));
}

// =========================================================================
// Handler
// =========================================================================
serve(async (req) => {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const t0 = Date.now();
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Endpoint interno: aquecimento pelo script (POST com {warm:true}).
  let abbrev: string | undefined;
  let chapter: number | undefined;
  let client_cache_version: string | number | undefined;
  let warmOnly = false;
  const ctx: ReqCtx = {};

  try {
    const raw = await req.json().catch(() => ({}));
    warmOnly = raw?.warm === true;
    const candidate = {
      ...(typeof raw === 'object' && raw ? raw : {}),
      chapter: raw?.chapter === undefined || raw?.chapter === null ? raw?.chapter : Number(raw?.chapter),
    };

    const parsed = BibleTextInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const invalidBody = BibleTextInvalidPayloadSchema.parse({
        error: `Parâmetros inválidos: ${JSON.stringify(fieldErrors)}`,
        correlationId,
      });
      const totalMs = Date.now() - t0;
      metric('request_end', { correlationId, status: 400, reason: 'invalid_payload', ms: totalMs });
      // Não registramos evento de métrica sem abbrev/chapter — alimentaria lixo no agregado por livro.
      return new Response(JSON.stringify(invalidBody), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      });
    }

    abbrev = normalizeAbbr(parsed.data.abbrev);
    chapter = parsed.data.chapter;
    client_cache_version = parsed.data.client_cache_version;

    const cacheConfig = await getCacheConfig();
    const tier = tierFor(abbrev);
    const policy = cachePolicy(tier);
    const cacheKey = `${abbrev}:${chapter}`;
    const shouldInvalidateL1 = client_cache_version !== cacheConfig.version;

    // Modo warm: força revalidação e responde mínimo. Usado pelo script.
    if (warmOnly) {
      const result = await revalidate(abbrev, chapter, correlationId, cacheConfig.version, policy.ttlHours, ctx);
      const totalMs = Date.now() - t0;
      metric('warm', { correlationId, cacheKey, tier, ok: !!result, ms: totalMs });
      recordEvent({ abbrev, chapter, cache: 'WARM', source: result?.source ?? null, status_code: result ? 200 : 502, total_ms: totalMs, correlation_id: correlationId, ctx });
      return new Response(JSON.stringify({ ok: !!result, cacheKey, tier, source: result?.source ?? null, correlationId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      });
    }

    const lookup = await lookupCacheL2(cacheKey, cacheConfig.version);

    // ---- FRESH ----
    if (lookup.state === 'fresh') {
      const totalMs = Date.now() - t0;
      metric('request_end', { correlationId, cache: 'HIT', tier, cacheKey, ageS: lookup.ageS, ms: totalMs });
      recordEvent({ abbrev, chapter, cache: 'HIT', source: 'L2', status_code: 200, total_ms: totalMs, correlation_id: correlationId, ctx });
      return new Response(JSON.stringify({
        ...lookup.content,
        metadata: { ...lookup.content.metadata, source: 'L2 Cache', correlationId, shouldInvalidateL1, current_version: cacheConfig.version, ttl_hours: policy.ttlHours, cache_tier: tier },
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
          'x-cache': 'HIT',
          'x-cache-age-s': String(lookup.ageS),
          'x-source': 'L2',
          'Cache-Control': `public, max-age=${policy.browserMaxAge}, stale-while-revalidate=${policy.browserSwr}`,
        },
      });
    }

    // ---- STALE dentro da janela SWR: serve stale, revalida em background ----
    if (lookup.state === 'stale') {
      const swrCutoffS = policy.swrHours * 3600;
      if (lookup.ageS <= swrCutoffS + policy.ttlHours * 3600) {
        const totalMs = Date.now() - t0;
        metric('request_end', { correlationId, cache: 'STALE', tier, cacheKey, ageS: lookup.ageS, ms: totalMs });
        recordEvent({ abbrev, chapter, cache: 'STALE', source: 'L2-SWR', status_code: 200, total_ms: totalMs, correlation_id: correlationId, ctx });
        const bgCtx: ReqCtx = {};
        waitUntil(revalidate(abbrev!, chapter!, correlationId, cacheConfig.version, policy.ttlHours, bgCtx)
          .then((r) => metric('swr_revalidate', { correlationId, cacheKey, ok: !!r, source: r?.source ?? null })));
        return new Response(JSON.stringify({
          ...lookup.content,
          metadata: { ...(lookup.content.metadata || {}), source: 'L2 SWR', correlationId, shouldInvalidateL1, current_version: cacheConfig.version, ttl_hours: policy.ttlHours, cache_tier: tier, stale: true, age_s: lookup.ageS },
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'x-correlation-id': correlationId,
            'x-cache': 'STALE',
            'x-cache-age-s': String(lookup.ageS),
            'x-source': 'L2-SWR',
            'Cache-Control': `public, max-age=0, stale-while-revalidate=${policy.browserSwr}`,
          },
        });
      }
    }

    // ---- MISS (ou stale fora da janela) → revalidar síncrono ----
    const revalidated = await revalidate(abbrev, chapter, correlationId, cacheConfig.version, policy.ttlHours, ctx);
    if (revalidated) {
      const totalMs = Date.now() - t0;
      metric('request_end', { correlationId, cache: 'MISS', tier, cacheKey, source: revalidated.source, ms: totalMs });
      recordEvent({ abbrev, chapter, cache: 'MISS', source: revalidated.source, status_code: 200, total_ms: totalMs, correlation_id: correlationId, ctx });
      return new Response(JSON.stringify({
        ...revalidated.data,
        metadata: { ...revalidated.data.metadata, shouldInvalidateL1, cache_tier: tier },
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
          'x-cache': 'MISS',
          'x-source': revalidated.source,
          'Cache-Control': `public, max-age=${policy.browserMaxAge}, stale-while-revalidate=${policy.browserSwr}`,
        },
      });
    }

    // ---- Última defesa: stale antigo (qualquer idade) ----
    if (lookup.state === 'stale') {
      const totalMs = Date.now() - t0;
      metric('request_end', { correlationId, cache: 'STALE_LAST_RESORT', tier, cacheKey, ageS: lookup.ageS, ms: totalMs });
      recordEvent({ abbrev, chapter, cache: 'STALE_LAST_RESORT', source: 'L2-LAST-RESORT', status_code: 200, total_ms: totalMs, correlation_id: correlationId, ctx });
      return new Response(JSON.stringify({
        ...lookup.content,
        metadata: { ...(lookup.content.metadata || {}), source: 'L2 Stale (Fallback)', correlationId, shouldInvalidateL1: false, stale: true, age_s: lookup.ageS },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId, 'x-cache': 'STALE', 'x-source': 'L2-LAST-RESORT' } });
    }

    // ---- Conteúdo indisponível na fonte: responde 200 com unavailable=true
    // ----  para não gerar 404 na UI e quebrar a navegação. O front desabilita
    // ----  esses capítulos via BIBLE_MISSING_CHAPTERS, mas defendemos aqui também.
    const resolvedBook = findBookByAbbr(abbrev);
    const resolvedBollsId = resolvedBook?.bollsId ?? BOLLS_MAP[abbrev] ?? null;
    const reason = !resolvedBollsId
      ? `Abreviação não reconhecida: "${abbrev}". Verifique BIBLE_CANON.`
      : `Capítulo ${chapter} de "${resolvedBook?.name ?? abbrev}" indisponível nas fontes públicas (bolls.life, bibliacatolica.com.br). Importe via scripts/import-bible-dump.ts.`;
    const totalMs = Date.now() - t0;
    metric('request_end', { correlationId, status: 200, reason: 'unavailable', tier, cacheKey, ms: totalMs });
    recordEvent({ abbrev, chapter, cache: 'MISS', source: null, status_code: 200, total_ms: totalMs, correlation_id: correlationId, ctx });
    return new Response(JSON.stringify({
      book: resolvedBook?.name ?? abbrev,
      chapter,
      verses: [],
      unavailable: true,
      metadata: {
        source: 'unavailable',
        reason,
        received_abbrev: abbrev,
        canonical_abbr: resolvedBook?.abbr ?? null,
        bollsId: resolvedBollsId,
        correlationId,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId, 'x-source': 'unavailable' },
    });
  } catch (error: any) {
    console.error('[bible-text] unexpected error', { correlationId, abbrev, chapter, error: String(error?.message || error) });
    try {
      if (abbrev && chapter) {
        const fallback = await lookupCacheL2(`${abbrev}:${chapter}`, -1);
        if (fallback.state !== 'miss') {
          return new Response(JSON.stringify({
            ...fallback.content,
            metadata: { ...(fallback.content.metadata || {}), source: 'L2 Stale (Error Recovery)', correlationId, shouldInvalidateL1: false, stale: true },
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId, 'x-cache': 'STALE', 'x-source': 'L2-ERROR-RECOVERY' } });
        }
      }
    } catch {}
    return new Response(JSON.stringify({ error: 'Erro interno', correlationId }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
    });
  }
});
