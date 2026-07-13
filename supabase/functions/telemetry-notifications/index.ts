import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { type, title, details, severity, user_name } = await req.json();

    // Buscar configurações de notificação
    const { data: configData } = await supabase
      .from('telemetry_settings')
      .select('value')
      .eq('key', 'notification_config')
      .single();

    const config = configData?.value || { enabled: false };

    // Notificações de mudança de config SEMPRE são enviadas se houver alvo, independente de 'enabled' (opcional)
    // Ou respeita o 'enabled' global. Vamos respeitar o 'enabled' global.
    if (!config.enabled) {
      return new Response(JSON.stringify({ message: "Notifications disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [];

    // Slack Notification
    if (config.slack_webhook) {
      const slackMessage = {
        text: `*Telemetria Cathedra - ${severity?.toUpperCase() || 'INFO'}*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${title}*\n*Evento:* ${type}\n*Usuário:* ${user_name || 'Sistema'}\n*Severidade:* ${severity || 'info'}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "```" + JSON.stringify(details, null, 2).substring(0, 2000) + "```"
            }
          }
        ]
      };

      try {
        const res = await fetch(config.slack_webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
        if (res.ok) messages.push("Slack sent");
        else console.error("Slack response error:", await res.text());
      } catch (e) {
        console.error("Slack error:", e);
      }
    }

    // Email Notification (Placeholder)
    if (config.email) {
      console.log(`[EMAIL NOTIFICATION] To: ${config.email} - Title: ${title}`);
      messages.push("Email target detected");
    }

    return new Response(JSON.stringify({ success: true, messages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("telemetry-notifications error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
