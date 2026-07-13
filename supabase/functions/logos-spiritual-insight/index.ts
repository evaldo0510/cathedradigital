// FROZEN — Sprint Zero (Auditoria 3): função congelada.
// Reativação prevista na Sprint S5. NÃO remover — congelamento intencional.
// Sprint A / CAT-001: propaga x-correlation-id mesmo em modo frozen.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
};

serve((req) => {
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger("logos-spiritual-insight", cid);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, ...cidH } });
  }
  log.warn("frozen_call");
  return new Response(
    JSON.stringify({
      error: "Serviço de IA temporariamente indisponível.",
      frozen: true,
      reason: "sprint-zero-freeze",
      correlation_id: cid,
    }),
    { status: 503, headers: { ...corsHeaders, ...cidH, "Content-Type": "application/json" } },
  );
});
