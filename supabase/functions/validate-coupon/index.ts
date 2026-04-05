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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return json({ valid: false, error: "Cupom expirado." }, 200);
    }

    // Check max uses
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
