import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";

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
  // Sprint A / CAT-001 — correlation_id (ADR-009) + Wave 3 strict envelope
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === "OPTIONS") return R.cors();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const clientIP = getClientIP(req);

  if (isRateLimited(clientIP)) {
    await logSecurityEvent(supabase, {
      type: "RATE_LIMIT_EXCEEDED",
      severity: "warning",
      description: `Rate limit hit for IP: ${clientIP}`,
      metadata: { ip: clientIP, function: "send-notification", correlation_id: cid }
    });
    return R.error(429, "rate_limited");
  }

  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 10240) {
    await logSecurityEvent(supabase, {
      type: "PAYLOAD_TOO_LARGE",
      severity: "critical",
      description: `Payload size ${contentLength} exceeds limit for IP: ${clientIP}`,
      metadata: { ip: clientIP, size: contentLength, function: "send-notification", correlation_id: cid }
    });
    return R.error(413, "invalid_body", { reason: "payload_too_large", size: contentLength });
  }

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
      metadata: { ip: clientIP, correlation_id: cid }
    });
    return R.error(403, "forbidden");
  }

  try {
    const { user_id, title, message, link, type } = await req.json();

    if (!user_id || !title) {
      return R.error(400, "invalid_body", { missing: ["user_id", "title"].filter(k => !({ user_id, title } as any)[k]) });
    }

    const { error } = await supabase.from("notifications").insert({
      user_id,
      title,
      message: message || "",
      link: link || null,
      type: type || "system",
    });

    if (error) throw error;

    return R.raw({ success: true, correlation_id: cid });
  } catch (err) {
    console.error("send-notification error:", err, "cid=", cid);
    return R.error(500, "internal_error", { message: (err as Error).message });
  }
});
