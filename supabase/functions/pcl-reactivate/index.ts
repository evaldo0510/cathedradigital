// Edge Function — pcl-reactivate (Sprint 1.14 / ADR-010)
// POST { source_id: uuid, reason?: string }
// Transição: suspended → active. Requer admin.
// Repopula pcl_activated_by/at (trigger enforce_pcl_active_requires_admin).
import { handleTransition } from '../_shared/pcl-transition.ts';

export const spec = {
  action: 'reactivate',
  from: ['suspended'] as const,
  to: 'active' as const,
  requiresReason: false,
  extras: (userId: string | null) => ({
    pcl_activated_by: userId,
    pcl_activated_at: new Date().toISOString(),
  }),
};

Deno.serve((req) => handleTransition(req, spec));
