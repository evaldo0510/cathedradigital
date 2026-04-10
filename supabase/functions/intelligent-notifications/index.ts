import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Intelligent Notifications Edge Function.
 * Triggers based on inactivity, reflections, and progress.
 * Now with context (last action) and ignore logic.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Get all users who haven't been notified today and have push/whatsapp enabled
    // and weren't notified in the last 20 hours to be safe
    const { data: usersToNotify } = await supabase
      .from("profiles")
      .select("id, name, whatsapp_number, whatsapp_enabled, push_enabled, last_action_at, last_notified_at")
      .or(`last_notified_at.is.null,last_notified_at.lt.${now.toISOString().split('T')[0]}T00:00:00Z`)
      .limit(50); // Process in batches to avoid timeout

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

      // 1. Check "Ignore" logic: max 3 notifications without user returning
      if (user.last_notified_at && lastAction && new Date(user.last_notified_at) > lastAction) {
        const { count: ignoredCount } = await supabase
          .from("intelligent_notification_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gt("sent_at", user.last_action_at);
        
        // If 3 ignored, wait at least 7 days before trying again (unless they come back)
        if (ignoredCount && ignoredCount >= 3) {
          const daysSinceLastNotify = (now.getTime() - new Date(user.last_notified_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastNotify < 7) continue;
        }
      }

      // 2. Get Context (Last activity)
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

      // 3. Determine Notification Type
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
        // Special case: post-reflection (sent shortly after they finish something, but this function runs daily)
        // This might be better triggered by a direct hook, but we include it here for manual runs or specific timing.
        type = "post_reflection";
        title = "🌱 Continue assim";
        message = `${firstName}, você começou algo importante hoje... continue.`;
      }
      else {
        // Progress check (10% chance)
        if (Math.random() < 0.1) {
          type = "progress";
          title = "✨ Reconhecimento";
          message = `${firstName}, você avançou mais do que percebe.`;
        }
      }

      if (type) {
        const fullMessage = `${message}${contextText}`;
        let sentPush = false;
        let sentWhatsapp = false;

        // --- Send Push ---
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

        // --- Send WhatsApp ---
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
            // Log as sent in dev mode/placeholder if no credentials
            console.log(`[WA Placeholder] To: ${user.whatsapp_number} - Msg: ${fullMessage}`);
            sentWhatsapp = true;
          }
        }

        if (sentPush || sentWhatsapp) {
          // Log notification
          await supabase.from("intelligent_notification_logs").insert({
            user_id: user.id,
            type,
            channel: sentPush && sentWhatsapp ? "both" : sentPush ? "push" : "whatsapp",
            content: fullMessage,
            status: "sent",
            metadata: { last_route: lastHistory?.route }
          });

          // Update last_notified_at
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