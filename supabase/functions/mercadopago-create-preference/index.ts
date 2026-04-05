import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RequestSchema = z.object({
  planId: z.enum(["cathedra_pro"]).optional().default("cathedra_pro"),
  origin: z.string().url(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const mercadoPagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: "Configuração do backend incompleta." }, 500);
    }

    if (!mercadoPagoAccessToken) {
      return json({ error: "Mercado Pago ainda não configurado no backend." }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return json({ error: "Sessão inválida." }, 401);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "Sessão inválida." }, 401);
    }

    const body = await req.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const origin = parsed.data.origin.replace(/\/$/, "");
    const title = "Cathedra PRO";
    const amount = 19.9;

    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .insert({
        user_id: user.id,
        amount,
        description: title,
        status: "pending",
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      console.error("Transaction insert error:", transactionError);
      return json({ error: "Não foi possível iniciar a transação." }, 500);
    }

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        items: [
          {
            id: parsed.data.planId,
            title,
            description: "Acesso PRO do aplicativo Cathedra",
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount,
          },
        ],
        payer: {
          email: user.email ?? undefined,
        },
        external_reference: transaction.id,
        metadata: {
          transaction_id: transaction.id,
          user_id: user.id,
        },
        statement_descriptor: "CATHEDRA",
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        back_urls: {
          success: `${origin}/checkout?checkout=success`,
          pending: `${origin}/checkout?checkout=pending`,
          failure: `${origin}/checkout?checkout=failure`,
        },
        auto_return: "approved",
      }),
    });

    if (!preferenceResponse.ok) {
      const errorText = await preferenceResponse.text();
      console.error("Mercado Pago preference error:", errorText);

      await adminClient
        .from("transactions")
        .update({ status: "error" })
        .eq("id", transaction.id);

      return json({ error: "Não foi possível gerar o checkout do Mercado Pago." }, 502);
    }

    const preference = await preferenceResponse.json();
    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;

    if (!checkoutUrl) {
      await adminClient
        .from("transactions")
        .update({ status: "error" })
        .eq("id", transaction.id);

      return json({ error: "O link de pagamento não foi retornado." }, 502);
    }

    return json({
      checkoutUrl,
      transactionId: transaction.id,
      preferenceId: preference.id ?? null,
    });
  } catch (error) {
    console.error("mercadopago-create-preference error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro inesperado ao iniciar o checkout." },
      500,
    );
  }
});