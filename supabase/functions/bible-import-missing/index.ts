/**
 * bible-import-missing — Importa em segundo plano os livros/capítulos
 * faltantes do cânon a partir da API pública bolls.life.
 *
 * Ações:
 *   POST { action: 'validate', translation }                    → valida fonte (sem gravar)
 *   POST { action: 'dry_run',  translation, selection? }        → simula import
 *   POST { action: 'preview',  translation, selection? }        → conta pendências (leve)
 *   POST { action: 'start', translation, retry_of?, selection?} → cria job e roda em background
 *   POST { action: 'list_jobs', limit? }                        → lista histórico
 *   GET  ?action=status&job_id=…                                → consulta progresso
 *
 *   selection: Array<{ abbrev: string, chapters?: number[] }> — filtra o plano
 *              (omitido = tudo faltante). chapters omitido = livro inteiro.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { BIBLE_CANON } from '../_shared/bibleCanon.ts';
import { normalizeTranslation, normalizeSelection, type Selection } from './helpers.ts';
import { BIBLE_CANON } from '../_shared/bibleCanon.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const BOLLS_BASE = 'https://bolls.life';
const CHAPTER_CONCURRENCY = 8;
// Skip livros que dependem de deuterocanônicos ou têm cânon próprio católico
// (Salmos vai até 151, Daniel até 14) — mantidos pelo import-deutero.
const SKIP_ABBRS = new Set(['Sl', 'Dn']);

type Admin = ReturnType<typeof createClient>;

interface BollsBook { bookid: number; chapters: number; name?: string }
interface BollsVerse { verse: number; text: string; pk?: number }

// Validação de entrada — evita HTTP fetch com valor sujo
const TRANSLATION_RE = /^[A-Z0-9]{2,10}$/;

function normalizeTranslation(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim().toUpperCase() : '';
  if (!TRANSLATION_RE.test(raw)) {
    throw new Error(`Código de tradução inválido: "${input}". Use letras/dígitos maiúsculos (ex.: NVIPT, NAA, ARA).`);
  }
  return raw;
}


async function fetchBollsBooks(translation: string): Promise<Map<number, BollsBook>> {
  const res = await fetch(`${BOLLS_BASE}/get-books/${translation}/`);
  if (!res.ok) throw new Error(`bolls get-books ${translation}: HTTP ${res.status}`);
  const list = (await res.json()) as BollsBook[];
  return new Map(list.map((b) => [b.bookid, b]));
}

async function fetchBollsChapter(translation: string, bookId: number, chapter: number): Promise<BollsVerse[]> {
  const res = await fetch(`${BOLLS_BASE}/get-chapter/${translation}/${bookId}/${chapter}/`);
  if (!res.ok) throw new Error(`bolls get-chapter ${translation}/${bookId}/${chapter}: HTTP ${res.status}`);
  return (await res.json()) as BollsVerse[];
}

async function ensureTranslation(admin: Admin, translation: string): Promise<string> {
  const code = `bolls-${translation.toLowerCase()}`;
  const { data: existing } = await admin
    .from('bible_translation_sources').select('id').eq('code', code).maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await admin
    .from('bible_translation_sources')
    .insert({
      code,
      name: `bolls.life ${translation}`,
      language: 'pt-BR',
      translation,
      license: 'Uso não-comercial via bolls.life',
      attribution: 'bolls.life',
      source_url: `${BOLLS_BASE}/get-books/${translation}/`,
      provider: 'bolls.life',
      status: 'ready',
      metadata: { imported_by: 'bible-import-missing' },
    })
    .select('id').single();
  if (error) throw new Error(`translation upsert: ${error.message}`);
  return data.id as string;
}

type Selection = Array<{ abbrev: string; chapters?: number[] }>;

function normalizeSelection(input: unknown): Selection | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const out: Selection = [];
  for (const it of input) {
    if (!it || typeof it !== 'object') continue;
    const abbrev = String((it as any).abbrev ?? '').trim();
    if (!abbrev) continue;
    const rawCh = (it as any).chapters;
    let chapters: number[] | undefined;
    if (Array.isArray(rawCh)) {
      chapters = rawCh.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0);
      if (chapters.length === 0) chapters = undefined;
    }
    out.push({ abbrev, chapters });
  }
  return out.length > 0 ? out : null;
}

async function computeMissing(admin: Admin, translation: string, selection: Selection | null = null) {
  const bolls = await fetchBollsBooks(translation);
  const { data: books } = await admin.from('bible_books').select('id, abbrev, chapters_count');
  const bookByAbbrev = new Map((books ?? []).map((b: any) => [b.abbrev, b]));

  const { data: chapters } = await admin.from('bible_chapters').select('book_id, number');
  const chaptersByBook = new Map<string, Set<number>>();
  for (const c of chapters ?? []) {
    const set = chaptersByBook.get(c.book_id as string) ?? new Set<number>();
    set.add(c.number as number);
    chaptersByBook.set(c.book_id as string, set);
  }

  const selMap = selection
    ? new Map(selection.map((s) => [s.abbrev, s.chapters ? new Set(s.chapters) : null]))
    : null;

  const plan: Array<{ canon: typeof BIBLE_CANON[number]; bookId: number; chapters: number[] }> = [];
  for (const canon of BIBLE_CANON) {
    if (canon.deuterocanonical) continue;
    if (SKIP_ABBRS.has(canon.abbr)) continue;
    if (selMap && !selMap.has(canon.abbr)) continue;
    const bolls_ = bolls.get(canon.bollsId);
    if (!bolls_) continue;
    const existing = bookByAbbrev.get(canon.abbr) as any;
    const existingChapters = existing ? (chaptersByBook.get(existing.id) ?? new Set<number>()) : new Set<number>();
    const wanted = selMap?.get(canon.abbr) ?? null; // Set<number> | null
    const missing: number[] = [];
    for (let n = 1; n <= bolls_.chapters; n++) {
      if (wanted && !wanted.has(n)) continue;
      if (!existingChapters.has(n)) missing.push(n);
    }
    if (missing.length > 0) plan.push({ canon, bookId: canon.bollsId, chapters: missing });
  }
  return plan;
}

/**
 * Valida se a tradução informada existe em bolls.life e cobre os livros
 * protocanônicos esperados por BIBLE_CANON. Não grava nada.
 */
