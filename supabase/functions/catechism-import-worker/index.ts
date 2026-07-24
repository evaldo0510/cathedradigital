// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const BASE = 'https://www.vatican.va/archive/cathechism_po/index_new';

// Ranges verified against vatican.va PT archive.
const FILES: Array<{ from: number; to: number; file: string }> = [
  { from: 1,    to: 25,   file: 'prologo%201-25_po.html' },
  { from: 26,   to: 49,   file: 'p1s1c1_26-49_po.html' },
  { from: 50,   to: 141,  file: 'p1s1c2_50-141_po.html' },
  { from: 142,  to: 184,  file: 'p1s1c3_142-184_po.html' },
  { from: 185,  to: 197,  file: 'p1s2_185-197_po.html' },
  { from: 198,  to: 421,  file: 'p1s2c1_198-421_po.html' },
  { from: 422,  to: 682,  file: 'p1s2cap2_422-682_po.html' },
  { from: 683,  to: 1065, file: 'p1s2cap3_683-1065_po.html' },
  { from: 1066, to: 1134, file: 'p2s1cap1_1076-1134_po.html' },
  { from: 1135, to: 1209, file: 'p2s1cap2_1135-1209_po.html' },
  { from: 1210, to: 1419, file: 'p2s2cap1_1210-1419_po.html' },
  { from: 1420, to: 1532, file: 'p2s2cap1_1420-1532_po.html' },
  { from: 1533, to: 1666, file: 'p2s2cap3_1533-1666_po.html' },
  { from: 1667, to: 1690, file: 'p2s2cap4_1667-1690_po.html' },
  { from: 1691, to: 1698, file: 'p3-intr_1691-1698_po.html' },
  { from: 1699, to: 1876, file: 'p3s1cap1_1699-1876_po.html' },
  { from: 1877, to: 1948, file: 'p3s1cap2_1877-1948_po.html' },
  { from: 1949, to: 2051, file: 'p3s1cap3_1949-2051_po.html' },
  { from: 2052, to: 2082, file: 'p3s2-intr_2052-2082_po.html' },
  { from: 2083, to: 2195, file: 'p3s2cap1_2083-2195_po.html' },
  { from: 2196, to: 2557, file: 'p3s2cap2_2196-2557_po.html' },
  { from: 2558, to: 2565, file: 'p4-intr_2558-2565_po.html' },
  { from: 2566, to: 2649, file: 'p4s1cap1_2566-2649_po.html' },
  { from: 2650, to: 2696, file: 'p4s1cap2_2650-2696_po.html' },
  { from: 2697, to: 2758, file: 'p4s1cap3_2697-2758_po.html' },
  { from: 2759, to: 2865, file: 'p4s2_2759-2865_po.html' },
];

const MAX_ATTEMPTS = 6;
// Backoff em segundos: 30s, 2min, 8min, 30min, 60min, 60min (cap)
const BACKOFF_SECONDS = [30, 120, 480, 1800, 3600, 3600];

function fileFor(paragraph: number): string | null {
  const hit = FILES.find((r) => paragraph >= r.from && paragraph <= r.to);
  return hit ? hit.file : null;
}

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

function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractParagraph(html: string, n: number): string | null {
  const blocks = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  const startRe = new RegExp(`^\\s*(?:<[^>]+>\\s*)*<b>\\s*${n}\\s*\\.?\\s*<\\/b>`, 'i');
  const anyStartRe = /^\s*(?:<[^>]+>\s*)*<b>\s*\d+\s*\.?\s*<\/b>/i;

  let startIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (startRe.test(blocks[i])) { startIdx = i; break; }
  }
  if (startIdx < 0) return null;

  const parts: string[] = [];
  for (let i = startIdx; i < blocks.length; i++) {
    if (i > startIdx && anyStartRe.test(blocks[i])) break;
    const clean = stripTags(blocks[i]);
    if (i === startIdx) parts.push(clean.replace(new RegExp(`^${n}\\s*\\.?\\s*`), ''));
    else if (clean) parts.push(clean);
  }
  const out = parts.join('\n\n').trim();
  return out.length > 10 ? out : null;
}

const slugFor = (n: number) => `ccc-${n}`;

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
