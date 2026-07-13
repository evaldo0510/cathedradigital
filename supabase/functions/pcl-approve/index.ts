// Edge Function — pcl-approve (Sprint 1.14 / ADR-010)
// POST { source_id: uuid, reason?: string }
// Transição: validated → approved. Requer admin.
import { handleTransition } from '../_shared/pcl-transition.ts';

export const spec = {
  action: 'approve',
  from: ['validated'] as const,
  to: 'approved' as const,
  requiresReason: false,
};

Deno.serve((req) => handleTransition(req, spec));
