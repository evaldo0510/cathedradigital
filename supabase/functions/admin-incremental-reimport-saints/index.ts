// Reimport incremental de santos.
// Estratégia:
//  1. Para cada santo com source_url:
//     - Pula se last_scraped_at < TTL dias E content_hash já existe (não expirou).
//     - Faz fetch do source_url, extrai texto plano, calcula sha256.
//     - Se o hash mudou (ou o registro não tinha hash), atualiza:
//         * content_hash, last_scraped_at
//         * se full_bio estiver vazio, preenche com um trecho do texto extraído.
//     - Se o hash for igual, atualiza só last_scraped_at (marca como visitado).
//  2. Retorna contagens.
// Requer role admin. Sem dependência de Firecrawl.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(url: string, ms = 15000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "CathedraDigitalBot/1.0 (+https://cathedradigital.com.br)" },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "unauthorized", details: "missing bearer token" }, 401);

    const anon = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anon.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "unauthorized", details: userErr?.message ?? "invalid token" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (roleErr) return json({ error: "role_check_failed", details: roleErr.message }, 500);
    if (!roleRow) return json({ error: "forbidden", details: "requires admin role" }, 403);

    const body = await req.json().catch(() => ({})) as { ttl_days?: number; limit?: number; ids?: string[] };
    const ttlDays = Number.isFinite(body.ttl_days) ? Math.max(1, Number(body.ttl_days)) : 30;
    const limit = Number.isFinite(body.limit) ? Math.max(1, Number(body.limit)) : 100;
    const ttlCutoff = new Date(Date.now() - ttlDays * 86400_000).toISOString();

    // Seleciona candidatos: com source_url; last_scraped_at nulo ou antigo; opcionalmente filtrado por ids.
    let q = admin
      .from("saints")
      .select("id,source_url,content_hash,last_scraped_at,full_bio")
      .not("source_url", "is", null)
      .limit(limit);

    if (body.ids && body.ids.length > 0) q = q.in("id", body.ids);
    else q = q.or(`last_scraped_at.is.null,last_scraped_at.lt.${ttlCutoff}`);

    const { data: candidates, error: qErr } = await q;
    if (qErr) return json({ error: "query_failed", details: qErr.message }, 500);

    let updated = 0, skipped = 0, unchanged = 0, failed = 0;
    const failures: { id: string; reason: string }[] = [];

    for (const s of candidates || []) {
      const url = (s as any).source_url as string;
      if (!url) { skipped++; continue; }
      const html = await fetchWithTimeout(url);
      if (!html) { failed++; failures.push({ id: (s as any).id, reason: "fetch_failed" }); continue; }
      const text = stripHtml(html);
      const hash = await sha256(text);
      const now = new Date().toISOString();

      if (hash === (s as any).content_hash) {
        // Sem mudança: só marca como visitado.
        await admin.from("saints").update({ last_scraped_at: now }).eq("id", (s as any).id);
        unchanged++;
        continue;
      }

      const patch: Record<string, unknown> = { content_hash: hash, last_scraped_at: now };
      // Preenche full_bio quando faltando — trecho conservador de até 2500 chars.
      if (!(s as any).full_bio || String((s as any).full_bio).trim().length < 80) {
        patch.full_bio = text.slice(0, 2500);
        patch.bio_source_url = url;
      }
      const { error: upErr } = await admin.from("saints").update(patch).eq("id", (s as any).id);
      if (upErr) { failed++; failures.push({ id: (s as any).id, reason: upErr.message }); continue; }
      updated++;
    }

    return json({
      ok: true,
      ttl_days: ttlDays,
      considered: candidates?.length ?? 0,
      updated,
      unchanged,
      skipped,
      failed,
      failures: failures.slice(0, 20),
    });
  } catch (e) {
    return json({ error: "internal", details: String(e) }, 500);
  }
});
