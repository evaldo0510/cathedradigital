/**
 * Seeder idempotente da Bíblia (66 livros protocanônicos via bolls.life NAA).
 *
 * Popula: public.bible_books, public.bible_chapters, public.bible_verses.
 *
 * Uso:
 *   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
 *   bunx tsx scripts/seed-bible.ts [--books=Gn,Ex,Mt] [--concurrency=2] \
 *                                  [--max-retries=5] [--dry-run]
 *
 * Garante:
 *  - Upsert por chave natural (abbrev, (book_id,number), (chapter_id,number))
 *  - Backoff exponencial com jitter (429/5xx/erros de rede)
 *  - Concurrency configurável para respeitar rate-limit do bolls.life
 *  - Progresso por capítulo + resumo final
 *  - --dry-run: simula sem gravar
 */

import { createClient } from '@supabase/supabase-js';
import { BIBLE_CANON } from '../src/lib/bibleCanon';

interface BollsVerse { verse: number; text: string; comment?: string | null }

interface CliArgs {
  books?: string[];
  concurrency: number;
  maxRetries: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const get = (k: string) => argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
  const books = get('books')?.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    books: books?.length ? books : undefined,
    concurrency: Math.max(1, Math.min(4, Number(get('concurrency') ?? 2))),
    maxRetries: Math.max(1, Math.min(8, Number(get('max-retries') ?? 5))),
    dryRun: argv.includes('--dry-run'),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch com retry exponencial; respeita Retry-After quando presente. */
async function fetchWithRetry(url: string, maxRetries: number): Promise<Response> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get('retry-after')) || 0;
        if (attempt >= maxRetries) throw new Error(`HTTP ${res.status} após ${attempt} tentativas (${url})`);
        const base = Math.min(8000, 400 * 2 ** attempt);
        const wait = Math.max(retryAfter * 1000, base) + Math.floor(Math.random() * 250);
        console.warn(`[seed-bible] ${res.status} ${url} — aguardando ${wait}ms (tentativa ${attempt + 1}/${maxRetries})`);
        await sleep(wait);
        attempt++;
        continue;
      }
      throw new Error(`HTTP ${res.status} em ${url}`);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      const wait = Math.min(8000, 400 * 2 ** attempt) + Math.floor(Math.random() * 250);
      console.warn(`[seed-bible] erro de rede ${(err as Error).message} — retry em ${wait}ms (${attempt + 1}/${maxRetries})`);
      await sleep(wait);
      attempt++;
    }
  }
}

async function fetchChapterCount(bollsId: number, maxRetries: number): Promise<number> {
  // bolls.life: /get-books/NAA/ retorna metadados com `chronorder` e `chapters`.
  // Como alternativa estável, descobrimos por probe: pedir capítulos crescentes até 404.
  // Para evitar O(N²) requests por chamada, usamos a rota /get-text/ que devolve até onde existe.
  // Aqui assumimos máximo razoável (150) e paramos no primeiro vazio.
  let last = 0;
  for (let n = 1; n <= 200; n++) {
    const res = await fetchWithRetry(`https://bolls.life/get-chapter/NAA/${bollsId}/${n}/`, maxRetries);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    last = n;
  }
  return last;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const targets = BIBLE_CANON
    .filter((b) => !b.deuterocanonical) // 66 protocanônicos
    .filter((b) => !args.books || args.books.includes(b.abbr));

  console.log(`[seed-bible] alvos=${targets.length} concurrency=${args.concurrency} dryRun=${args.dryRun}`);

  const stats = { books: 0, chapters: 0, verses: 0, errors: [] as string[] };

  // Worker pool simples
  const queue = [...targets];
  await Promise.all(
    Array.from({ length: args.concurrency }, async () => {
      while (queue.length) {
        const book = queue.shift();
        if (!book) break;
        try {
          await seedBook(book, supabase, args, stats);
        } catch (e: any) {
          const msg = `${book.abbr}: ${e?.message || e}`;
          console.error(`[seed-bible] FALHA livro ${msg}`);
          stats.errors.push(msg);
        }
      }
    })
  );

  console.log('\n[seed-bible] resumo');
  console.log(`  livros tocados: ${stats.books}`);
  console.log(`  capítulos:      ${stats.chapters}`);
  console.log(`  versículos:     ${stats.verses}`);
  console.log(`  erros:          ${stats.errors.length}`);
  if (stats.errors.length) {
    console.log('  detalhes:');
    stats.errors.slice(0, 10).forEach((e) => console.log('   - ' + e));
  }
  process.exit(stats.errors.length ? 1 : 0);
}

async function seedBook(
  book: typeof BIBLE_CANON[number],
  supabase: ReturnType<typeof createClient>,
  args: CliArgs,
  stats: { books: number; chapters: number; verses: number; errors: string[] },
) {
  console.log(`[seed-bible] ${book.abbr} (${book.name}) — descobrindo capítulos…`);
  const chapterCount = await fetchChapterCount(book.bollsId, args.maxRetries);
  console.log(`[seed-bible] ${book.abbr}: ${chapterCount} capítulos`);

  if (args.dryRun) {
    stats.books++;
    stats.chapters += chapterCount;
    return;
  }

  // 1. Upsert do livro
  const { data: bookRow, error: bookErr } = await supabase
    .from('bible_books')
    .upsert({ abbrev: book.abbr, name: book.name }, { onConflict: 'abbrev' })
    .select('id')
    .single();
  if (bookErr || !bookRow) throw new Error(`upsert bible_books: ${bookErr?.message}`);
  stats.books++;

  for (let n = 1; n <= chapterCount; n++) {
    const res = await fetchWithRetry(`https://bolls.life/get-chapter/NAA/${book.bollsId}/${n}/`, args.maxRetries);
    const verses = (await res.json()) as BollsVerse[];
    if (!Array.isArray(verses) || verses.length === 0) continue;

    const { data: chRow, error: chErr } = await supabase
      .from('bible_chapters')
      .upsert({ book_id: bookRow.id, number: n }, { onConflict: 'book_id,number' })
      .select('id')
      .single();
    if (chErr || !chRow) throw new Error(`upsert bible_chapters ${book.abbr} ${n}: ${chErr?.message}`);
    stats.chapters++;

    const rows = verses.map((v) => ({
      chapter_id: chRow.id,
      number: v.verse,
      text: String(v.text || '').replace(/<[^>]+>/g, '').trim(),
    }));

    // Paginação para não estourar limites do PostgREST (200/lote).
    for (let i = 0; i < rows.length; i += 200) {
      const slice = rows.slice(i, i + 200);
      const { error } = await supabase
        .from('bible_verses')
        .upsert(slice, { onConflict: 'chapter_id,number' });
      if (error) throw new Error(`upsert bible_verses ${book.abbr} ${n}: ${error.message}`);
    }
    stats.verses += rows.length;
    if (n % 5 === 0 || n === chapterCount) {
      console.log(`[seed-bible] ${book.abbr} ${n}/${chapterCount}`);
    }
  }
}

main().catch((err) => {
  console.error('[seed-bible] erro fatal:', err);
  process.exit(1);
});
