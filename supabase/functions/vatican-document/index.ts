import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

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
const LANG_FALLBACK_SUFFIXES = ['_pt.html', '_po.html', '_sp.html', '_it.html', '_la.html'];

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

/** Build the lang-fallback chain for a given URL. */
const buildLangChain = (url: string): string[] => {
  const matched = LANG_FALLBACK_SUFFIXES.find((s) => url.endsWith(s));
  if (!matched) return [url];
  const stem = url.slice(0, -matched.length);
  // Try the user-requested language first, then the rest in order.
  return [matched, ...LANG_FALLBACK_SUFFIXES.filter((s) => s !== matched)].map(
    (s) => stem + s,
  );
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
  const headers = { ...corsHeaders, ...cidH };
  const json = (body: Record<string, unknown>, status = 200): Response =>
    new Response(JSON.stringify({ ...body, correlation_id: cid }), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { headers });



  try {
    const { url } = await req.json().catch(() => ({ url: null }));
    if (!url || typeof url !== 'string') return json({ error: 'URL is required' }, 400);

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return json({ error: 'Invalid URL' }, 400);
    }
    if (!parsed.hostname.endsWith('vatican.va')) {
      return json({ error: 'Only vatican.va URLs are allowed' }, 400);
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
    let lastStatus = 0;
    let extracted: { title: string; content: string } | null = null;
    let winningUrl = url;

    for (const candidate of chain) {
      const { status, html } = await fetchOnce(candidate);
      lastStatus = status;
      if (status === 200 && html) {
        const { title, content } = extractText(html);
        if (content.length >= MIN_CONTENT_LEN) {
          extracted = { title, content };
          winningUrl = candidate;
          break;
        }
        // Thin content — remember it but keep trying other languages
        if (!extracted) {
          extracted = { title, content };
          winningUrl = candidate;
        }
      }
    }

    if (!extracted) {
      const step = lastStatus === 404 ? 'fetch_404' : lastStatus === 0 ? 'fetch_error' : `fetch_${lastStatus}`;
      await recordAttempt(url, step);
      return json(
        {
          error: lastStatus === 404 ? 'Documento não encontrado em nenhum idioma.' : 'Falha ao buscar documento.',
          meta: { step, status: lastStatus, tried: chain },
        },
        lastStatus === 404 ? 404 : 502,
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
      },
    }, isThin ? 206 : 200);
  } catch (error) {
    return json({ error: (error as Error).message, meta: { step: 'fetch_error' } }, 500);
  }
});
