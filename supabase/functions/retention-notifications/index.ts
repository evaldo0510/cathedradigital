import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Retention notifications edge function.
 * Triggered daily via pg_cron.
 * 
 * 1. Active journey users → daily reminder to continue
 * 2. Users inactive 3+ days → re-engagement message
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
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const todayStr = now.toISOString().split("T")[0];

    // 1. Daily journey reminder: users with active journey progress (visited in last 2 days)
    const { data: activeUsers } = await supabase
      .from("profiles")
      .select("id, name, last_visit")
      .gte("last_visit", threeDaysAgo.toISOString())
      .not("last_visit", "is", null);

    // 2. Inactive users: last visit > 3 days ago
    const { data: inactiveUsers } = await supabase
      .from("profiles")
      .select("id, name, last_visit")
      .lt("last_visit", threeDaysAgo.toISOString())
      .not("last_visit", "is", null);

    let sentReminders = 0;
    let sentReengagement = 0;

    // --- Daily journey reminders for active users ---
    if (activeUsers?.length) {
      for (const user of activeUsers) {
        // Check if user has an ongoing journey (has progress but hasn't completed all steps)
        const { data: progress } = await supabase
          .from("journey_progress")
          .select("journey_id, step_id")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(1);

        if (!progress?.length) continue;

        const lastJourneyId = progress[0].journey_id;

        // Check if journey is complete
        const { count: totalSteps } = await supabase
          .from("journey_steps")
          .select("id", { count: "exact", head: true })
          .eq("journey_id", lastJourneyId);

        const { count: completedSteps } = await supabase
          .from("journey_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("journey_id", lastJourneyId);

        // Only notify if journey is NOT complete
        if ((completedSteps ?? 0) < (totalSteps ?? 0)) {
          const firstName = user.name?.split(" ")[0] || "";
          const stepNumber = (completedSteps ?? 0) + 1;

          // Check if we already sent a notification today
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

            // Also send push if subscribed
            try {
              await supabase.functions.invoke("send-push", {
                body: {
                  user_id: user.id,
                  title: "🌱 Continue sua jornada",
                  body: `${firstName}, o dia ${stepNumber} te espera. Cada passo conta.`,
                  url: "/jornadas",
                },
              });
            } catch (_) { /* push is best-effort */ }

            sentReminders++;
          }
        }
      }
    }

    // --- Re-engagement for inactive users (3+ days) ---
    if (inactiveUsers?.length) {
      for (const user of inactiveUsers) {
        const firstName = user.name?.split(" ")[0] || "";
        const daysSince = Math.floor(
          (now.getTime() - new Date(user.last_visit!).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only send once per 3-day cycle (avoid spamming)
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

        // Push notification
        try {
          await supabase.functions.invoke("send-push", {
            body: {
              user_id: user.id,
              title,
              body: message,
              url: "/jornadas",
            },
          });
        } catch (_) { /* best-effort */ }

        sentReengagement++;
      }
    }

    return new Response(
      JSON.stringify({
        sentReminders,
        sentReengagement,
        activeUsers: activeUsers?.length ?? 0,
        inactiveUsers: inactiveUsers?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("retention-notifications error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
