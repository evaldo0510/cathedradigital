import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
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
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

async function logSecurityEvent(supabase: any, event: { type: string, severity: string, description: string, metadata?: any }) {
  console.log(`[SECURITY ${event.severity.toUpperCase()}] ${event.type}: ${event.description}`);
  try {
    await supabase.from("security_audit_logs").insert({
      event_type: event.type,
      severity: event.severity,
      description: event.description,
      metadata: event.metadata || {}
    });
  } catch (err) {
    console.error("Failed to log security event:", err);
  }
}

const VAPID_PUBLIC_KEY = "BKVIOXhXSUD1UyFZHbRue5ITwT0pn-v5RdvHYwpYIMkKJ1VrRPWuHpckyeg8K_61LrN4t9tdzYp4OC5wkdbJ2Z4";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = "mailto:cathedra@cathedradigital.app";

// Web Push crypto helpers
async function generateJWT(audience: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400,
    sub: VAPID_SUBJECT,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  // Import private key
  const rawKey = Uint8Array.from(
    atob(VAPID_PRIVATE_KEY.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    await derEncodePrivateKey(rawKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signingInput = enc.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signingInput
  );

  // Convert DER signature to raw
  const rawSig = derToRaw(new Uint8Array(signature));
  const sigB64 = btoa(String.fromCharCode(...rawSig)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

// DER encode a raw 32-byte private key into PKCS8
async function derEncodePrivateKey(raw: Uint8Array): Promise<ArrayBuffer> {
  // PKCS8 wrapper for EC P-256 private key
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const result = new Uint8Array(prefix.length + raw.length);
  result.set(prefix);
  result.set(raw, prefix.length);
  return result.buffer;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // Simple DER to raw r||s conversion
  const raw = new Uint8Array(64);
  let offset = 2;
  // r
  let rLen = der[offset + 1];
  let rOffset = offset + 2;
  if (rLen === 33) { rOffset++; rLen = 32; }
  raw.set(der.slice(rOffset, rOffset + Math.min(rLen, 32)), 32 - Math.min(rLen, 32));
  // s
  offset = rOffset + rLen;
  let sLen = der[offset + 1];
  let sOffset = offset + 2;
  if (sLen === 33) { sOffset++; sLen = 32; }
  raw.set(der.slice(sOffset, sOffset + Math.min(sLen, 32)), 64 - Math.min(sLen, 32));
  return raw;
}

async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await generateJWT(audience);

    const body = JSON.stringify(payload);

    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "identity",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body,
    });

    if (!res.ok) {
      console.error(`Push failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Push error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const clientIP = getClientIP(req);

  if (isRateLimited(clientIP)) {
    await logSecurityEvent(supabase, {
      type: "RATE_LIMIT_EXCEEDED",
      severity: "warning",
      description: `Rate limit hit for IP: ${clientIP}`,
      metadata: { ip: clientIP, function: "send-push" }
    });
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: corsHeaders });
  }

  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 10240) {
    await logSecurityEvent(supabase, {
      type: "PAYLOAD_TOO_LARGE",
      severity: "critical",
      description: `Payload size ${contentLength} exceeds limit for IP: ${clientIP}`,
      metadata: { ip: clientIP, size: contentLength, function: "send-push" }
    });
    return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("authorization") || "";
  const providedBearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  const cronSecretHeader = req.headers.get("x-cron-secret") || "";
  
  const isServiceRole = providedBearer.length > 0 && providedBearer === serviceRoleKey;
  const isCronSecret = cronSecret.length > 0 && cronSecretHeader === cronSecret;
  if (!isServiceRole && !isCronSecret) {
    await logSecurityEvent(supabase, {
      type: "UNAUTHORIZED_ACCESS",
      severity: "critical",
      description: `Unauthorized attempt to call send-push from IP: ${clientIP}`,
      metadata: { ip: clientIP }
    });
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { mode, user_id, title, body: msgBody, url: msgUrl } = await req.json();
    const payload = {
      title: title || "📖 Liturgia do Dia",
      body: msgBody || "Pare por um instante... hoje Deus quer falar com você.",
      url: msgUrl || "/liturgia",
    };

    let subscriptions: any[] = [];
    if (mode === "broadcast") {
      const { data } = await supabase.from("push_subscriptions").select("*");
      subscriptions = data || [];
    } else if (user_id) {
      const { data } = await supabase.from("push_subscriptions").select("*").eq("user_id", user_id);
      subscriptions = data || [];
    }

    console.log(`Sending push to ${subscriptions.length} subscriber(s)`);
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushToSubscription(sub, payload))
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.length - sent;

    return new Response(
      JSON.stringify({ sent, failed, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