async function validateSource(translation: string) {
  const issues: Array<{ level: 'error' | 'warning'; code: string; message: string }> = [];
  let bolls: Map<number, BollsBook>;
  try {
    bolls = await fetchBollsBooks(translation);
  } catch (e) {
    return {
      ok: false,
      translation,
      reachable: false,
      issues: [{ level: 'error' as const, code: 'source_unreachable', message: (e as Error).message }],
    };
  }

  const expected = BIBLE_CANON.filter((c) => !c.deuterocanonical && !SKIP_ABBRS.has(c.abbr));
  const mapping: Array<{ abbrev: string; name: string; bollsId: number; found: boolean; chapters_bolls: number | null }> = [];
  for (const canon of expected) {
    const b = bolls.get(canon.bollsId);
    if (!b) {
      issues.push({ level: 'error', code: 'missing_book', message: `Livro ${canon.abbr} (bollsId ${canon.bollsId}) não existe em ${translation}` });
    }
    mapping.push({ abbrev: canon.abbr, name: canon.name, bollsId: canon.bollsId, found: !!b, chapters_bolls: b?.chapters ?? null });
  }

  // Deutero: informa se a tradução escolhida não cobre (esperado para NVIPT/NAA/etc.)
  const deuteroFound = BIBLE_CANON.filter((c) => c.deuterocanonical && bolls.get(c.bollsId));
  if (deuteroFound.length === 0) {
    issues.push({
      level: 'warning',
      code: 'no_deuterocanonical',
      message: `${translation} não expõe livros deuterocanônicos — mantidos por bible-import-deutero.`,
    });
  }

  const errors = issues.filter((i) => i.level === 'error').length;
  return {
    ok: errors === 0,
    translation,
    reachable: true,
    bolls_books_total: bolls.size,
    expected_books: expected.length,
    covered_books: mapping.filter((m) => m.found).length,
    issues,
    mapping,
  };
}

