// Edge Function — pcl-expire (Sprint 1.14 / ADR-010)
// POST { source_id: uuid, reason?: string }
// Transição: active → expired. Requer admin.
// Nesta sprint, expiração é manual (D4 do ADR-010). Automação em ADR futuro.
import { handleTransition } from '../_shared/pcl-transition.ts';

export const spec = {
  action: 'expire',
  from: ['active'] as const,
  to: 'expired' as const,
  requiresReason: false,
};

Deno.serve((req) => handleTransition(req, spec));
