import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";

/**
 * Daily streak push notification. Cron-triggered.
 */
Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009) + Wave 3 strict envelope
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === "OPTIONS") return R.cors();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    const providedBearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const cronSecretHeader = req.headers.get("x-cron-secret") || "";
    const cronSecret = Deno.env.get("CRON_SECRET") || "";

    const isServiceRole = providedBearer && providedBearer === serviceRoleKey;
    const isCronSecret = cronSecret && cronSecretHeader === cronSecret;

    if (!isServiceRole && !isCronSecret) {
      return R.error(403, "forbidden");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("user_id");

    if (!subscriptions?.length) {
      return R.raw({ message: "No subscribers", sent: 0, correlation_id: cid });
    }

    const userIds = [...new Set(subscriptions.map((s) => s.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, streak")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

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
          headers: { "x-correlation-id": cid },
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send push to ${userId} cid=${cid}:`, err);
      }
    }

    return R.raw({ sent, total: userIds.length, correlation_id: cid });
  } catch (err) {
    console.error("daily-streak-push error cid=", cid, err);
    return R.error(500, "internal_error", { message: (err as Error).message });
  }
});
