import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.25.76";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};
// Alias módulo-level (helpers fora do handler não conhecem o CID do request)
const corsHeaders = _corsBase;

const DEFAULT_PLAN_PRICE = 19.9;
const DEFAULT_PLAN_TITLE = "Cathedra PRO – Plano Mensal";
const DEFAULT_PLAN_ID = "cathedra_pro";
const DEFAULT_BACK_URL = "https://cathedradigital.lovable.app";

const RequestSchema = z.object({
  email: z.string().email().optional(),
  origin: z.string().url().optional(),
  planId: z.string().trim().min(1).max(100).optional(),
  price: z.coerce.number().positive().finite().max(100000).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  couponCode: z.string().trim().optional(),
  isDonation: z.boolean().optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Rate limiter: 5 payment attempts per minute per IP
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
    "[mercadopago-create-preference] secret availability",
    secretCandidates.map(({ name, value }) => ({ name, present: Boolean(value?.trim()) })),
  );

  const selectedSecret = secretCandidates.find(({ value }) => Boolean(value?.trim()));
  if (!selectedSecret) {
    return { source: null, token: "" };
  }

  const normalizedToken = normalizeMercadoPagoAccessToken(selectedSecret.value!);
  console.log("[mercadopago-create-preference] using secret source", selectedSecret.name, {
    normalized: Boolean(normalizedToken),
  });

  return { source: selectedSecret.name, token: normalizedToken };
}

function resolveBackUrl(origin?: string) {
  if (!origin) return DEFAULT_BACK_URL;

  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : DEFAULT_BACK_URL;
  } catch {
    return DEFAULT_BACK_URL;
  }
}

async function parseMercadoPagoResponse(response: Response) {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    return { raw: rawText };
  }
}

serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    return json({ error: "Muitas tentativas de pagamento. Aguarde um momento." }, 429);
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Método não permitido." }, 405);
    }

    let requestBody: unknown;

    try {
      requestBody = await req.json();
    } catch {
      return json({ error: "Payload inválido." }, 400);
    }

    const parsedBody = RequestSchema.safeParse(requestBody);
    if (!parsedBody.success) {
      return json({ error: parsedBody.error.flatten().fieldErrors }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const { source: tokenSource, token } = resolveMercadoPagoAccessToken();

    console.log("[mercadopago-create-preference] runtime env", {
      hasAuthorization: Boolean(authHeader),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
      hasSupabaseUrl: Boolean(supabaseUrl),
      tokenSource,
    });

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: "Configuração do backend incompleta." }, 500);
    }

    if (!authHeader) {
      return json({ error: "Usuário não autenticado." }, 401);
    }

    if (!token) {
      return json({ error: "Mercado Pago ainda não configurado no backend." }, 500);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      console.error("[mercadopago-create-preference] auth error", authError);
      return json({ error: "Usuário não autenticado." }, 401);
    }

    const title = parsedBody.data.title ?? DEFAULT_PLAN_TITLE;
    const price = parsedBody.data.price ?? DEFAULT_PLAN_PRICE;
    const payerEmail = parsedBody.data.email ?? user.email ?? "";
    const backUrl = resolveBackUrl(parsedBody.data.origin);

    if (!payerEmail) {
      return json({ error: "E-mail do pagador não informado." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .insert({
        amount: price,
        description: title,
        status: "pending",
        user_id: user.id,
        plan_id: parsedBody.data.planId ?? DEFAULT_PLAN_ID,
        coupon_code: parsedBody.data.couponCode,
        is_donation: parsedBody.data.isDonation ?? false,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      console.error("[mercadopago-create-preference] transaction insert error", transactionError);
      return json({ error: "Não foi possível preparar a transação local." }, 500);
    }

    console.log("[mercadopago-create-preference] transaction prepared", {
      transactionId: transaction.id,
      userId: user.id,
    });

    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": transaction.id,
        },
        body: JSON.stringify({
          items: [
            {
              title,
              quantity: 1,
              unit_price: price,
              currency_id: "BRL",
            },
          ],
          payer: { email: payerEmail },
          external_reference: transaction.id,
          metadata: {
            plan_id: parsedBody.data.planId ?? DEFAULT_PLAN_ID,
            transaction_id: transaction.id,
            user_id: user.id,
          },
          back_urls: {
            success: `${backUrl}/checkout/resultado?status=success`,
            failure: `${backUrl}/checkout/resultado?status=failure`,
            pending: `${backUrl}/checkout/resultado?status=pending`,
          },
          notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
          auto_return: "approved",
        }),
      }
    );

    const data = await parseMercadoPagoResponse(mpRes);
    const checkoutUrl =
      typeof data.init_point === "string"
        ? data.init_point
        : typeof data.sandbox_init_point === "string"
          ? data.sandbox_init_point
          : null;

    if (!mpRes.ok || !checkoutUrl) {
      console.error("[mercadopago-create-preference] MP error", {
        details: data,
        status: mpRes.status,
        transactionId: transaction.id,
      });

      await adminClient
        .from("transactions")
        .update({ status: "error" })
        .eq("id", transaction.id);

      return json(
        {
          details: data,
          error: "Falha ao criar preferência no Mercado Pago.",
        },
        mpRes.ok ? 500 : mpRes.status,
      );
    }

    console.log("[mercadopago-create-preference] preference created", {
      hasCheckoutUrl: Boolean(checkoutUrl),
      transactionId: transaction.id,
    });

    return json({
      checkoutUrl,
      init_point: checkoutUrl,
      transactionId: transaction.id,
    });
  } catch (err) {
    console.error("[mercadopago-create-preference] unexpected error", err);
    return json(
      { error: err instanceof Error ? err.message : "Erro inesperado ao criar a preferência." },
      500,
    );
  }
});
