import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const mercadoPagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Configuração do backend incompleta." }, 500);
    }

    if (!mercadoPagoAccessToken) {
      return json({ error: "Mercado Pago ainda não configurado no backend." }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => null) : null;

    const eventType =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      body?.type ||
      body?.topic ||
      null;

    const rawPaymentId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      body?.id ||
      url.searchParams.get("id") ||
      (typeof body?.resource === "string" ? body.resource.split("/").pop() : null);

    if (eventType && eventType !== "payment") {
      return json({ ok: true, ignored: true });
    }

    if (!rawPaymentId) {
      return json({ ok: true, ignored: true });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${rawPaymentId}`, {
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("Mercado Pago webhook payment lookup error:", errorText);
      return json({ error: "Falha ao consultar o pagamento." }, 502);
    }

    const payment = await paymentResponse.json();
    const transactionId = payment.external_reference ?? payment.metadata?.transaction_id;

    if (!transactionId) {
      return json({ ok: true, ignored: true });
    }

    const normalizedStatus = typeof payment.status === "string" ? payment.status : "pending";
    const normalizedAmount = Number(payment.transaction_amount ?? 0) || 19.9;
    const normalizedDescription =
      typeof payment.description === "string" && payment.description.trim().length > 0
        ? payment.description
        : "Cathedra PRO";

    const { error: updateError } = await adminClient
      .from("transactions")
      .update({
        status: normalizedStatus,
        amount: normalizedAmount,
        description: normalizedDescription,
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("Mercado Pago webhook transaction update error:", updateError);
      return json({ error: "Falha ao atualizar a transação." }, 500);
    }

    return json({ ok: true, transactionId, status: normalizedStatus });
  } catch (error) {
    console.error("mercadopago-webhook error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro inesperado no webhook." },
      500,
    );
  }
});