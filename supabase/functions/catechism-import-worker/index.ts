// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { extractParagraph, fileFor, slugFor } from './parser.ts';

const BASE = 'https://www.vatican.va/archive/cathechism_po/index_new';

const MAX_ATTEMPTS = 6;
// Backoff em segundos: 30s, 2min, 8min, 30min, 60min, 60min (cap)
const BACKOFF_SECONDS = [30, 120, 480, 1800, 3600, 3600];

const htmlCache = new Map<string, string>();

async function fetchHtml(file: string): Promise<string> {
  const cached = htmlCache.get(file);
  if (cached) return cached;
  const res = await fetch(`${BASE}/${file}`, {
    headers: { 'User-Agent': 'CathedraDigital/1.0 (catechism importer)' },
  });
  if (!res.ok) throw new Error(`fetch ${file} -> HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  let text: string;
  try { text = new TextDecoder('iso-8859-1').decode(buf); }
  catch { text = new TextDecoder('utf-8').decode(buf); }
  htmlCache.set(file, text);
  return text;
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(50, Number(body?.limit ?? 10)));
    const specific: number[] | undefined = Array.isArray(body?.paragraphs)
      ? body.paragraphs.map(Number).filter((x: number) => Number.isFinite(x) && x >= 1 && x <= 2865)
      : undefined;
    const nowIso = new Date().toISOString();

    // Selecionar itens elegíveis
    let items: Array<{ id: string; paragraph: number; attempts: number; attempts_log: any[] }> = [];
    if (specific && specific.length) {
      const { data, error } = await supabase
        .from('catechism_import_queue')
        .select('id, paragraph, attempts, attempts_log')
        .in('paragraph', specific)
        .in('status', ['pending', 'error']);
      if (error) throw error;
      items = (data ?? []) as any;
    } else {
      const { data, error } = await supabase
        .from('catechism_import_queue')
        .select('id, paragraph, attempts, attempts_log')
        .in('status', ['pending', 'error'])
        .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
        .order('requested_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      items = (data ?? []) as any;
    }

    if (!items.length) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, message: 'no eligible items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Marcar processing
    await supabase
      .from('catechism_import_queue')
      .update({ status: 'processing', updated_at: nowIso })
      .in('id', items.map((i) => i.id));

    const results: Array<{ paragraph: number; status: string; error?: string; attempt: number; duration_ms: number }> = [];

    for (const item of items) {
      const n = item.paragraph;
      const attempt = (item.attempts ?? 0) + 1;
      const startedAt = Date.now();
      const startedIso = new Date(startedAt).toISOString();
      const log = Array.isArray(item.attempts_log) ? [...item.attempts_log] : [];

      try {
        const file = fileFor(n);
        if (!file) throw new Error(`no file mapping for paragraph ${n}`);
        const html = await fetchHtml(file);
        const text = extractParagraph(html, n);
        if (!text) throw new Error(`paragraph ${n} not found in ${file}`);

        const { error: upErr } = await supabase
          .from('catechism_official')
          .upsert(
            { paragraph: n, slug: slugFor(n), content: text, texto_base: text, status: 'imported' },
            { onConflict: 'paragraph' },
          );
        if (upErr) throw upErr;

        const duration = Date.now() - startedAt;
        log.push({ attempt, started_at: startedIso, duration_ms: duration, status: 'completed', source: file });
        console.log(JSON.stringify({ fn: 'catechism-import-worker', level: 'info', paragraph: n, attempt, duration_ms: duration, status: 'completed', file }));

        await supabase
          .from('catechism_import_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_error: null,
            attempts: attempt,
            next_attempt_at: null,
            attempts_log: log,
          })
          .eq('id', item.id);

        results.push({ paragraph: n, status: 'completed', attempt, duration_ms: duration });
      } catch (err: any) {
        const msg = String(err?.message ?? err).slice(0, 500);
        const duration = Date.now() - startedAt;
        const giveUp = attempt >= MAX_ATTEMPTS;
        const backoffSec = BACKOFF_SECONDS[Math.min(attempt - 1, BACKOFF_SECONDS.length - 1)];
        const nextAttempt = giveUp ? null : new Date(Date.now() + backoffSec * 1000).toISOString();

        log.push({ attempt, started_at: startedIso, duration_ms: duration, status: 'error', error: msg, next_attempt_at: nextAttempt, gave_up: giveUp });
        console.error(JSON.stringify({ fn: 'catechism-import-worker', level: 'error', paragraph: n, attempt, duration_ms: duration, error: msg, next_attempt_at: nextAttempt, gave_up: giveUp }));

        await supabase
          .from('catechism_import_queue')
          .update({
            status: 'error',
            last_error: msg,
            attempts: attempt,
            next_attempt_at: nextAttempt,
            attempts_log: log,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        results.push({ paragraph: n, status: 'error', error: msg, attempt, duration_ms: duration });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: results.length,
        completed: results.filter((r) => r.status === 'completed').length,
        errors: results.filter((r) => r.status === 'error').length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('catechism-import-worker fatal:', err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
