// FROZEN — Sprint Zero (Auditoria 3): função congelada.
// Reativação prevista na Sprint S5. NÃO remover — congelamento intencional.
// Sprint A / CAT-001: propaga x-correlation-id + Wave 3 strict envelope.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";
import { makeLogger } from "../_shared/logger.ts";

serve((req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  const log = makeLogger("spiritual-continuity", cid);

  if (req.method === "OPTIONS") return R.cors();

  log.warn("frozen_call");
  return R.error(503, "internal_error", {
    frozen: true,
    reason: "sprint-zero-freeze",
    message: "Serviço de IA temporariamente indisponível.",
  });
});
