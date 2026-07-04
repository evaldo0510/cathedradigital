// FROZEN — Sprint Zero (Auditoria 3): função congelada para eliminar exposição
// de GOOGLE_API_KEY e superfície de IA fora do roadmap ativo.
// Reativação prevista na Sprint S5. NÃO remover — congelamento intencional.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({
      error: "Serviço de IA temporariamente indisponível.",
      frozen: true,
      reason: "sprint-zero-freeze",
    }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
