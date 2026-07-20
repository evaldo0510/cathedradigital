// Temporary internal trigger: chama bible-canon-diagnose com o CRON_SECRET do projeto.
// Uso: POST vazio via anon; retorna o resultado do run.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const cron = Deno.env.get("CRON_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/functions/v1/bible-canon-diagnose`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cron-secret": cron,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
    body: JSON.stringify({ action: "run" }),
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
