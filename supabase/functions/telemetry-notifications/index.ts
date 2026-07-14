import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";

Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009) + Wave 3 strict envelope
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === "OPTIONS") return R.cors();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { type, title, details, severity, user_name } = await req.json();

    const { data: configData } = await supabase
      .from('telemetry_settings')
      .select('value')
      .eq('key', 'notification_config')
      .single();

    const config = configData?.value || { enabled: false };

    if (!config.enabled) {
      return R.raw({ message: "Notifications disabled", correlation_id: cid });
    }

    const messages = [];

    if (config.slack_webhook) {
      const slackMessage = {
        text: `*Telemetria Cathedra - ${severity?.toUpperCase() || 'INFO'}* (cid=${cid})`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${title}*\n*Evento:* ${type}\n*Usuário:* ${user_name || 'Sistema'}\n*Severidade:* ${severity || 'info'}\n*Correlation ID:* \`${cid}\``
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
        else console.error("Slack response error cid=", cid, await res.text());
      } catch (e) {
        console.error("Slack error cid=", cid, e);
      }
    }

    if (config.email) {
      console.log(`[EMAIL NOTIFICATION] cid=${cid} To: ${config.email} - Title: ${title}`);
      messages.push("Email target detected");
    }

    return R.raw({ success: true, messages, correlation_id: cid });
  } catch (err) {
    console.error("telemetry-notifications error cid=", cid, err);
    return R.error(500, "internal_error", { message: (err as Error).message });
  }
});
