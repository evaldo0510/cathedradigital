// Edge Function — pcl-activate (Sprint 1.14 / ADR-010)
// POST { source_id: uuid, reason?: string }
// Transição: approved → active. Requer admin.
// Preenche pcl_activated_by/at (exigidos pelo trigger enforce_pcl_active_requires_admin).
import { handleTransition } from '../_shared/pcl-transition.ts';

export const spec = {
  action: 'activate',
  from: ['approved'] as const,
  to: 'active' as const,
  requiresReason: false,
  extras: (userId: string | null) => ({
    pcl_activated_by: userId,
    pcl_activated_at: new Date().toISOString(),
  }),
};

Deno.serve((req) => handleTransition(req, spec));
