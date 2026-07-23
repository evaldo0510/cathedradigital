import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";
import { makeResponder } from "../_shared/http-response.ts";

/**
 * vatican-document edge function — Sprint A / CAT-001 propaga correlation_id.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MIN_CONTENT_LEN = 500;
const FETCH_TIMEOUT_MS = 8_000;
const LANG_FALLBACK_SUFFIXES = ['_pt.html', '_po.html', '_sp.html', '_it.html', '_en.html', '_fr.html', '_ge.html', '_la.html'];
/** Códigos usados em URLs `/{content|archive|...}/xxx/{lang}/...` do vatican.va. */
const LANG_PATH_CODES = ['pt', 'po', 'it', 'en', 'es', 'sp', 'fr', 'de', 'la'];

/** Strip HTML/JS/CSS keeping a stable text-only body. */
const extractText = (html: string): { title: string; content: string } => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = (titleMatch?.[1] ?? 'Documento').replace(/\s+/g, ' ').trim();

  // Drop noise BEFORE stripping tags so we don't merge nav into content.
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { title, content: body };
};

/**
 * Build the lang-fallback chain for a given URL.
 * Supports two vatican.va patterns:
 *   1) Suffixed:  `..._pt.html`  → swap `_pt.html`, `_po.html`, `_it.html`, ...
 *   2) Path-based: `.../{lang}/...` (`/content/pius-ix/la/...`) → swap segment.
 */
const buildLangChain = (url: string): string[] => {
  const out: string[] = [url];

  // Pattern 1 — suffix `_xx.html`
  const suffix = LANG_FALLBACK_SUFFIXES.find((s) => url.endsWith(s));
  if (suffix) {
    const stem = url.slice(0, -suffix.length);
    for (const s of LANG_FALLBACK_SUFFIXES) {
      const cand = stem + s;
      if (!out.includes(cand)) out.push(cand);
    }
  }

  // Pattern 2 — path segment `/xx/` (only within vatican.va URLs)
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/');
    const langIdx = parts.findIndex((p) => LANG_PATH_CODES.includes(p));
    if (langIdx > 0) {
      for (const code of LANG_PATH_CODES) {
        const clone = [...parts];
        clone[langIdx] = code;
        const cand = `${parsed.origin}${clone.join('/')}${parsed.search}`;
        if (!out.includes(cand)) out.push(cand);
      }
    }
  } catch { /* noop */ }

  return out;
};

const fetchOnce = async (
  url: string,
): Promise<{ status: number; html?: string }> => {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CathedraDigital/1.0 (+https://cathedradigital.com.br)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,la;q=0.4',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) {
      // Drain body to prevent resource leaks in Deno
      await res.text().catch(() => {});
      return { status: res.status };
    }
    return { status: res.status, html: await res.text() };
  } catch (e) {
    console.warn('[vatican-document] fetch failed', url, (e as Error).message);
    return { status: 0 };
  }
};

