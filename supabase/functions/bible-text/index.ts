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
// Cache L1 in-memory (por instância de Edge) com SWR.
// Conteúdo L2: fresh por 5min, depois stale por mais 5min (serve valor antigo
// e dispara refresh em background via waitUntil). Hard-expire = 10min.
// Configs/flags: TTL curto (30s) sem SWR — propagam invalidações rápido.
// =========================================================================
const L1_TTL_MS_L2 = 300_000;         // 5min "fresh" para conteúdo L2
const L1_SWR_MS_L2 = 300_000;         // +5min de janela SWR (hard expire = 10min)
const L1_TTL_MS_CONFIG = 30_000;      // 30s para feature flags / config
const L1_MAX_ENTRIES = 500;

type L1Entry<T> = { value: T; freshUntil: number; hardExpiresAt: number };
const l1Cache = new Map<string, L1Entry<unknown>>();

/** Retorna {value, stale} se houver entrada não-expirada (mesmo stale). */
function l1Get<T>(key: string): { value: T; stale: boolean } | undefined {
  const e = l1Cache.get(key) as L1Entry<T> | undefined;
  if (!e) return undefined;
  const now = Date.now();
  if (e.hardExpiresAt < now) { l1Cache.delete(key); return undefined; }
  return { value: e.value, stale: now > e.freshUntil };
}
function l1Set<T>(key: string, value: T, ttlMs: number, swrMs = 0) {
  const now = Date.now();
  l1Cache.set(key, { value, freshUntil: now + ttlMs, hardExpiresAt: now + ttlMs + swrMs });
  if (l1Cache.size > L1_MAX_ENTRIES) {
    for (const [k, v] of l1Cache) if (v.hardExpiresAt < now) l1Cache.delete(k);
    if (l1Cache.size > L1_MAX_ENTRIES) {
      const firstKey = l1Cache.keys().next().value;
      if (firstKey !== undefined) l1Cache.delete(firstKey);
    }
  }
}
function l1Invalidate(key: string) { l1Cache.delete(key); }


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
  const cached = l1Get<{ enabled: boolean; version: number }>('cfg:cache');
  if (cached) return cached.value;
  try {
    const { data } = await supabase.from('app_feature_flags').select('is_enabled, metadata').eq('feature_key', 'bible_cache_global_version').single();
    const value = {
      enabled: data?.is_enabled || false,
      version: data?.metadata?.version || 1,
    };
    l1Set('cfg:cache', value, L1_TTL_MS_CONFIG);
    return value;
  } catch { return { enabled: true, version: 1 }; }
}

async function getFeatureFlag(key: string): Promise<boolean> {
  const cacheKey = `flag:${key}`;
  const cached = l1Get<boolean>(cacheKey);
  if (cached) return cached.value;
  try {
    const { data } = await supabase.from('app_feature_flags').select('is_enabled').eq('feature_key', key).single();
    const value = data?.is_enabled || false;
    l1Set(cacheKey, value, L1_TTL_MS_CONFIG);
    return value;
  } catch { return false; }
}



// =========================================================================
// L2 cache com SWR: lê a linha sem filtrar por expires_at e classifica
// como fresh | stale | miss.
// =========================================================================
type L2Row = { content: any; expires_at: string | null; version: number; created_at: string | null };
type L2Lookup =
  | { state: 'fresh'; content: any; ageS: number; expiresAt: string }
  | { state: 'stale'; content: any; ageS: number; expiresAt: string | null }
  | { state: 'miss' };

async function fetchCacheL2Row(key: string): Promise<L2Row | null> {
  // L1 hit (fresh ou stale-mas-dentro-da-janela-SWR): evita round-trip ao Postgres.
  // Se stale, dispara revalidação em background para a próxima leitura ser fresh.
  const cached = l1Get<L2Row>(`l2:${key}`);
  if (cached) {
    if (cached.stale) {
      // Marca como fresh imediatamente para evitar múltiplos refreshes paralelos
      // entre o disparo e a conclusão do fetch em background.
      l1Set<L2Row>(`l2:${key}`, cached.value, L1_TTL_MS_L2, L1_SWR_MS_L2);
      waitUntil(refreshL2InBackground(key));
    }
    return cached.value;
  }
  try {
    const { data } = await supabase
      .from('bible_cache_l2')
      .select('content, expires_at, version, created_at')
      .eq('cache_key', key)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.content) return null;
    const row = data as L2Row;
    l1Set(`l2:${key}`, row, L1_TTL_MS_L2, L1_SWR_MS_L2);
    return row;
  } catch {
    return null;
  }
}

/** Refresh em background do L1: lê do L2 sem afetar o request corrente. */
async function refreshL2InBackground(key: string) {
  try {
    const { data } = await supabase
      .from('bible_cache_l2')
      .select('content, expires_at, version, created_at')
      .eq('cache_key', key)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.content) {
      l1Set<L2Row>(`l2:${key}`, data as L2Row, L1_TTL_MS_L2, L1_SWR_MS_L2);
      metric('l1_swr_refresh', { key, ok: true });
    } else {
      l1Invalidate(`l2:${key}`);
      metric('l1_swr_refresh', { key, ok: false, reason: 'empty' });
    }
  } catch (e) {
    metric('l1_swr_refresh', { key, ok: false, error: String((e as any)?.message || e) });
  }
}


function classifyL2(row: L2Row | null, currentVersion: number): L2Lookup {
  if (!row) return { state: 'miss' };
  const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const now = Date.now();
  const createdAt = row.created_at ? new Date(row.created_at).getTime() : now;
  const ageS = Math.max(0, Math.round((now - createdAt) / 1000));
  if (row.version === currentVersion && expires > now) {
    return { state: 'fresh', content: row.content, ageS, expiresAt: row.expires_at as string };
  }
  return { state: 'stale', content: row.content, ageS, expiresAt: row.expires_at };
}

