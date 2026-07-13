import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger("elevenlabs-tts", cid);
  const headers = { ...corsHeaders, ...cidH };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify({ ...(body as object), correlation_id: cid }), {
      status,
      headers: { ...headers, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response(null, { headers });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader, "x-correlation-id": cid } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.is_premium) {
      return json({ error: "Recurso disponível apenas para assinantes PRO." }, 403);
    }

    const { text, voice_id = "21m00Tcm4lJC7Gz71S1T" } = await req.json();

    if (typeof text !== "string" || text.trim().length === 0 || text.length > 5000) {
      return json({ error: "Texto inválido (1–5000 caracteres)." }, 400);
    }
    if (typeof voice_id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(voice_id)) {
      return json({ error: "voice_id inválido." }, 400);
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!ELEVEN_LABS_API_KEY) {
      log.error("missing_api_key");
      return json({ error: "TTS service is not configured" }, 500);
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("elevenlabs_error", { status: response.status, body: errorText.slice(0, 200) });
      return json({ error: "Failed to generate audio" }, response.status);
    }

    return new Response(response.body, {
      headers: { ...headers, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    log.error("unhandled", { err: String(error) });
    return json({ error: "Erro interno. Tente novamente." }, 500);
  }
});
