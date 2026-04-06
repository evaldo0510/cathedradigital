import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Rate limiter: 5 attempts per minute per IP to prevent coupon enumeration
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) rateLimitMap.delete(k);
    }
  }
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    return json({ error: "Muitas tentativas. Aguarde um momento antes de tentar novamente." }, 429);
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Método não permitido." }, 405);
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return json({ error: "Código do cupom é obrigatório." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const client = createClient(supabaseUrl, serviceRoleKey);

    const { data: coupon, error } = await client
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return json({ valid: false, error: "Cupom inválido ou expirado." }, 200);
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return json({ valid: false, error: "Cupom expirado." }, 200);
    }

    if (coupon.current_uses >= coupon.max_uses) {
      return json({ valid: false, error: "Cupom esgotado." }, 200);
    }

    return json({
      valid: true,
      discount_percent: coupon.discount_percent,
      code: coupon.code,
    });
  } catch (err) {
    console.error("[validate-coupon] error", err);
    return json({ error: "Erro ao validar cupom." }, 500);
  }
});
