// Edge Function — pcl-revoke (Sprint 1.14 / ADR-010)
// POST { source_id: uuid, reason: string (obrigatório) }
// Transição: active | suspended → revoked. Requer admin.
// Confirmação dupla é responsabilidade do frontend (UI).
import { handleTransition } from '../_shared/pcl-transition.ts';

export const spec = {
  action: 'revoke',
  from: ['active', 'suspended'] as const,
  to: 'revoked' as const,
  requiresReason: true,
};

Deno.serve((req) => handleTransition(req, spec));
