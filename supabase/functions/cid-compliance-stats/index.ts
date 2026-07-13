// Sprint A / CAT-001 — Edge Function: cid-compliance-stats
// Endpoint admin-only que agrega snapshots do cid-compliance-report para
// alimentar o dashboard: snapshot atual + série temporal para tendência.
//
// GET /functions/v1/cid-compliance-stats?days=30

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getOrCreateCorrelationId } from '../_shared/correlation.ts';
import { makeResponder } from '../_shared/http-response.ts';
import { parseQuery } from '../_shared/validation.ts';
import { z } from 'https://esm.sh/zod@3.23.8';

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

Deno.serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === 'OPTIONS') return R.cors();
  if (req.method !== 'GET') return R.error(405, 'method_not_allowed');

  const url = new URL(req.url);
  const q = parseQuery(url, QuerySchema);
  if (!q.ok) return R.error(400, 'invalid_query', q.issues);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return R.error(401, 'unauthorized');

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const ANON = Deno.env.get('SUPABASE_ANON_KEY');
  if (!SUPABASE_URL || !ANON) return R.error(500, 'internal_error', { reason: 'missing_env' });

  const supabase = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader, 'x-correlation-id': cid } },
  });

  // Snapshots recentes ordenados por captured_at asc (para tendência).
  // RLS já garante admin-only via política da tabela.
  const since = new Date(Date.now() - q.data.days * 86400_000).toISOString();
  const { data: snaps, error } = await supabase
    .from('cid_compliance_snapshots')
    .select('captured_at, commit_sha, branch, coverage_ratio, coverage_pct, total_functions, cid_counts, validation_counts, http_counts, test_counts, by_category, failing_functions')
    .gte('captured_at', since)
    .order('captured_at', { ascending: true });

  if (error) return R.error(500, 'internal_error', { pg: error.message, code: error.code });

  const latest = snaps && snaps.length > 0 ? snaps[snaps.length - 1] : null;

  return R.ok({
    window_days: q.data.days,
    latest,
    trend: (snaps ?? []).map((s) => ({
      t: s.captured_at,
      coverage_ratio: s.coverage_ratio,
      total: s.total_functions,
      ausente: (s.cid_counts as any)?.ausente ?? 0,
      failing: Array.isArray(s.failing_functions) ? (s.failing_functions as unknown[]).length : 0,
      sha: s.commit_sha,
    })),
    count: snaps?.length ?? 0,
  });
});
