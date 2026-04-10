import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Intelligent Notifications Edge Function.
 * Triggers based on inactivity, reflections, and progress.
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
    const { data: usersToNotify } = await supabase
      .from("profiles")
      .select("id, name, whatsapp_number, whatsapp_enabled, push_enabled, last_action_at, last_notified_at")
      .or(`last_notified_at.is.null,last_notified_at.lt.${todayStr}T00:00:00Z`);

    if (!usersToNotify || usersToNotify.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsSent = 0;

    for (const user of usersToNotify) {
      let type: string | null = null;
      let title: string = "";
      let message: string = "";
      const firstName = user.name?.split(" ")[0] || "";

      const lastAction = user.last_action_at ? new Date(user.last_action_at) : null;
      const hoursSinceAction = lastAction ? (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60) : 0;

      // 1. 48h Inactivity check
      if (hoursSinceAction >= 48 && hoursSinceAction < 52) {
        type = "inactivity_48h";
        title = "🕊️ Algo especial...";
        message = `${firstName}, você não parou por acaso... havia algo sendo construído.`;
      } 
      // 2. 24h Inactivity check
      else if (hoursSinceAction >= 24 && hoursSinceAction < 28) {
        type = "inactivity_24h";
        title = "🕊️ Um momento para você";
        message = `${firstName}, algo ficou aberto dentro de você...`;
      }
      // 3. Pós-reflexão check (recent action < 1h)
      else if (hoursSinceAction > 0 && hoursSinceAction < 1) {
        type = "post_reflection";
        title = "🌱 Continue assim";
        message = `${firstName}, você começou algo importante hoje... continue.`;
      }
      // 4. Progress check (randomly or based on logic)
      else if (hoursSinceAction > 2 && hoursSinceAction < 24) {
        // Only 10% chance to send a progress notification to avoid spamming
        if (Math.random() < 0.1) {
          type = "progress";
          title = "✨ Reconhecimento";
          message = `${firstName}, você avançou mais do que percebe.`;
        }
      }

      if (type) {
        // Send Notification
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
                body: message,
                url: "/jornadas",
              }),
            });
            if (pushRes.ok) sentPush = true;
          } catch (e) {
            console.error(`Failed to send push to ${user.id}:`, e);
          }
        }

        // --- Send WhatsApp ---
        if (user.whatsapp_enabled && user.whatsapp_number) {
          // Placeholder for WhatsApp API
          console.log(`Sending WhatsApp to ${user.whatsapp_number}: ${message}`);
          // Example: await sendWhatsapp(user.whatsapp_number, message);
          sentWhatsapp = true;
        }

        if (sentPush || sentWhatsapp) {
          // Log notification
          await supabase.from("intelligent_notification_logs").insert({
            user_id: user.id,
            type,
            channel: sentPush && sentWhatsapp ? "both" : sentPush ? "push" : "whatsapp",
            content: message,
            status: "sent",
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
