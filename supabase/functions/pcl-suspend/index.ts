// Edge Function — pcl-suspend (Sprint 1.14 / ADR-010)
// POST { source_id: uuid, reason: string (obrigatório) }
// Transição: active → suspended. Requer admin.
import { handleTransition } from '../_shared/pcl-transition.ts';

export const spec = {
  action: 'suspend',
  from: ['active'] as const,
  to: 'suspended' as const,
  requiresReason: true,
};

Deno.serve((req) => handleTransition(req, spec));
