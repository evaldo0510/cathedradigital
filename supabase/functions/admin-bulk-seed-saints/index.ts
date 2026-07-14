// Edge function admin-only para importar santos em massa a partir de um array JSON no body.
// Requer usuário autenticado com role 'admin' (via has_role).
// Uso: POST { saints: [{id,name,title,feast_day,feast_month,feast_day_num,bio,full_bio,category}], overwrite: true }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "unauthorized", details: "missing bearer token" }, 401);

    // 1) Verifica usuário e role admin usando o JWT diretamente
    const anon = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anon.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json({ error: "unauthorized", details: userErr?.message ?? "invalid token" }, 401);
    }
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    // Verifica role admin diretamente na tabela user_roles (evita ambiguidade de overloads em has_role)
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) return json({ error: "role_check_failed", details: roleErr.message }, 500);
    if (!roleRow) return json({ error: "forbidden", details: "requires admin role" }, 403);



    // 2) Valida body
    const body = await req.json().catch(() => null) as { saints?: unknown[] } | null;
    const rows = Array.isArray(body?.saints) ? body!.saints : null;
    if (!rows || rows.length === 0) return json({ error: "bad_request", details: "saints[] required" }, 400);

    const valid = rows.filter((r: any) =>
      r && typeof r.id === "string" && typeof r.name === "string" &&
      Number.isInteger(r.feast_month) && r.feast_month >= 1 && r.feast_month <= 12 &&
      Number.isInteger(r.feast_day_num) && r.feast_day_num >= 1 && r.feast_day_num <= 31
    );
    if (valid.length === 0) return json({ error: "bad_request", details: "no valid rows" }, 400);

    // 3) Upsert via service role (reutiliza cliente admin)
    const { error: upErr, count } = await admin
      .from("saints")
      .upsert(valid as any[], { onConflict: "id", count: "exact" });

    if (upErr) return json({ error: "upsert_failed", details: upErr.message }, 500);

    return json({ ok: true, inserted_or_updated: count ?? valid.length, received: rows.length });
  } catch (e) {
    return json({ error: "internal", details: String(e) }, 500);
  }
});
