// Aplica ou rejeita um run de reimport pré-computado (dry-run).
// - Requer role admin.
// - action='apply': para cada item do preview com reason 'would_update' ou 'would_fill_full_bio',
//   refaz o fetch, valida hash e aplica; marca run como applied.
// - action='reject': só marca como rejected.
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
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'").replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ").trim();
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
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const anon = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anon.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({})) as { run_id?: string; action?: 'apply' | 'reject' };
    if (!body.run_id || !body.action) return json({ error: "invalid_body" }, 400);

    const { data: run, error: rErr } = await admin
      .from("saints_reimport_runs").select("*").eq("id", body.run_id).maybeSingle();
    if (rErr || !run) return json({ error: "run_not_found" }, 404);
    if (run.status !== 'pending_approval') return json({ error: "invalid_status", details: run.status }, 409);

    if (body.action === 'reject') {
      await admin.from("saints_reimport_runs").update({
        status: 'rejected', approved_by: userData.user.id, approved_at: new Date().toISOString(),
      }).eq("id", body.run_id);
      return json({ ok: true, status: 'rejected' });
    }

    // apply
    const preview = (run.preview ?? []) as Array<{ id: string; source_url: string; reason: string; new_hash: string | null }>;
    const targets = preview.filter(p => p.reason === 'would_update' || p.reason === 'would_fill_full_bio');
    let applied = 0, skipped = 0, failed = 0;
    const failures: { id: string; reason: string }[] = [];

    for (const t of targets) {
      const { data: s } = await admin
        .from("saints").select("id,content_hash,full_bio").eq("id", t.id).maybeSingle();
      if (!s) { skipped++; continue; }
      const html = await fetchWithTimeout(t.source_url);
      if (!html) { failed++; failures.push({ id: t.id, reason: 'fetch_failed' }); continue; }
      const text = stripHtml(html);
      const hash = await sha256(text);
      const now = new Date().toISOString();
      const emptyBio = !s.full_bio || String(s.full_bio).trim().length < 80;
      const patch: Record<string, unknown> = { content_hash: hash, last_scraped_at: now };
      if (emptyBio) { patch.full_bio = text.slice(0, 2500); patch.bio_source_url = t.source_url; }
      const { error: uErr } = await admin.from("saints").update(patch).eq("id", t.id);
      if (uErr) { failed++; failures.push({ id: t.id, reason: uErr.message }); continue; }
      applied++;
    }

    const applied_summary = { targets: targets.length, applied, skipped, failed, failures: failures.slice(0, 20) };
    await admin.from("saints_reimport_runs").update({
      status: failed === targets.length && targets.length > 0 ? 'failed' : 'applied',
      approved_by: userData.user.id,
      approved_at: new Date().toISOString(),
      applied_summary,
    }).eq("id", body.run_id);

    return json({ ok: true, status: 'applied', ...applied_summary });
  } catch (e) {
    return json({ error: "internal", details: String(e) }, 500);
  }
});
