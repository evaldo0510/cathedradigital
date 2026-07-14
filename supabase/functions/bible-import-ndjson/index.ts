/**
 * Importa uma tradução bíblica completa a partir de um arquivo NDJSON canônico
 * (uma linha JSON por versículo) hospedado no storage privado `bible-dumps`
 * ou em URL HTTPS externa.
 *
 * Schema esperado de cada linha:
 *   { "abbr": "Gn", "chapter": 1, "verse": 1, "text": "No princípio..." }
 *
 * - `abbr` é resolvido contra `BIBLE_CANON` (aceita aliases).
 * - Upsert idempotente em bible_books / bible_chapters / bible_verses.
 * - Atualiza `bible_import_jobs.progress` por livro processado.
 * - Atualiza `bible_translation_sources` com contagens e status.
 * - Dispara `runPostRunVerify` ao final (gate de cobertura dos 73 livros).
 *
 * Autenticação: exige sessão de admin via JWT do chamador.
 * Acesso ao storage e às tabelas é feito com `service_role`.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { BIBLE_CANON, normalizeAbbr } from "../_shared/bibleCanon.ts";
import { runPostRunVerify } from "../_shared/postRunVerify.ts";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VERSE_BATCH = 500;
const MAX_LINE_BYTES = 64 * 1024;

interface ImportRequest {
  source_id: string;
  file_path?: string; // path dentro do bucket bible-dumps
  file_url?: string;  // URL HTTPS alternativa
  skip_verify?: boolean;
}

interface VerseRow { abbr: string; chapter: number; verse: number; text: string }

const CANON_BY_ABBR = (() => {
  const map = new Map<string, typeof BIBLE_CANON[number]>();
  for (const b of BIBLE_CANON) map.set(b.abbr, b);
  return map;
})();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseLine(raw: string, lineNo: number): VerseRow | { error: string } {
  if (raw.length > MAX_LINE_BYTES) return { error: `line ${lineNo}: exceeds ${MAX_LINE_BYTES} bytes` };
  let obj: Record<string, unknown>;
  try { obj = JSON.parse(raw) as Record<string, unknown>; }
  catch (e) { return { error: `line ${lineNo}: invalid JSON (${(e as Error).message})` }; }
  const abbrRaw = typeof obj.abbr === "string" ? obj.abbr : "";
  const abbr = normalizeAbbr(abbrRaw);
  const chapter = Number(obj.chapter);
  const verse = Number(obj.verse);
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  if (!abbr || !CANON_BY_ABBR.has(abbr)) return { error: `line ${lineNo}: unknown abbr "${abbrRaw}"` };
  if (!Number.isInteger(chapter) || chapter < 1) return { error: `line ${lineNo}: invalid chapter` };
  if (!Number.isInteger(verse) || verse < 1) return { error: `line ${lineNo}: invalid verse` };
  if (!text) return { error: `line ${lineNo}: empty text` };
  return { abbr, chapter, verse, text };
}

async function* streamLines(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, "");
      buf = buf.slice(idx + 1);
      if (line.trim()) yield line;
    }
  }
  if (buf.trim()) yield buf;
}

Deno.serve(async (req) => {
  // Sprint A / CAT-001 CID + CAT-002 Wave 4b envelope estrito
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const R = makeResponder(cid);
  // Shadow helper `jsonResponse` para respostas de SUCESSO com CID no header
  const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { ...corsHeaders, ...cidH, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return R.cors();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Authn/Authz — exige admin
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return R.error(401, "unauthorized");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return R.error(401, "unauthorized");
  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_current_user_admin");
  if (adminErr || !isAdmin) return R.error(403, "forbidden");

  // 2) Body
  let body: ImportRequest;
  try { body = await req.json() as ImportRequest; }
  catch { return R.error(400, "invalid_body", { detail: "invalid json body" }); }
  if (!body.source_id) return R.error(400, "invalid_body", { detail: "source_id required" });
  if (!body.file_path && !body.file_url) return R.error(400, "invalid_body", { detail: "file_path or file_url required" });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // 3) Carrega source + cria job
  const { data: source, error: srcErr } = await admin
    .from("bible_translation_sources").select("*").eq("id", body.source_id).single();
  if (srcErr || !source) return R.error(404, "not_found", { detail: `source not found: ${srcErr?.message ?? body.source_id}` });

  const { data: job, error: jobErr } = await admin
    .from("bible_import_jobs")
    .insert({
      source_id: source.id,
      status: "running",
      started_at: new Date().toISOString(),
      created_by: userData.user.id,
      message: "Lendo dump…",
    }).select("id").single();
  if (jobErr || !job) return R.error(500, "internal_error", { stage: "job_create", detail: jobErr?.message });
  const jobId = job.id as string;

  await admin.from("bible_translation_sources").update({ status: "importing" }).eq("id", source.id);

  // 4) Abre stream do arquivo
  let stream: ReadableStream<Uint8Array> | null = null;
  try {
    if (body.file_path) {
      const { data: blob, error } = await admin.storage.from("bible-dumps").download(body.file_path);
      if (error || !blob) throw new Error(`storage download: ${error?.message ?? "no blob"}`);
      stream = blob.stream();
    } else {
      const res = await fetch(body.file_url!, { headers: { "User-Agent": "CathedraImport/1.0" } });
      if (!res.ok || !res.body) throw new Error(`fetch ${body.file_url}: HTTP ${res.status}`);
      stream = res.body;
    }
  } catch (e) {
    await admin.from("bible_import_jobs").update({
      status: "failed", error: (e as Error).message, finished_at: new Date().toISOString(),
    }).eq("id", jobId);
    await admin.from("bible_translation_sources").update({ status: "failed" }).eq("id", source.id);
    return R.error(502, "internal_error", { stage: "stream_open", detail: (e as Error).message, job_id: jobId });
  }

  // 5) Processa stream: agrupa por livro, faz upsert em ordem
  const bookIds = new Map<string, string>(); // abbr → book_id
  const chapterIds = new Map<string, string>(); // `${abbr}:${ch}` → chapter_id
  const versesByChapter = new Map<string, VerseRow[]>(); // `${abbr}:${ch}` → linhas pendentes
  const stats = { lines: 0, verses: 0, errors: [] as string[], byBook: new Map<string, { ch: Set<number>; v: number }>() };
  let totalBooksSeen = 0;
  let lastProgressUpdate = 0;

  async function ensureBook(abbr: string): Promise<string> {
    const cached = bookIds.get(abbr);
    if (cached) return cached;
    const canon = CANON_BY_ABBR.get(abbr)!;
    const { data: existing } = await admin.from("bible_books").select("id").eq("abbr", abbr).maybeSingle();
    if (existing?.id) { bookIds.set(abbr, existing.id); return existing.id; }
    // chapters_count provisório: contado ao final; aqui usa total do canon se disponível, senão 1
    const { data: ins, error } = await admin.from("bible_books").insert({
      abbr, name: canon.name, testament: canon.testament === "OT" ? "antigo" : "novo",
      chapters_count: 1, canonical_type: canon.deuterocanonical ? "deuterocanonical" : "protocanonical",
    }).select("id").single();
    if (error || !ins) throw new Error(`book insert ${abbr}: ${error?.message}`);
    bookIds.set(abbr, ins.id);
    totalBooksSeen++;
    return ins.id;
  }

  async function ensureChapter(abbr: string, chapter: number): Promise<string> {
    const key = `${abbr}:${chapter}`;
    const cached = chapterIds.get(key);
    if (cached) return cached;
    const bookId = await ensureBook(abbr);
    const { data, error } = await admin.from("bible_chapters")
      .upsert({ book_id: bookId, number: chapter }, { onConflict: "book_id,number" })
      .select("id").single();
    if (error || !data) throw new Error(`chapter upsert ${key}: ${error?.message}`);
    chapterIds.set(key, data.id);
    return data.id;
  }

  async function flushVerses(key: string) {
    const buf = versesByChapter.get(key);
    if (!buf || buf.length === 0) return;
    const [abbr, chStr] = key.split(":");
    const chapter = Number(chStr);
    const chapterId = await ensureChapter(abbr, chapter);
    // Insere em batches
    for (let i = 0; i < buf.length; i += VERSE_BATCH) {
      const slice = buf.slice(i, i + VERSE_BATCH);
      const rows = slice.map((v) => ({
        chapter_id: chapterId,
        translation_id: source.id,
        number: v.verse,
        text: v.text,
      }));
      const { error } = await admin
        .from("bible_verses")
        .upsert(rows, { onConflict: "chapter_id,translation_id,number" });
      if (error) throw new Error(`verses upsert ${key}: ${error.message}`);
      stats.verses += rows.length;
    }
    const bookStat = stats.byBook.get(abbr) ?? { ch: new Set<number>(), v: 0 };
    bookStat.ch.add(chapter); bookStat.v += buf.length;
    stats.byBook.set(abbr, bookStat);
    versesByChapter.delete(key);
  }

  async function updateProgress(currentAbbr: string, force = false) {
    const now = Date.now();
    if (!force && now - lastProgressUpdate < 1500) return;
    lastProgressUpdate = now;
    await admin.from("bible_import_jobs").update({
      progress: stats.byBook.size, total: totalBooksSeen,
      current_book: currentAbbr,
      message: `${stats.verses} versos / ${stats.byBook.size} livros`,
    }).eq("id", jobId);
  }

  try {
    const reader = stream!.getReader();
    const lines = streamLines(reader);
    let lineNo = 0;
    let currentBookKey = "";
    const rejectedAll: Array<{ lineNumber: number; reason: string }> = [];
    for await (const raw of lines) {
      lineNo++;
      const parsed = parseLine(raw, lineNo);
      if ("error" in parsed) {
        if (stats.errors.length < 50) stats.errors.push(parsed.error);
        if (rejectedAll.length < 5000) rejectedAll.push({ lineNumber: lineNo, reason: parsed.error });
        continue;
      }
      stats.lines++;
      const key = `${parsed.abbr}:${parsed.chapter}`;
      if (currentBookKey && currentBookKey.split(":")[0] !== parsed.abbr) {
        for (const k of [...versesByChapter.keys()]) await flushVerses(k);
        await updateProgress(parsed.abbr, true);
      }
      currentBookKey = key;
      const buf = versesByChapter.get(key) ?? [];
      buf.push(parsed);
      versesByChapter.set(key, buf);
      if (buf.length >= VERSE_BATCH) await flushVerses(key);
      if (lineNo % 1000 === 0) await updateProgress(parsed.abbr);
    }
    for (const k of [...versesByChapter.keys()]) await flushVerses(k);

    for (const [abbr, st] of stats.byBook.entries()) {
      await admin.from("bible_books").update({ chapters_count: st.ch.size }).eq("abbr", abbr);
    }

    const distinctChapters = Array.from(stats.byBook.values()).reduce((a, b) => a + b.ch.size, 0);
    await admin.from("bible_translation_sources").update({
      status: "ready", books_count: stats.byBook.size, chapters_count: distinctChapters,
      verses_count: stats.verses, imported_at: new Date().toISOString(),
    }).eq("id", source.id);

    // Persiste rejeitados em storage para auditoria/download
    let rejectedPath: string | null = null;
    if (rejectedAll.length > 0) {
      rejectedPath = `${source.id}/import-rejected-${jobId}.ndjson`;
      const blob = new Blob(
        [rejectedAll.map((r) => JSON.stringify(r)).join("\n") + "\n"],
        { type: "application/x-ndjson" },
      );
      const { error: upErr } = await admin.storage.from("bible-dumps")
        .upload(rejectedPath, blob, { contentType: "application/x-ndjson", upsert: true });
      if (upErr) rejectedPath = null;
    }

    const verification = body.skip_verify
      ? { ran: false, passed: true, skipped: true, rejected_path: rejectedPath, rejected_count: rejectedAll.length }
      : {
          ...(await runPostRunVerify({
            trigger: "import",
            metadata: { source_id: source.id, books: stats.byBook.size, verses: stats.verses },
          })),
          rejected_path: rejectedPath,
          rejected_count: rejectedAll.length,
        };

    await admin.from("bible_import_jobs").update({
      status: "succeeded", progress: stats.byBook.size, total: stats.byBook.size,
      message: `Importação concluída: ${stats.verses} versos em ${stats.byBook.size} livros${rejectedAll.length ? ` (${rejectedAll.length} rejeitados)` : ""}`,
      verification, finished_at: new Date().toISOString(),
    }).eq("id", jobId);

    return jsonResponse({
      ok: true, job_id: jobId,
      books: stats.byBook.size, chapters: distinctChapters, verses: stats.verses,
      lines_read: stats.lines, parse_errors: stats.errors,
      rejected_path: rejectedPath, rejected_count: rejectedAll.length,
      verification,
    });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    await admin.from("bible_import_jobs").update({
      status: "failed", error: msg, finished_at: new Date().toISOString(),
    }).eq("id", jobId);
    await admin.from("bible_translation_sources").update({ status: "failed" }).eq("id", source.id);
    return R.error(500, "internal_error", { detail: msg, job_id: jobId });
  }
});
