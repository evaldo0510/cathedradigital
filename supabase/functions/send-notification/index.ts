import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiter: max requests per window (in-memory, resets on cold start)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20; // max requests
const RATE_WINDOW_MS = 60_000; // per minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) rateLimitMap.delete(k);
    }
  }
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

/**
 * Secure notification sender — bypasses RLS using service role.
 * Called internally by other edge functions or by admin users.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" }, status: 429 }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require either the service-role bearer (internal calls) or an admin JWT
    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let authorized = bearer && bearer === serviceRoleKey;
    if (!authorized && bearer) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: roleRow } = await userClient
          .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        authorized = !!roleRow;
      }
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, message, link, type } = await req.json();

    // Input validation
    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "user_id and title are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (link && !link.startsWith("/") && !link.startsWith("https://")) {
      return new Response(
        JSON.stringify({ error: "Invalid link format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { error } = await supabase.from("notifications").insert({
      user_id,
      title,
      message: message || "",
      link: link || null,
      type: type || "system",
    });

    if (error) {
      console.error("Notification insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
