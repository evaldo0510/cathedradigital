// Shared auth guards for edge functions.
//
// - assertAdmin(req): valida o JWT do chamador e confirma app_role='admin'
//   em user_roles. Retorna { ok:true, userId } ou Response 401/403.
// - assertCronOrAdmin(req): aceita `x-cron-secret` = CRON_SECRET, OU JWT admin,
//   OU Authorization Bearer == SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const jsonHeaders = { "Content-Type": "application/json" };

function deny(status: number, message: string, cors: HeadersInit = {}): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, ...jsonHeaders },
  });
}

export async function assertAdmin(
  req: Request,
  corsHeaders: HeadersInit = {},
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return { ok: false, response: deny(401, "Unauthorized", corsHeaders) };
  }
  const token = authHeader.slice(7).trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: claims, error: cErr } = await authClient.auth.getClaims(token);
  const userId = claims?.claims?.sub as string | undefined;
  if (cErr || !userId) {
    return { ok: false, response: deny(401, "Unauthorized", corsHeaders) };
  }
  // Consulta user_roles com service key para bypassar RLS de forma segura.
  const svc = createClient(supabaseUrl, serviceKey);
  const { data: role, error: rErr } = await svc
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (rErr || !role) {
    return { ok: false, response: deny(403, "Forbidden: admin role required", corsHeaders) };
  }
  return { ok: true, userId };
}

export async function assertCronOrAdmin(
  req: Request,
  corsHeaders: HeadersInit = {},
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronHeader = req.headers.get("x-cron-secret");
  if (cronSecret && cronHeader && cronHeader === cronSecret) return { ok: true };
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (serviceKey && token === serviceKey) return { ok: true };
    // fallback: JWT admin
    const admin = await assertAdmin(req, corsHeaders);
    if (admin.ok) return { ok: true };
    return { ok: false, response: admin.response };
  }
  return { ok: false, response: deny(401, "Unauthorized", corsHeaders) };
}

// Per-IP rate limiter (in-memory, per isolate).
const rateBuckets = new Map<string, number[]>();
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (rateBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    rateBuckets.set(key, arr);
    return true;
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  return false;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
