// Expõe a RPC `bible_cache_timeseries` para o frontend do dashboard.
// Autentica o usuário via JWT e exige role 'admin' para evitar vazamento
// operacional. Usa service_role internamente para chamar a RPC (que é
// SECURITY DEFINER e tem EXECUTE restrito a service_role).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // Admin guard: usa o cliente do usuário (RLS) para checar role
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return json({ error: "Forbidden" }, 403);
    }

    // Parâmetros: query string (GET) ou body JSON (POST)
    const url = new URL(req.url);
    let params: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        params = await req.json();
      } catch {
        params = {};
      }
    } else {
      params = Object.fromEntries(url.searchParams.entries());
    }

    const windowMinutes = clampInt(
      params.window_minutes ?? params.p_window_minutes,
      1,
      1440,
      5,
    );
    const sinceHours = clampInt(
      params.since_hours ?? params.p_since_hours,
      1,
      720,
      24,
    );
    const rawAbbrev = (params.abbrev ?? params.p_abbrev ?? null) as
      | string
      | null;
    const abbrev =
      typeof rawAbbrev === "string" && /^[A-Za-z0-9]{1,8}$/.test(rawAbbrev)
        ? rawAbbrev
        : null;

    const { data, error } = await admin.rpc("bible_cache_timeseries", {
      p_window_minutes: windowMinutes,
      p_since_hours: sinceHours,
      p_abbrev: abbrev,
    });

    if (error) {
      console.error("[bible-cache-timeseries] rpc error", error);
      return json({ error: error.message }, 500);
    }

    return json({
      window_minutes: windowMinutes,
      since_hours: sinceHours,
      abbrev,
      rows: data ?? [],
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[bible-cache-timeseries] unexpected", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