const recordAttempt = async (
  url: string,
  status: string,
  content?: { title: string; text: string },
) => {
  try {
    if (content && content.text.length >= MIN_CONTENT_LEN) {
      await supabase
        .from('vatican_cache')
        .upsert(
          {
            url,
            title: content.title,
            content: content.text,
            content_length: content.text.length,
            fetched_status: status,
            last_attempt_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'url' },
        );
    } else {
      // Don't overwrite content; just stamp the attempt so we can audit thin/404s
      const { data: existing } = await supabase
        .from('vatican_cache')
        .select('id')
        .eq('url', url)
        .limit(1);
      if (existing && existing.length > 0) {
        await supabase
          .from('vatican_cache')
          .update({
            fetched_status: status,
            last_attempt_at: new Date().toISOString(),
          })
          .eq('url', url);
      } else {
        await supabase.from('vatican_cache').insert({
          url,
          title: content?.title ?? 'Documento (vazio)',
          content: '',
          content_length: 0,
          fetched_status: status,
          last_attempt_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.warn('[vatican-document] recordAttempt failed', (e as Error).message);
  }
};

Deno.serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger('vatican-document', cid);
  const R = makeResponder(cid);
  const headers = { ...corsHeaders, ...cidH };
  const json = (body: Record<string, unknown>, status = 200): Response =>
    new Response(JSON.stringify({ ...body, correlation_id: cid }), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { headers });



  try {
    const { url } = await req.json().catch(() => ({ url: null }));
    if (!url || typeof url !== 'string')
      return R.error(400, 'invalid_body', { message: 'URL is required' });

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return R.error(400, 'invalid_body', { message: 'Invalid URL' });
    }
    if (!parsed.hostname.endsWith('vatican.va')) {
      return R.error(400, 'invalid_body', { message: 'Only vatican.va URLs are allowed' });
    }

    // 1) Cache lookup with limit(1)
    const { data: cachedRows } = await supabase
      .from('vatican_cache')
      .select('url, title, content, content_length, fetched_status')
      .eq('url', url)
      .limit(1);
    const cached = cachedRows && cachedRows.length > 0 ? cachedRows[0] : null;

    if (cached && (cached.content_length ?? cached.content?.length ?? 0) >= MIN_CONTENT_LEN) {
      return json({
        title: cached.title,
        text: cached.content,
        source: 'Local Cache',
        meta: {
          step: 'cache_hit',
          content_length: cached.content_length ?? cached.content.length,
        },
      });
    }

    // 2) Fetch chain with language fallback
    const chain = buildLangChain(url);
    const attempts: Array<{ url: string; status: number; reason: string }> = [];
    let lastStatus = 0;
    let extracted: { title: string; content: string } | null = null;
    let winningUrl = url;

    for (const candidate of chain) {
      const { status, html } = await fetchOnce(candidate);
      lastStatus = status;
      let reason = '';
      if (status === 0) reason = 'network_error_or_timeout';
      else if (status === 404) reason = 'not_found';
      else if (status >= 400) reason = `http_${status}`;
      else if (status === 200 && html) {
        const { title, content } = extractText(html);
        if (content.length >= MIN_CONTENT_LEN) {
          extracted = { title, content };
          winningUrl = candidate;
          reason = `ok (${content.length} chars)`;
          attempts.push({ url: candidate, status, reason });
          log.info('fetch_ok', { url: candidate, len: content.length });
          break;
        }
        reason = `thin (${content.length} chars, min ${MIN_CONTENT_LEN})`;
        // Thin content — remember it but keep trying other languages
        if (!extracted) {
          extracted = { title, content };
          winningUrl = candidate;
        }
      } else {
        reason = `http_${status}`;
      }
      attempts.push({ url: candidate, status, reason });
      log.warn('fetch_attempt', { url: candidate, status, reason });
    }

    if (!extracted) {
      const step = lastStatus === 404 ? 'fetch_404' : lastStatus === 0 ? 'fetch_error' : `fetch_${lastStatus}`;
      await recordAttempt(url, step);
      log.error('all_attempts_failed', { url, attempts });
      return R.error(
        lastStatus === 404 ? 404 : 502,
        lastStatus === 404 ? 'not_found' : 'internal_error',
        {
          message: lastStatus === 404
            ? 'Documento não encontrado em nenhum idioma. Verifique se a URL configurada em magisterium-urls.ts ainda existe no vatican.va.'
            : 'Falha ao buscar documento.',
          step,
          status: lastStatus,
          tried: chain,
          attempts,
        },
      );
    }

    const isThin = extracted.content.length < MIN_CONTENT_LEN;
    const step = isThin ? 'fetch_thin' : 'fetch_ok';
    await recordAttempt(winningUrl, step, { title: extracted.title, text: extracted.content });

    return json({
      title: extracted.title,
      text: extracted.content,
      source: isThin ? 'Vatican.va (parcial)' : 'Vatican.va (sincronizado)',
      meta: {
        step,
        content_length: extracted.content.length,
        winning_url: winningUrl,
        tried: chain,
        attempts,
      },
    }, isThin ? 206 : 200);
  } catch (error) {
    log.error('unhandled', { err: (error as Error).message });
    return R.error(500, 'internal_error', { message: (error as Error).message, step: 'fetch_error' });
  }
});
