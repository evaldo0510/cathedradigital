import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICE = 19.9;
const PLAN_TITLE = "Cathedra PRO – Plano Mensal";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago ainda não configurado no backend." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { origin } = await req.json();
    const backUrl = origin || "https://cathedradigital.lovable.app";

    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              title: PLAN_TITLE,
              quantity: 1,
              unit_price: PLAN_PRICE,
              currency_id: "BRL",
            },
          ],
          payer: { email: user.email },
          external_reference: user.email,
          back_urls: {
            success: `${backUrl}/checkout/resultado?status=success`,
            failure: `${backUrl}/checkout/resultado?status=failure`,
            pending: `${backUrl}/checkout/resultado?status=pending`,
          },
          auto_return: "approved",
        }),
      }
    );

    const data = await mpRes.json();

    if (!data.init_point) {
      console.error("MP error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Falha ao criar preferência no Mercado Pago.", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ checkoutUrl: data.init_point }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
