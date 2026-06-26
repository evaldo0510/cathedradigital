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
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  convertText, detectFormat, toCanonicalNDJSON, rejectedToNDJSON,
  type DumpFormat,
} from "../_shared/ndjsonConverter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  source_id: string;
  file_path: string;     // path dentro de bible-dumps
  format?: DumpFormat;   // override opcional
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return jsonResponse({ error: "unauthorized" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return jsonResponse({ error: "unauthorized" }, 401);
  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_current_user_admin");
  if (adminErr || !isAdmin) return jsonResponse({ error: "forbidden" }, 403);

  let body: Body;
  try { body = await req.json() as Body; }
  catch { return jsonResponse({ error: "invalid json body" }, 400); }
  if (!body.source_id || !body.file_path) {
    return jsonResponse({ error: "source_id and file_path required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Baixa o arquivo bruto
  const { data: blob, error: dlErr } = await admin.storage.from("bible-dumps").download(body.file_path);
  if (dlErr || !blob) return jsonResponse({ error: `download: ${dlErr?.message ?? "no blob"}` }, 502);

  const content = await blob.text();
  if (content.length === 0) return jsonResponse({ error: "arquivo vazio" }, 400);

  const fmt: DumpFormat = body.format ?? detectFormat(body.file_path);

  let result: { verses: ReturnType<typeof convertText>["verses"]; rejected: ReturnType<typeof convertText>["rejected"] };
  try {
    result = convertText(content, fmt);
  } catch (e) {
    return jsonResponse({ error: `parse: ${(e as Error).message}` }, 422);
  }

  // Estatísticas
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
    return jsonResponse({ error: "Nenhum verso válido foi extraído.", stats, sample_rejections: result.rejected.slice(0, 10) }, 422);
  }

  // Persiste arquivos
  const ts = Date.now();
  const convertedPath = `${body.source_id}/converted-${ts}.ndjson`;
  const rejectedPath = `${body.source_id}/rejected-${ts}.ndjson`;

  const convertedBlob = new Blob([toCanonicalNDJSON(result.verses)], { type: "application/x-ndjson" });
  const { error: upErr } = await admin.storage.from("bible-dumps").upload(convertedPath, convertedBlob, {
    contentType: "application/x-ndjson", upsert: false,
  });
  if (upErr) return jsonResponse({ error: `upload converted: ${upErr.message}` }, 500);

  let uploadedRejected: string | null = null;
  if (result.rejected.length > 0) {
    const rejBlob = new Blob([rejectedToNDJSON(result.rejected)], { type: "application/x-ndjson" });
    const { error: rUpErr } = await admin.storage.from("bible-dumps").upload(rejectedPath, rejBlob, {
      contentType: "application/x-ndjson", upsert: false,
    });
    if (!rUpErr) uploadedRejected = rejectedPath;
  }

  return jsonResponse({
    ok: true,
    converted_path: convertedPath,
    rejected_path: uploadedRejected,
    stats,
    sample_rejections: result.rejected.slice(0, 10),
  });
});
