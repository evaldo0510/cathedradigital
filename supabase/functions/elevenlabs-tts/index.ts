import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- Auth check ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // Restrict TTS to premium users (matches logos-ai access model)
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
      console.error("ELEVEN_LABS_API_KEY is not configured");
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
      console.error("ElevenLabs error:", response.status, errorText);
      return json({ error: "Failed to generate audio" }, response.status);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS function error:", error);
    return json({ error: "Erro interno. Tente novamente." }, 500);
  }
});
