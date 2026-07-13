import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://esm.sh/zod@3.25.76";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

const RequestSchema = z
  .object({
    paymentId: z.union([z.string(), z.number()]).optional(),
    transactionId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.paymentId || value.transactionId), {
    message: "Informe um pagamento ou transação para sincronizar.",
    path: ["paymentId"],
  });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function normalizeMercadoPagoAccessToken(rawToken: string) {
  const trimmedToken = rawToken.trim().replace(/^Bearer\s+/i, "");
  const tokenMatch = trimmedToken.match(/(APP_USR-[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*)|(TEST-[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*)/);
  return tokenMatch?.[0] ?? trimmedToken;
}

function resolveMercadoPagoAccessToken() {
  const secretCandidates = [
    { name: "MERCADO_PAGO_ACCESS_TOKEN", value: Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") },
    { name: "MERCADOPAGO_ACCESS_TOKEN", value: Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") },
  ];

  console.log(
    "[mercadopago-sync-payment] secret availability",
    secretCandidates.map(({ name, value }) => ({ name, present: Boolean(value?.trim()) })),
  );

  const selectedSecret = secretCandidates.find(({ value }) => Boolean(value?.trim()));
  if (!selectedSecret) {
    return { source: null, token: "" };
  }

  return {
    source: selectedSecret.name,
    token: normalizeMercadoPagoAccessToken(selectedSecret.value!),
  };
}

async function parseResponse(response: Response) {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    return { raw: rawText };
  }
}

async function fetchPaymentById(accessToken: string, paymentId: string | number) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    console.error("Mercado Pago payment lookup error:", { data, paymentId, status: response.status });
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Não foi possível consultar o pagamento no Mercado Pago.",
    );
  }

  return data;
}

async function fetchPaymentByTransaction(accessToken: string, transactionId: string) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(transactionId)}&sort=date_created&criteria=desc&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const result = await parseResponse(response);

  if (!response.ok) {
    console.error("Mercado Pago payment search error:", { result, status: response.status, transactionId });
    throw new Error(
      typeof result?.message === "string"
        ? result.message
        : "Não foi possível localizar a transação no Mercado Pago.",
    );
  }

  return result.results?.[0] ?? null;
}

serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

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
    const { source: tokenSource, token: mercadoPagoAccessToken } = resolveMercadoPagoAccessToken();

    console.log("[mercadopago-sync-payment] runtime env", {
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
      hasSupabaseUrl: Boolean(supabaseUrl),
      tokenSource,
    });

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
    const payment = parsed.data.paymentId
      ? await fetchPaymentById(mercadoPagoAccessToken, parsed.data.paymentId)
      : await fetchPaymentByTransaction(mercadoPagoAccessToken, parsed.data.transactionId!);

    if (!payment) {
      return json({ error: "Pagamento não encontrado no Mercado Pago." }, 404);
    }

    const transactionId = payment.external_reference ?? payment.metadata?.transaction_id;
    if (!transactionId) {
      return json({ error: "O pagamento não possui uma transação associada." }, 404);
    }

    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .select("id, user_id")
      .eq("id", transactionId)
      .maybeSingle();

    if (transactionError || !transaction) {
      return json({ error: "Transação local não encontrada." }, 404);
    }

    if (transaction.user_id !== user.id) {
      return json({ error: "Você não tem permissão para consultar esta transação." }, 403);
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
      console.error("Transaction sync error:", updateError);
      return json({ error: "Não foi possível atualizar a transação." }, 500);
    }

    // Activate PRO access when payment is approved
    if (normalizedStatus === "approved") {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile premium update error:", profileError);
      }
    }

    return json({
      status: normalizedStatus,
      transactionId,
      paymentId: String(payment.id ?? parsed.data.paymentId ?? ""),
    });
  } catch (error) {
    console.error("mercadopago-sync-payment error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro inesperado ao sincronizar o pagamento." },
      500,
    );
  }
});