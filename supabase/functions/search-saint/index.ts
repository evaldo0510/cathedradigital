// FROZEN — Sprint Zero (Auditoria 3): função congelada.
// Reativação prevista na Sprint S5. NÃO remover — congelamento intencional.
// Sprint A / CAT-001: propaga x-correlation-id mesmo em modo frozen.
// A2.b Wave 1: envelope de erro estrito ({error, correlation_id, details?}).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";
import { makeResponder } from "../_shared/http-response.ts";

serve((req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  const log = makeLogger("search-saint", cid);

  if (req.method === "OPTIONS") return R.cors();

  log.warn("frozen_call");
  return R.error(503, 'not_found', {
    message: "Serviço de IA temporariamente indisponível.",
    frozen: true,
    reason: "sprint-zero-freeze",
  });
});
