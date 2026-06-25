// Importa capítulos deuterocanônicos faltantes (Tb 14, Jdt 16, Dn 13-14, Sl 151)
// raspando bibliacatolica.com.br (edição Ave-Maria) e fazendo upsert idempotente
// nas tabelas bible_books / bible_chapters / bible_verses.
//
// Invocação: POST /functions/v1/bible-import-deutero
//   Body opcional: { targets?: [{abbrev, chapter}], dryRun?: boolean }
//   Default: Tb 14, Jdt 16, Dn 13, Dn 14, Sl 151
//
// Idempotente: usa onConflict (book_id, number) em chapters e (chapter_id, number)
// em verses.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_TARGETS = [
  { abbrev: 'Tb', chapter: 14, name: 'Tobias', testament: 'antigo', slug: 'tobias', chaptersCount: 14 },
  { abbrev: 'Jdt', chapter: 16, name: 'Judite', testament: 'antigo', slug: 'judite', chaptersCount: 16 },
  { abbrev: 'Dn', chapter: 13, name: 'Daniel', testament: 'antigo', slug: 'daniel', chaptersCount: 14 },
  { abbrev: 'Dn', chapter: 14, name: 'Daniel', testament: 'antigo', slug: 'daniel', chaptersCount: 14 },
  { abbrev: 'Sl', chapter: 151, name: 'Salmos', testament: 'antigo', slug: 'salmos', chaptersCount: 151 },
];

async function scrape(slug: string, chapter: number): Promise<{ number: number; text: string }[]> {
  const url = `https://www.bibliacatolica.com.br/biblia-ave-maria/${slug}/${chapter}/`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CathedraImport/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const verses: { number: number; text: string }[] = [];
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
    if (n && text && text.length > 3) verses.push({ number: n, text });
  }
  return verses;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(url, key);

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const targets = Array.isArray(body?.targets) && body.targets.length
    ? body.targets.map((t: any) => ({
        ...DEFAULT_TARGETS.find((d) => d.abbrev === t.abbrev) ?? {},
        ...t,
      }))
    : DEFAULT_TARGETS;
  const dryRun = !!body?.dryRun;

  const results: any[] = [];

  for (const t of targets) {
    const entry: any = { abbrev: t.abbrev, chapter: t.chapter };
    try {
      const verses = await scrape(t.slug, t.chapter);
      entry.scraped = verses.length;
      if (verses.length === 0) {
        entry.status = 'no_content';
        results.push(entry);
        continue;
      }
      if (dryRun) {
        entry.status = 'dry';
        entry.sample = verses.slice(0, 2);
        results.push(entry);
        continue;
      }

      // 1. book
      let { data: book } = await supabase
        .from('bible_books').select('id').eq('abbrev', t.abbrev).maybeSingle();
      if (!book) {
        const ins = await supabase
          .from('bible_books')
          .insert({ abbrev: t.abbrev, name: t.name, testament: t.testament, chapters_count: t.chaptersCount ?? t.chapter })
          .select('id').single();
        if (ins.error) throw new Error(`book insert: ${ins.error.message}`);
        book = ins.data;
      }

      // 2. chapter
      const chUp = await supabase
        .from('bible_chapters')
        .upsert({ book_id: book!.id, number: t.chapter }, { onConflict: 'book_id,number' })
        .select('id').single();
      if (chUp.error) throw new Error(`chapter upsert: ${chUp.error.message}`);

      // 3. verses
      const rows = verses.map((v) => ({
        chapter_id: chUp.data.id, number: v.number, text: v.text,
      }));
      const vUp = await supabase
        .from('bible_verses')
        .upsert(rows, { onConflict: 'chapter_id,number' });
      if (vUp.error) throw new Error(`verses upsert: ${vUp.error.message}`);

      entry.status = 'imported';
      entry.verses = rows.length;
      entry.source = 'bibliacatolica.com.br/ave-maria';
      entry.imported_at = new Date().toISOString();
    } catch (e) {
      entry.status = 'error';
      entry.error = String((e as any)?.message || e);
    }
    results.push(entry);
  }

  const imported = results.filter((r) => r.status === 'imported').length;
  return new Response(
    JSON.stringify({ ok: true, imported, total: results.length, results }, null, 2),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