/**
 * Dry-run: para cada livro faltante, baixa 1 capítulo (o primeiro que falta)
 * de bolls como prova de disponibilidade e mostra sample. Nada é gravado.
 */
async function dryRun(admin: Admin, translation: string, selection: Selection | null = null) {
  const plan = await computeMissing(admin, translation, selection);
  const samples: Array<{
    abbrev: string; name: string; chapters_missing: number; chapter_numbers: number[];
    sample_chapter: number; sample_verses: number; first_verse: string | null; error?: string;
  }> = [];
  for (const item of plan) {
    const cap = item.chapters[0];
    try {
      const verses = await fetchBollsChapter(translation, item.bookId, cap);
      samples.push({
        abbrev: item.canon.abbr, name: item.canon.name,
        chapters_missing: item.chapters.length, chapter_numbers: item.chapters,
        sample_chapter: cap,
        sample_verses: verses.length, first_verse: verses[0]?.text ?? null,
      });
    } catch (e) {
      samples.push({
        abbrev: item.canon.abbr, name: item.canon.name,
        chapters_missing: item.chapters.length, chapter_numbers: item.chapters,
        sample_chapter: cap,
        sample_verses: 0, first_verse: null, error: (e as Error).message,
      });
    }
  }
  const chapters_missing_total = plan.reduce((s, p) => s + p.chapters.length, 0);
  return {
    dry_run: true, translation,
    books_missing: plan.length,
    chapters_missing_total,
    samples,
    would_write: {
      new_books: plan.filter((p) => samples.find((s) => s.abbrev === p.canon.abbr))?.length ?? 0,
      new_chapters: chapters_missing_total,
    },
  };
}


async function runCanonDiagnose(): Promise<any> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/bible-canon-diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'x-cron-secret': Deno.env.get('CRON_SECRET') ?? '',
      },
      body: JSON.stringify({ action: 'run' }),
    });
    const body = await res.json().catch(() => ({}));
    return { ran: true, ok: res.ok, run_id: body?.run_id ?? null, status: body?.status ?? null, total_findings: body?.total_findings ?? null, at: new Date().toISOString() };
  } catch (e) {
    return { ran: false, error: String((e as any)?.message || e), at: new Date().toISOString() };
  }
}

/**
 * Agenda uma segunda revalidação após um delay (default 3min) para pegar
 * eventual propagação de cache/materialized views. Faz merge em verification.
 */
async function scheduleRevalidation(admin: Admin, jobId: string, delayMs = 180_000) {
  await new Promise((r) => setTimeout(r, delayMs));
  const diag = await runCanonDiagnose();
  const { data: gate } = await admin.rpc('bible_read_gate_status').catch(() => ({ data: null }));
  const { data: current } = await admin.from('bible_import_jobs').select('verification').eq('id', jobId).maybeSingle();
  const merged = {
    ...(current?.verification ?? {}),
    revalidation_retry: { ...diag, gate },
  };
  await admin.from('bible_import_jobs').update({ verification: merged }).eq('id', jobId);
}

