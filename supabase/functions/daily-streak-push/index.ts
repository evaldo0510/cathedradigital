import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

/**
 * Daily streak push notification.
 * Call this via a cron job (e.g. Supabase pg_cron or external scheduler).
 * It sends a personalized push to all users with push subscriptions.
 */
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

    // Require either the service-role bearer token (used by pg_cron / admin invocations)
    // or a matching CRON_SECRET header. Reject all other callers.
    const authHeader = req.headers.get("authorization") || "";
    const providedBearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const cronSecretHeader = req.headers.get("x-cron-secret") || "";
    const cronSecret = Deno.env.get("CRON_SECRET") || "";

    const isServiceRole = providedBearer && providedBearer === serviceRoleKey;
    const isCronSecret = cronSecret && cronSecretHeader === cronSecret;

    if (!isServiceRole && !isCronSecret) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all users with push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("user_id");

    if (!subscriptions?.length) {
      return new Response(
        JSON.stringify({ message: "No subscribers", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set(subscriptions.map((s) => s.user_id))];

    // Get profiles to personalize messages
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, streak")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Send push to each user via the send-push function
    let sent = 0;
    for (const userId of userIds) {
      const profile = profileMap.get(userId);
      const streak = profile?.streak || 0;
      const name = profile?.name?.split(" ")[0] || "";

      let title: string;
      let body: string;

      if (streak >= 7) {
        title = `🔥 ${streak} dias de streak!`;
        body = `${name}, você está em chamas! Não quebre a sequência — a leitura de hoje te espera.`;
      } else if (streak >= 3) {
        title = `✨ ${streak} dias seguidos!`;
        body = `${name}, continue firme! Sua leitura e oração do dia estão prontas.`;
      } else if (streak === 0) {
        title = "📖 Comece hoje sua jornada";
        body = `${name}, Deus tem uma palavra para você hoje. Venha ler!`;
      } else {
        title = "🙏 Hora da leitura diária";
        body = `${name}, mantenha seu streak de ${streak} dia${streak > 1 ? "s" : ""}! A Palavra te aguarda.`;
      }

      try {
        await supabase.functions.invoke("send-push", {
          body: {
            user_id: userId,
            title,
            body,
            url: "/hoje",
          },
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send push to ${userId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: userIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("daily-streak-push error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});