import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

// Rate limiter
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

Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const clientIP = getClientIP(req);
  
  // 1. Check Rate Limit
  if (isRateLimited(clientIP)) {
    await logSecurityEvent(supabase, {
      type: "RATE_LIMIT_EXCEEDED",
      severity: "warning",
      description: `Rate limit hit for IP: ${clientIP}`,
      metadata: { ip: clientIP, function: "send-notification" }
    });
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
    );
  }

  // 2. Check Payload Size
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 10240) { // 10KB
    await logSecurityEvent(supabase, {
      type: "PAYLOAD_TOO_LARGE",
      severity: "critical",
      description: `Payload size ${contentLength} exceeds limit for IP: ${clientIP}`,
      metadata: { ip: clientIP, size: contentLength, function: "send-notification" }
    });
    return new Response(
      JSON.stringify({ error: "Payload too large" }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
      description: `Unauthorized attempt to call send-notification from IP: ${clientIP}`,
      metadata: { ip: clientIP }
    });
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { user_id, title, message, link, type } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const { error } = await supabase.from("notifications").insert({
      user_id,
      title,
      message: message || "",
      link: link || null,
      type: type || "system",
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
