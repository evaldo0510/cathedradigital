/**
 * bible-convert-dump — converte um dump bruto (JSON/CSV/TSV/NDJSON) para
 * NDJSON canônico Cathedra ({abbr,chapter,verse,text}) no backend.
 *
 * Fluxo:
 *   1. Admin sobe um arquivo bruto em `bible-dumps/<source_id>/raw-<ts>.<ext>`
 *      via /admin/bible-import (modo "dump bruto").
 *   2. Esta função baixa o arquivo, identifica o formato pela extensão,
 *      roda o conversor compartilhado e escreve dois novos arquivos no
 *      mesmo bucket:
 *        - <source_id>/converted-<ts>.ndjson
 *        - <source_id>/rejected-<ts>.ndjson
 *   3. Devolve as estatísticas e os paths. O cliente então invoca
 *      `bible-import-ndjson` apontando para o arquivo convertido.
 *
 * Restrito a admins (JWT validado em código).
 * Sprint A CAT-002 Wave 4a: erros seguem ErrorEnvelopeSchema.strict();
 * dados de diagnóstico (stats, sample_rejections) vão em `details`.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  convertText, detectFormat, toCanonicalNDJSON, rejectedToNDJSON,
  type DumpFormat,
} from "../_shared/ndjsonConverter.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";

interface Body {
  source_id: string;
  file_path: string;
  format?: DumpFormat;
}

Deno.serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === "OPTIONS") return R.cors();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return R.error(401, "unauthorized");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return R.error(401, "unauthorized");
  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_current_user_admin");
  if (adminErr || !isAdmin) return R.error(403, "forbidden");

  let body: Body;
  try { body = await req.json() as Body; }
  catch { return R.error(400, "invalid_body", { message: "invalid json body" }); }
  if (!body.source_id || !body.file_path) {
    return R.error(400, "invalid_body", { message: "source_id and file_path required" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: blob, error: dlErr } = await admin.storage.from("bible-dumps").download(body.file_path);
  if (dlErr || !blob) return R.error(502, "internal_error", { stage: "download", message: dlErr?.message ?? "no blob" });

  const content = await blob.text();
  if (content.length === 0) return R.error(400, "invalid_body", { message: "arquivo vazio" });

  const fmt: DumpFormat = body.format ?? detectFormat(body.file_path);

  let result: { verses: ReturnType<typeof convertText>["verses"]; rejected: ReturnType<typeof convertText>["rejected"] };
  try {
    result = convertText(content, fmt);
  } catch (e) {
    return R.error(422, "invalid_body", { stage: "parse", message: (e as Error).message });
  }

  const byBook = new Map<string, { chapters: Set<number>; verses: number }>();
  for (const v of result.verses) {
    const st = byBook.get(v.abbr) ?? { chapters: new Set<number>(), verses: 0 };
    st.chapters.add(v.chapter); st.verses++;
    byBook.set(v.abbr, st);
  }
  const stats = {
    format: fmt,
    valid_verses: result.verses.length,
    rejected_count: result.rejected.length,
    unique_books: byBook.size,
    unique_chapters: Array.from(byBook.values()).reduce((a, b) => a + b.chapters.size, 0),
  };

  if (result.verses.length === 0) {
    return R.error(422, "invalid_body", {
      message: "Nenhum verso válido foi extraído.",
      stats,
      sample_rejections: result.rejected.slice(0, 10),
    });
  }

  const ts = Date.now();
  const convertedPath = `${body.source_id}/converted-${ts}.ndjson`;
  const rejectedPath = `${body.source_id}/rejected-${ts}.ndjson`;

  const convertedBlob = new Blob([toCanonicalNDJSON(result.verses)], { type: "application/x-ndjson" });
  const { error: upErr } = await admin.storage.from("bible-dumps").upload(convertedPath, convertedBlob, {
    contentType: "application/x-ndjson", upsert: false,
  });
  if (upErr) return R.error(500, "internal_error", { stage: "upload_converted", message: upErr.message });

  let uploadedRejected: string | null = null;
  if (result.rejected.length > 0) {
    const rejBlob = new Blob([rejectedToNDJSON(result.rejected)], { type: "application/x-ndjson" });
    const { error: rUpErr } = await admin.storage.from("bible-dumps").upload(rejectedPath, rejBlob, {
      contentType: "application/x-ndjson", upsert: false,
    });
    if (!rUpErr) uploadedRejected = rejectedPath;
  }

  return R.raw({
    ok: true,
    converted_path: convertedPath,
    rejected_path: uploadedRejected,
    stats,
    sample_rejections: result.rejected.slice(0, 10),
  });
});
