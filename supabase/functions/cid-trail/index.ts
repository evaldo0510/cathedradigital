// Sprint A / CAT-001 — Edge Function: cid-trail
// Endpoint protegido (admin-only) que retorna a jornada completa de um
// correlation_id em JSON, unindo governance_audit_log, bible_cache_metric_events
// e, opcionalmente, core_audit_logs + bible_cache_alerts + bible_integrity_reports.
//
// Uso:
//   GET /functions/v1/cid-trail?cid=<CID>&include_responses=true
//   Authorization: Bearer <JWT do admin>
//
// Segurança:
//   - Requer JWT (verify_jwt=true — configurado abaixo)
//   - A RPC `get_correlation_trail` já filtra por `is_current_user_admin()`
//     e retorna zero linhas para não-admin.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getOrCreateCorrelationId } from '../_shared/correlation.ts';
import { makeResponder } from '../_shared/http-response.ts';
import { parseQuery } from '../_shared/validation.ts';
import { z } from 'https://esm.sh/zod@3.23.8';

const QuerySchema = z.object({
  cid: z.string().min(1).max(128),
  include_responses: z.enum(['true', 'false']).optional().default('false'),
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

  const { data, error } = await supabase.rpc('get_correlation_trail', {
    _cid: q.data.cid,
    _include_responses: q.data.include_responses === 'true',
  });

  if (error) {
    return R.error(500, 'internal_error', { pg: error.message, code: error.code });
  }

  return R.ok({
    cid: q.data.cid,
    include_responses: q.data.include_responses === 'true',
    events: data ?? [],
    count: (data ?? []).length,
  });
});
