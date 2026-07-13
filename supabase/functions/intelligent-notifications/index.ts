import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

// Rate limiter: max requests per window
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
 * Intelligent Notifications Edge Function.
 * Triggers based on inactivity, reflections, and progress.
 */
Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 2048) {
      return new Response(
        JSON.stringify({ error: "Payload too large" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
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
        description: `Unauthorized attempt to call intelligent-notifications from IP: ${clientIP}`,
        metadata: { ip: clientIP }
      });
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const now = new Date();

    // Get all users who haven't been notified today and have push/whatsapp enabled
    const { data: usersToNotify } = await supabase
      .from("profiles")
      .select("id, name, whatsapp_number, whatsapp_enabled, push_enabled, last_action_at, last_notified_at, notification_settings")
      .or(`last_notified_at.is.null,last_notified_at.lt.${now.toISOString().split('T')[0]}T00:00:00Z`)
      .limit(50);

    if (!usersToNotify || usersToNotify.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsSent = 0;

    for (const user of usersToNotify) {
      const firstName = user.name?.split(" ")[0] || "Peregrino";
      const lastAction = user.last_action_at ? new Date(user.last_action_at) : null;
      const hoursSinceAction = lastAction ? (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60) : 999;

      if (user.last_notified_at && lastAction && new Date(user.last_notified_at) > lastAction) {
        const { count: ignoredCount } = await supabase
          .from("intelligent_notification_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gt("sent_at", user.last_action_at);
        
        if (ignoredCount && ignoredCount >= 3) {
          const daysSinceLastNotify = (now.getTime() - new Date(user.last_notified_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastNotify < 7) continue;
        }
      }

      const { data: lastHistory } = await supabase
        .from("user_history")
        .select("title, route")
        .eq("user_id", user.id)
        .order("visited_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const contextText = lastHistory?.title ? `\n\nSua última reflexão foi sobre: ${lastHistory.title}` : "";

      let type: string | null = null;
      let title: string = "";
      let message: string = "";

      if (hoursSinceAction >= 48 && hoursSinceAction < 72) {
        type = "inactivity_48h";
        title = "🕊️ Algo especial...";
        message = `${firstName}, você não parou por acaso... havia algo sendo construído.`;
      } 
      else if (hoursSinceAction >= 24 && hoursSinceAction < 48) {
        type = "inactivity_24h";
        title = "🕊️ Um momento para você";
        message = `${firstName}, algo ficou aberto dentro de você...`;
      }
      else if (hoursSinceAction < 1) {
        type = "post_reflection";
        title = "🌱 Continue assim";
        message = `${firstName}, você começou algo importante hoje... continue.`;
      }
      else if (Math.random() < 0.1) {
        type = "progress";
        title = "✨ Reconhecimento";
        message = `${firstName}, você avançou mais do que percebe.`;
      }

      if (type) {
        const fullMessage = `${message}${contextText}`;
        const emailEnabled = user.notification_settings?.email_reminders;
        let sentPush = false;
        let sentWhatsapp = false;
        let sentEmail = false;

        if (user.push_enabled) {
          try {
            const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                user_id: user.id,
                title,
                body: fullMessage,
                url: lastHistory?.route || "/jornadas",
              }),
            });
            if (pushRes.ok) sentPush = true;
          } catch (e) {
            console.error(`Failed to send push to ${user.id}:`, e);
          }
        }

        if (emailEnabled) {
           // Lovable Email Placeholder
           // In a real scenario, we'd use a transactional email tool or edge function
           console.log(`[EMAIL Placeholder] To: ${user.id} - Msg: ${fullMessage}`);
           sentEmail = true;
        }

        if (user.whatsapp_enabled && user.whatsapp_number) {
          const waUrl = Deno.env.get("WHATSAPP_API_URL");
          const waToken = Deno.env.get("WHATSAPP_API_TOKEN");
          const waInstance = Deno.env.get("WHATSAPP_INSTANCE_NAME");

          if (waUrl && waToken && waInstance) {
            try {
              const waRes = await fetch(`${waUrl}/message/sendText/${waInstance}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: waToken,
                },
                body: JSON.stringify({
                  number: user.whatsapp_number,
                  text: `*${title}*\n\n${fullMessage}`,
                }),
              });
              if (waRes.ok) sentWhatsapp = true;
            } catch (e) {
              console.error(`Failed to send WhatsApp to ${user.whatsapp_number}:`, e);
            }
          } else {
            console.log(`[WA Placeholder] To: ${user.whatsapp_number} - Msg: ${fullMessage}`);
            sentWhatsapp = true;
          }
        }

        if (sentPush || sentWhatsapp || sentEmail) {
          await supabase.from("intelligent_notification_logs").insert({
            user_id: user.id,
            type,
            channel: sentPush && sentWhatsapp ? "all" : sentEmail ? "email" : sentPush ? "push" : "whatsapp",
            content: fullMessage,
            status: "sent",
            metadata: { last_route: lastHistory?.route }
          });

          await supabase
            .from("profiles")
            .update({ last_notified_at: now.toISOString() })
            .eq("id", user.id);

          notificationsSent++;
        }
      }
    }

    return new Response(JSON.stringify({ notificationsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("intelligent-notifications error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
