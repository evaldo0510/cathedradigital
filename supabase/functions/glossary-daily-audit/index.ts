/**
 * Sprint 6.6 — Auditoria diária de qualidade editorial do Glossário.
 *
 * POST /functions/v1/glossary-daily-audit  { trigger?: 'manual'|'cron' }
 *   → chama compute_glossary_editorial_snapshot() e devolve o snapshot recém-criado
 *     + o anterior (para diff de regressões).
 *
 * Autenticação: usuário admin OU x-cron-secret (para pg_cron).
 * Envelope simples (não estrito) para consumo direto pela UI /admin/editorial-audit.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ANON = Deno.env.get('SUPABASE_ANON_KEY');
  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
    return json({ error: 'missing_env' }, 500);
  }

  // Auth: admin (via user JWT) OU cron secret
  const cronHdr = req.headers.get('x-cron-secret');
  const authHdr = req.headers.get('Authorization');
  let allowed = false;

  if (CRON_SECRET && cronHdr && cronHdr === CRON_SECRET) {
    allowed = true;
  } else if (authHdr) {
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHdr } },
    });
    const { data: isAdmin, error: eA } = await userClient.rpc('is_current_user_admin');
    if (!eA && isAdmin === true) allowed = true;
  }
  if (!allowed) return json({ error: 'forbidden' }, 403);

  let trigger = 'manual';
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.trigger === 'string') trigger = body.trigger.slice(0, 32);
  } catch { /* ignore */ }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Snapshot anterior (para o cliente comparar textualmente se quiser)
  const { data: prev } = await admin
    .from('editorial_snapshots')
    .select('id, captured_at, avg_ice, avg_editorial, avg_nexus, gold, review, gate_passing, gate_failing')
    .eq('module', 'glossary')
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: newId, error } = await admin.rpc('compute_glossary_editorial_snapshot', {
    _trigger: trigger,
  });
  if (error) return json({ error: 'snapshot_failed', detail: error.message }, 500);

  const { data: current, error: eC } = await admin
    .from('editorial_snapshots')
    .select('*')
    .eq('id', newId)
    .single();
  if (eC) return json({ error: 'fetch_failed', detail: eC.message }, 500);

  return json({ ok: true, current, previous: prev ?? null });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