/** Compatibilidade: usado por handlers de exceção. */
async function lookupCacheL2(key: string, currentVersion: number): Promise<L2Lookup> {
  return classifyL2(await fetchCacheL2Row(key), currentVersion);
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
    // Write-through: atualiza L1 para os próximos requests da mesma instância.
    l1Set<L2Row>(`l2:${key}`, {
      content,
      expires_at: expireDate.toISOString(),
      version,
      created_at: new Date().toISOString(),
    }, L1_TTL_MS_L2);
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

interface SqlEntry { label: string; startedAt: number; ms: number; }

interface ReqCtx {
  bolls?: { ok: boolean; ms: number };
  /** Breakdown por query — preservado para diagnóstico. */
  sqlEntries: SqlEntry[];
}

function newCtx(): ReqCtx { return { sqlEntries: [] }; }

/** Mede uma chamada async e registra início/duração para cálculo wall-clock. */
async function timedSql<T>(ctx: ReqCtx, label: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    return await fn();
  } finally {
    ctx.sqlEntries.push({ label, startedAt, ms: Date.now() - startedAt });
  }
}

/**
 * Soma wall-clock real do tempo gasto em SQL.
 * Funde intervalos sobrepostos (queries paralelas via Promise.all contam 1x),
 * evitando casos em que sql_ms > total_ms.
 */
function computeSqlMs(entries: SqlEntry[]): number {
  if (entries.length === 0) return 0;
  const intervals = entries
    .map(e => [e.startedAt, e.startedAt + e.ms] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let curStart = intervals[0][0];
  let curEnd = intervals[0][1];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s <= curEnd) curEnd = Math.max(curEnd, e);
    else { total += curEnd - curStart; curStart = s; curEnd = e; }
  }
  total += curEnd - curStart;
  return total;
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
  const sqlMs = computeSqlMs(fields.ctx.sqlEntries);
  const bollsMs = fields.ctx.bolls?.ms ?? 0;
  // edge_ms = tempo total - wall-clock SQL - upstream. Como agora sqlMs é
  // wall-clock (intervalos fundidos), edge_ms nunca fica negativo nem distorce
  // quando há queries paralelas (Promise.all).
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
  // Breakdown estruturado nos logs para diagnóstico (sem schema novo).
  metric('sql_breakdown', {
    correlation_id: fields.correlation_id,
    abbrev: fields.abbrev,
    chapter: fields.chapter,
    sql_ms: sqlMs,
    entries: fields.ctx.sqlEntries.map(e => ({ label: e.label, ms: e.ms })),
  });
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
  sovereigntyEnabledHint?: boolean,
): Promise<{ data: any; source: string } | null> {
  const isSovereigntyEnabled = sovereigntyEnabledHint !== undefined
    ? sovereigntyEnabledHint
    : await timedSql(ctx, 'getFeatureFlag:sovereignty', () => getFeatureFlag('bible_sovereignty_enabled'));
  const resolvedBook = findBookByAbbr(abbrev);
  const resolvedBollsId = resolvedBook?.bollsId ?? BOLLS_MAP[abbrev] ?? null;



  let result = await timedSql(ctx, 'fetchFromCathedraDb', () => fetchFromCathedraDb(abbrev, chapter));
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
  await timedSql(ctx, 'setCacheL2', () => setCacheL2(`${abbrev}:${chapter}`, responseData, contentHash, cacheVersion, ttlHours));
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
  const ctx: ReqCtx = newCtx();

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

    // Paraleliza as 3 queries de leitura: config, feature flag e L2 row.
    // Antes eram 3 round-trips sequenciais (~80-150ms cada). Agora rodam em
    // paralelo via Promise.all e o L1 in-memory absorve hits subsequentes.
    // L2 row é buscado e classificado depois, com a version vinda do config.
    const cacheKey = `${abbrev}:${chapter}`;
    const [cacheConfig, sovereigntyEnabled, l2Row] = await Promise.all([
      timedSql(ctx, 'getCacheConfig', () => getCacheConfig()),
      timedSql(ctx, 'getFeatureFlag:sovereignty', () => getFeatureFlag('bible_sovereignty_enabled')),
      timedSql(ctx, 'fetchCacheL2Row', () => fetchCacheL2Row(cacheKey)),
    ]);
    const tier = tierFor(abbrev);
    const policy = cachePolicy(tier);
    const shouldInvalidateL1 = client_cache_version !== cacheConfig.version;

    // Modo warm: força revalidação e responde mínimo. Usado pelo script.
    if (warmOnly) {
      const result = await revalidate(abbrev, chapter, correlationId, cacheConfig.version, policy.ttlHours, ctx, sovereigntyEnabled);
      const totalMs = Date.now() - t0;
      metric('warm', { correlationId, cacheKey, tier, ok: !!result, ms: totalMs });
      recordEvent({ abbrev, chapter, cache: 'WARM', source: result?.source ?? null, status_code: result ? 200 : 502, total_ms: totalMs, correlation_id: correlationId, ctx });
      return new Response(JSON.stringify({ ok: !!result, cacheKey, tier, source: result?.source ?? null, correlationId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      });
    }

    const lookup = classifyL2(l2Row, cacheConfig.version);


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
        const bgCtx: ReqCtx = newCtx();
        waitUntil(revalidate(abbrev!, chapter!, correlationId, cacheConfig.version, policy.ttlHours, bgCtx, sovereigntyEnabled)

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
    const revalidated = await revalidate(abbrev, chapter, correlationId, cacheConfig.version, policy.ttlHours, ctx, sovereigntyEnabled);
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