async function runImport(admin: Admin, jobId: string, sourceId: string, translation: string, selection: Selection | null = null) {
  const started = new Date().toISOString();
  await admin.from('bible_import_jobs').update({
    status: 'running', started_at: started, message: 'Coletando plano de importação…',
  }).eq('id', jobId);

  try {
    const plan = await computeMissing(admin, translation, selection);
    const totalChapters = plan.reduce((s, p) => s + p.chapters.length, 0);
    await admin.from('bible_import_jobs').update({
      total: totalChapters,
      message: `${plan.length} livros a completar, ${totalChapters} capítulos a baixar`,
    }).eq('id', jobId);

    let done = 0;
    const auditLog: any[] = [];

    for (const item of plan) {
      const { canon, bookId, chapters } = item;
      const stepStarted = Date.now();
      // 1. book
      let { data: book } = await admin.from('bible_books').select('id').eq('abbrev', canon.abbr).maybeSingle();
      if (!book) {
        const ins = await admin.from('bible_books').insert({
          abbrev: canon.abbr,
          name: canon.name,
          testament: canon.testament === 'OT' ? 'antigo' : 'novo',
          canonical_type: 'protocanonico',
          chapters_count: chapters.length,
        }).select('id').single();
        if (ins.error) throw new Error(`book ${canon.abbr}: ${ins.error.message}`);
        book = ins.data;
      }
      await admin.from('bible_import_jobs').update({
        current_book: `${canon.abbr} — ${canon.name}`,
        message: `Baixando ${canon.name} (${chapters.length} caps)`,
      }).eq('id', jobId);

      // 2. chapters em paralelo controlado
      let bookVerses = 0;
      let chaptersWritten = 0;
      for (let i = 0; i < chapters.length; i += CHAPTER_CONCURRENCY) {
        const batch = chapters.slice(i, i + CHAPTER_CONCURRENCY);
        const results = await Promise.all(batch.map(async (n) => {
          const verses = await fetchBollsChapter(translation, bookId, n);
          return { n, verses };
        }));
        for (const { n, verses } of results) {
          const chUp = await admin.from('bible_chapters')
            .upsert({ book_id: book!.id, number: n }, { onConflict: 'book_id,number' })
            .select('id').single();
          if (chUp.error) throw new Error(`chapter ${canon.abbr} ${n}: ${chUp.error.message}`);
          const rows = verses.map((v) => ({
            chapter_id: chUp.data.id, number: v.verse, text: v.text, translation_id: sourceId,
          }));
          if (rows.length > 0) {
            const vUp = await admin.from('bible_verses')
              .upsert(rows, { onConflict: 'chapter_id,translation_id,number' });
            if (vUp.error) throw new Error(`verses ${canon.abbr} ${n}: ${vUp.error.message}`);
            bookVerses += rows.length;
            chaptersWritten++;
          }
          done++;
        }
        await admin.from('bible_import_jobs').update({ progress: done }).eq('id', jobId);
      }
      auditLog.push({
        abbrev: canon.abbr, name: canon.name,
        chapters: chapters.length, chapters_written: chaptersWritten,
        verses: bookVerses, duration_ms: Date.now() - stepStarted,
        at: new Date().toISOString(),
      });
    }

    // 3. Revalidação imediata
    await admin.from('bible_import_jobs').update({
      message: 'Import concluído. Revalidando cânon…',
    }).eq('id', jobId);

    const immediate = await runCanonDiagnose();
    const { data: gate } = await admin.rpc('bible_read_gate_status').catch(() => ({ data: null }));
    const verification = { ...immediate, gate, revalidation_retry: { pending: true, scheduled_in_ms: 180_000 } };

    await admin.from('bible_import_jobs').update({
      status: 'succeeded',
      finished_at: new Date().toISOString(),
      progress: totalChapters,
      message: `Concluído: ${plan.length} livros, ${totalChapters} capítulos`,
      current_book: null,
      verification,
      audit_log: auditLog,
    }).eq('id', jobId);

    // 4. Retry de revalidação em 3min (background, não bloqueia)
    // @ts-ignore EdgeRuntime é fornecido pelo runtime Deno Deploy
    EdgeRuntime.waitUntil(scheduleRevalidation(admin, jobId, 180_000));
  } catch (e) {
    await admin.from('bible_import_jobs').update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: String((e as any)?.message || e),
    }).eq('id', jobId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    // Auth admin (exceto internamente via service key)
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) return json({ error: 'invalid_token' }, 401);
    const userId = claims.claims.sub as string;
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return json({ error: 'forbidden', message: 'Apenas administradores podem operar a importação da Bíblia.' }, 403);
    }

    const url = new URL(req.url);
    const rawParams: any = req.method === 'POST' ? (await req.json().catch(() => ({}))) : Object.fromEntries(url.searchParams);
    const action = rawParams.action ?? (req.method === 'POST' ? 'start' : 'status');

    // Ações que precisam de tradução válida
    let translation = 'NVIPT';
    if (['validate', 'dry_run', 'preview', 'start'].includes(action)) {
      try {
        translation = normalizeTranslation(rawParams.translation ?? 'NVIPT');
      } catch (e) {
        return json({ error: 'invalid_translation', message: (e as Error).message }, 400);
      }
    }

    if (action === 'validate') {
      const result = await validateSource(translation);
      return json(result, result.ok ? 200 : 422);
    }

    const selection = normalizeSelection(rawParams.selection);

    if (action === 'dry_run') {
      const result = await dryRun(admin, translation, selection);
      return json({ ...result, selection_applied: !!selection });
    }

    if (action === 'preview') {
      const plan = await computeMissing(admin, translation, selection);
      return json({
        translation,
        books_missing: plan.length,
        chapters_missing: plan.reduce((s, p) => s + p.chapters.length, 0),
        detail: plan.map((p) => ({ abbrev: p.canon.abbr, name: p.canon.name, chapters: p.chapters.length, chapter_numbers: p.chapters })),
        selection_applied: !!selection,
      });
    }

    if (action === 'status') {
      const jobId = rawParams.job_id as string;
      if (!jobId) return json({ error: 'missing_job_id' }, 400);
      const { data, error } = await admin.from('bible_import_jobs').select('*').eq('id', jobId).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ job: data });
    }

    if (action === 'list_jobs') {
      const limit = Math.min(Math.max(1, Number(rawParams.limit) || 30), 200);
      const { data, error } = await admin
        .from('bible_import_jobs')
        .select('id, source_id, status, progress, total, current_book, message, error, started_at, finished_at, created_at, created_by, verification, audit_log, bible_translation_sources(code, translation)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return json({ error: error.message }, 500);
      const jobs = (data ?? []).map((j: any) => ({
        ...j,
        source_code: j?.bible_translation_sources?.code ?? null,
        translation: j?.bible_translation_sources?.translation ?? null,
      }));
      return json({ jobs });
    }

    if (action === 'start') {
      // retry_of: reusa a tradução do job original (idempotente — recalcula pendências).
      let retryOf: string | null = null;
      if (rawParams.retry_of) {
        const { data: prev, error: prevErr } = await admin
          .from('bible_import_jobs')
          .select('id, status, source_id, bible_translation_sources(code, translation)')
          .eq('id', rawParams.retry_of).maybeSingle();
        if (prevErr || !prev) return json({ error: 'retry_source_not_found' }, 404);
        retryOf = prev.id as string;
        const originalTranslation = (prev as any)?.bible_translation_sources?.translation;
        if (originalTranslation) translation = normalizeTranslation(originalTranslation);
      }

      // Validação prévia obrigatória para não gastar background com fonte quebrada
      const validation = await validateSource(translation);
      if (!validation.ok) {
        return json({
          error: 'validation_failed',
          message: 'A fonte informada não é válida — corrija os erros e tente novamente.',
          validation,
        }, 422);
      }

      const sourceId = await ensureTranslation(admin, translation);
      const initialAudit: any[] = [];
      if (retryOf) initialAudit.push({ event: 'retry_of', job_id: retryOf, at: new Date().toISOString() });
      if (selection) initialAudit.push({ event: 'selection', selection, at: new Date().toISOString() });
      const { data: job, error } = await admin.from('bible_import_jobs').insert({
        source_id: sourceId,
        status: 'queued',
        created_by: userId,
        message: retryOf
          ? `Reexecução do job ${retryOf.slice(0, 8)}`
          : selection ? `Seleção manual: ${selection.length} livros` : 'Aguardando início…',
        audit_log: initialAudit,
      }).select('id').single();
      if (error) return json({ error: error.message }, 500);

      // @ts-ignore EdgeRuntime é fornecido pelo runtime Deno Deploy
      EdgeRuntime.waitUntil(runImport(admin, job.id, sourceId, translation, selection));
      return json({ ok: true, job_id: job.id, retry_of: retryOf, selection_applied: !!selection });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
