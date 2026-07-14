import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
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

/**
 * Retention notifications edge function. Cron-triggered.
 */
Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009) + Wave 3 strict envelope
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === "OPTIONS") return R.cors();

  try {
    const clientIP = getClientIP(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (isRateLimited(clientIP)) {
      await logSecurityEvent(supabase, {
        type: "RATE_LIMIT_EXCEEDED",
        severity: "warning",
        description: `Rate limit hit for IP: ${clientIP}`,
        metadata: { ip: clientIP, function: "retention-notifications", correlation_id: cid }
      });
      return R.error(429, "rate_limited");
    }

    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 2048) {
      await logSecurityEvent(supabase, {
        type: "PAYLOAD_TOO_LARGE",
        severity: "critical",
        description: `Payload size ${contentLength} exceeds limit for IP: ${clientIP}`,
        metadata: { ip: clientIP, size: contentLength, function: "retention-notifications", correlation_id: cid }
      });
      return R.error(413, "invalid_body", { reason: "payload_too_large", size: contentLength });
    }

    const authHeader = req.headers.get("authorization") || "";
    const providedBearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
    const cronSecret = Deno.env.get("CRON_SECRET") || "";
    const cronSecretHeader = req.headers.get("x-cron-secret") || "";
    const isServiceRole = providedBearer && providedBearer === serviceRoleKey;
    const isCronSecret = cronSecret && cronSecretHeader === cronSecret;
    if (!isServiceRole && !isCronSecret) {
      await logSecurityEvent(supabase, {
        type: "UNAUTHORIZED_ACCESS",
        severity: "critical",
        description: `Unauthorized attempt to call retention-notifications from IP: ${clientIP}`,
        metadata: { ip: clientIP, correlation_id: cid }
      });
      return R.error(403, "forbidden");
    }

    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const todayStr = now.toISOString().split("T")[0];

    const { data: activeUsers } = await supabase
      .from("profiles")
      .select("id, name, last_visit")
      .gte("last_visit", threeDaysAgo.toISOString())
      .not("last_visit", "is", null);

    const { data: inactiveUsers } = await supabase
      .from("profiles")
      .select("id, name, last_visit")
      .lt("last_visit", threeDaysAgo.toISOString())
      .not("last_visit", "is", null);

    let sentReminders = 0;
    let sentReengagement = 0;

    if (activeUsers?.length) {
      for (const user of activeUsers) {
        const { data: progress } = await supabase
          .from("journey_progress")
          .select("journey_id, step_id")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(1);

        if (!progress?.length) continue;

        const lastJourneyId = progress[0].journey_id;

        const { count: totalSteps } = await supabase
          .from("journey_steps")
          .select("id", { count: "exact", head: true })
          .eq("journey_id", lastJourneyId);

        const { count: completedSteps } = await supabase
          .from("journey_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("journey_id", lastJourneyId);

        if ((completedSteps ?? 0) < (totalSteps ?? 0)) {
          const firstName = user.name?.split(" ")[0] || "";
          const stepNumber = (completedSteps ?? 0) + 1;

          const { count: todayNotifs } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "journey_reminder")
            .gte("created_at", `${todayStr}T00:00:00`);

          if ((todayNotifs ?? 0) === 0) {
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "journey_reminder",
              title: "🌱 Continue sua jornada",
              message: `${firstName}, o dia ${stepNumber} te espera. Cada passo conta.`,
              link: "/jornadas",
            });

            try {
              await supabase.functions.invoke("send-push", {
                body: {
                  user_id: user.id,
                  title: "🌱 Continue sua jornada",
                  body: `${firstName}, o dia ${stepNumber} te espera. Cada passo conta.`,
                  url: "/jornadas",
                },
                headers: { "x-correlation-id": cid },
              });
            } catch (_) { }

            sentReminders++;
          }
        }
      }
    }

    if (inactiveUsers?.length) {
      for (const user of inactiveUsers) {
        const firstName = user.name?.split(" ")[0] || "";
        const daysSince = Math.floor(
          (now.getTime() - new Date(user.last_visit!).getTime()) / (1000 * 60 * 60 * 24)
        );

        const { count: recentNotifs } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "reengagement")
          .gte("created_at", threeDaysAgo.toISOString());

        if ((recentNotifs ?? 0) > 0) continue;

        let title: string;
        let message: string;

        if (daysSince >= 7) {
          title = "💭 Sentimos sua falta";
          message = `${firstName}, algo ficou aberto na sua jornada. Volte quando estiver pronto.`;
        } else {
          title = "🕊️ Você parou no meio do caminho";
          message = `${firstName}, sua jornada continua aqui. Um passo de cada vez.`;
        }

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "reengagement",
          title,
          message,
          link: "/jornadas",
        });

        try {
          await supabase.functions.invoke("send-push", {
            body: {
              user_id: user.id,
              title,
              body: message,
              url: "/jornadas",
            },
            headers: { "x-correlation-id": cid },
          });
        } catch (_) { }

        sentReengagement++;
      }
    }

    return R.raw({
      sentReminders,
      sentReengagement,
      activeUsers: activeUsers?.length ?? 0,
      inactiveUsers: inactiveUsers?.length ?? 0,
      correlation_id: cid,
    });
  } catch (err) {
    console.error("retention-notifications error cid=", cid, err);
    return R.error(500, "internal_error", { message: (err as Error).message });
  }
});
