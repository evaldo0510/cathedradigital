/**
 * Importa capítulos bíblicos de um dump JSON (edição católica PT) para o banco,
 * cobrindo lacunas que a fonte pública não entrega (Tobias 14, Judite 16,
 * Daniel 13-14, Salmo 151, etc.).
 *
 * Formato esperado do dump (JSON):
 *   [
 *     {
 *       "book_abbr": "Tb",         // abreviação canônica de @/lib/bibleCanon
 *       "book_name": "Tobias",
 *       "chapter": 14,
 *       "verses": [
 *         { "number": 1, "text": "..." },
 *         { "number": 2, "text": "..." }
 *       ]
 *     }
 *   ]
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read \
 *     scripts/import-bible-dump.ts ./dump-catolica.json
 *
 * Requer no env: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Idempotente: usa upsert em bible_chapters/bible_verses por (book_id, number).
 */
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { findBookByAbbr } from '../supabase/functions/_shared/bibleCanon.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  Deno.exit(2);
}

const filePath = Deno.args[0];
if (!filePath) {
  console.error('Usage: deno run ... scripts/import-bible-dump.ts <dump.json>');
  Deno.exit(2);
}

type DumpVerse = { number: number; text: string };
type DumpChapter = { book_abbr: string; book_name?: string; chapter: number; verses: DumpVerse[] };

const raw = await Deno.readTextFile(filePath);
const dump: DumpChapter[] = JSON.parse(raw);
if (!Array.isArray(dump)) {
  console.error('Dump root must be an array.');
  Deno.exit(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

let okChapters = 0;
let okVerses = 0;
let failed = 0;

for (const entry of dump) {
  const canon = findBookByAbbr(entry.book_abbr);
  if (!canon) {
    console.warn(`  ✗ Abbr desconhecida: ${entry.book_abbr} — skip`);
    failed++;
    continue;
  }

  // 1) Garantir bible_books
  const { data: existingBook } = await supabase
    .from('bible_books')
    .select('id')
    .eq('abbrev', canon.abbr)
    .maybeSingle();

  let bookId = existingBook?.id;
  if (!bookId) {
    const { data: newBook, error: bookErr } = await supabase
      .from('bible_books')
      .insert({
        abbrev: canon.abbr,
        name: entry.book_name || canon.name,
        testament: canon.testament,
      })
      .select('id')
      .single();
    if (bookErr || !newBook) {
      console.warn(`  ✗ ${canon.abbr}: falha ao criar livro — ${bookErr?.message}`);
      failed++;
      continue;
    }
    bookId = newBook.id;
  }

  // 2) Upsert bible_chapters
  const { data: chRow, error: chErr } = await supabase
    .from('bible_chapters')
    .upsert({ book_id: bookId, number: entry.chapter }, { onConflict: 'book_id,number' })
    .select('id')
    .single();
  if (chErr || !chRow) {
    console.warn(`  ✗ ${canon.abbr} ${entry.chapter}: falha ao criar capítulo — ${chErr?.message}`);
    failed++;
    continue;
  }

  // 3) Upsert bible_verses
  const rows = entry.verses.map((v) => ({
    chapter_id: chRow.id,
    number: v.number,
    text: v.text,
  }));
  const { error: vErr } = await supabase
    .from('bible_verses')
    .upsert(rows, { onConflict: 'chapter_id,number' });
  if (vErr) {
    console.warn(`  ✗ ${canon.abbr} ${entry.chapter}: falha ao inserir versículos — ${vErr.message}`);
    failed++;
    continue;
  }

  okChapters++;
  okVerses += rows.length;
  console.log(`  ✓ ${canon.abbr} ${entry.chapter} — ${rows.length} versículos`);
}

console.log(`\n[import] DONE chapters=${okChapters} verses=${okVerses} failed=${failed}`);
Deno.exit(failed > 0 ? 1 : 0);
