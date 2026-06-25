/**
 * bible-auto-warm-slow
 *
 * Aquecimento seletivo automático:
 *  1. Sempre re-aquece capítulos prioritários (Lv + Pentateuco completo).
 *  2. Adiciona livros cuja média de `total_ms` nas últimas 24h supera o limiar.
 *  3. Chama `bible-text` com `force_revalidate:true` para cada capítulo,
 *     respeitando concorrência.
 *
 * Body opcional: { threshold_ms?: number, concurrency?: number, max_chapters_per_book?: number, dry_run?: boolean }
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALWAYS_PRIORITY: Record<string, number> = {
  // Lv primeiro, restante do Pentateuco em seguida
  Lv: 27, Gn: 50, Ex: 40, Nm: 36, Dt: 34, Js: 24,
};

// Espelha scripts/warm-bible-cache.ts para evitar caps fora do alcance.
const CHAPTERS: Record<string, number> = {
  Gn: 50, Ex: 40, Lv: 27, Nm: 36, Dt: 34, Js: 24, Jz: 21, Rt: 4,
  '1Sm': 31, '2Sm': 24, '1Rs': 22, '2Rs': 25, '1Cr': 29, '2Cr': 36,
  Ed: 10, Ne: 13, Et: 10, 'Jó': 42, Sl: 150, Pv: 31, Ec: 12, Ct: 8,
  Is: 66, Jr: 52, Lm: 5, Ez: 48, Dn: 14, Os: 14, Jl: 3, Am: 9, Ab: 1,
  Jn: 4, Mq: 7, Na: 3, Hc: 3, Sf: 3, Ag: 2, Zc: 14, Ml: 4,
  Mt: 28, Mc: 16, Lc: 24, Jo: 21, At: 28, Rm: 16, '1Co': 16, '2Co': 13,
  Gl: 6, Ef: 6, Fp: 4, Cl: 4, '1Ts': 5, '2Ts': 3, '1Tm': 6, '2Tm': 4,
  Tt: 3, Fm: 1, Hb: 13, Tg: 5, '1Pe': 5, '2Pe': 3, '1Jo': 5, '2Jo': 1, '3Jo': 1, Jd: 1, Ap: 22,
  Tb: 14, Jdt: 16, Sb: 19, Eclo: 51, Br: 6, '1Mc': 16, '2Mc': 15,
};

interface Body {
  threshold_ms?: number;
  concurrency?: number;
  max_chapters_per_book?: number;
  hours?: number;
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { /* default */ }
  const threshold = Math.max(100, body.threshold_ms ?? 800);
  const concurrency = Math.max(1, Math.min(8, body.concurrency ?? 3));
  const maxPerBook = Math.max(1, Math.min(50, body.max_chapters_per_book ?? 10));
  const hours = Math.max(1, Math.min(72, body.hours ?? 24));
  const dry = !!body.dry_run;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 1. Detect slow books in last `hours`
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from('bible_cache_metric_events')
    .select('abbrev, total_ms, status_code')
    .gte('created_at', since)
    .lt('status_code', 500)
    .not('total_ms', 'is', null);

  const stats = new Map<string, { sum: number; n: number }>();
  for (const e of events ?? []) {
    const s = stats.get(e.abbrev) ?? { sum: 0, n: 0 };
    s.sum += Number(e.total_ms); s.n++;
    stats.set(e.abbrev, s);
  }
  const slowBooks: string[] = [];
  for (const [abbr, s] of stats) {
    if (s.n >= 10 && s.sum / s.n > threshold) slowBooks.push(abbr);
  }

  // 2. Build task list (priority first, then slow books, dedup)
  const queue: Array<{ abbrev: string; chapter: number; reason: 'priority' | 'slow' }> = [];
  const seen = new Set<string>();
  const enqueue = (abbr: string, reason: 'priority' | 'slow') => {
    const total = CHAPTERS[abbr] ?? 0;
    const cap = Math.min(maxPerBook, total);
    for (let c = 1; c <= cap; c++) {
      const k = `${abbr}:${c}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ abbrev: abbr, chapter: c, reason });
    }
  };
  for (const abbr of Object.keys(ALWAYS_PRIORITY)) enqueue(abbr, 'priority');
  for (const abbr of slowBooks) enqueue(abbr, 'slow');

  const summary = {
    threshold_ms: threshold,
    hours,
    concurrency,
    max_chapters_per_book: maxPerBook,
    priority_books: Object.keys(ALWAYS_PRIORITY),
    slow_books: slowBooks,
    queued: queue.length,
    dry_run: dry,
  };

  if (dry) {
    return new Response(JSON.stringify({ ...summary, sample: queue.slice(0, 30) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // 3. Execute warm with concurrency
  const url = `${SUPABASE_URL}/functions/v1/bible-text`;
  const apikey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  let ok = 0, fail = 0, idx = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (idx < queue.length) {
      const task = queue[idx++];
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey, Authorization: `Bearer ${apikey}` },
          body: JSON.stringify({ abbrev: task.abbrev, chapter: task.chapter, force_revalidate: true }),
        });
        await r.text();
        if (r.ok) ok++; else fail++;
      } catch { fail++; }
    }
  }));

  return new Response(JSON.stringify({
    ...summary, executed: { ok, fail, ms: Date.now() - t0 },
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
