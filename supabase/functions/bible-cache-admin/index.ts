// Admin endpoint para inspecionar e operar o cache L2 da Bíblia.
// Requer JWT válido + role 'admin' em user_roles.
//
// Ações (POST {action: ...}):
//   - 'stats'       → contagens (total / fresh / stale) e métricas básicas
//   - 'list'        → lista entradas paginadas (cache_key, version, expires_at, fresh, age_s, bytes)
//   - 'purge'       → remove uma entrada (cache_key) ou bulk por prefixo (prefix)
//   - 'warm'        → dispara warm de {abbrev, chapter} ou lista [{abbrev,chapter},...]
//
// IMPORTANTE: sem `verify_jwt = false`. O JWT do usuário é validado em código.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserFromJwt(jwt: string) {
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function assertAdmin(userId: string) {
  const { data } = await admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!authHeader) return json({ error: 'missing_authorization' }, 401);

  const user = await getUserFromJwt(authHeader);
  if (!user) return json({ error: 'invalid_token' }, 401);

  const isAdmin = await assertAdmin(user.id);
  if (!isAdmin) return json({ error: 'forbidden', detail: 'admin role required' }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* noop */ }
  const action = String(body?.action || 'stats');

  try {
    if (action === 'stats') {
      const now = new Date().toISOString();
      const [{ count: total }, { count: fresh }] = await Promise.all([
        admin.from('bible_cache_l2').select('*', { count: 'exact', head: true }),
        admin.from('bible_cache_l2').select('*', { count: 'exact', head: true }).gt('expires_at', now),
      ]);
      return json({
        total: total ?? 0,
        fresh: fresh ?? 0,
        stale: Math.max(0, (total ?? 0) - (fresh ?? 0)),
        now,
      });
    }

    if (action === 'list') {
      const limit = Math.min(Number(body?.limit) || 100, 500);
      const offset = Math.max(0, Number(body?.offset) || 0);
      const prefix = typeof body?.prefix === 'string' ? body.prefix : null;
      let q = admin
        .from('bible_cache_l2')
        .select('cache_key, version, expires_at, created_at, hash')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (prefix) q = q.like('cache_key', `${prefix}%`);
      const { data, error } = await q;
      if (error) return json({ error: 'query_failed', detail: error.message }, 500);
      const now = Date.now();
      const rows = (data || []).map((r) => {
        const expMs = r.expires_at ? new Date(r.expires_at).getTime() : 0;
        const createdMs = r.created_at ? new Date(r.created_at).getTime() : now;
        return {
          cache_key: r.cache_key,
          version: r.version,
          expires_at: r.expires_at,
          created_at: r.created_at,
          fresh: expMs > now,
          age_s: Math.max(0, Math.round((now - createdMs) / 1000)),
          hash: r.hash,
        };
      });
      return json({ rows, limit, offset });
    }

    if (action === 'purge') {
      if (body?.cache_key) {
        const { error } = await admin.from('bible_cache_l2').delete().eq('cache_key', body.cache_key);
        if (error) return json({ error: 'purge_failed', detail: error.message }, 500);
        return json({ ok: true, purged: body.cache_key });
      }
      if (body?.prefix) {
        const { error, count } = await admin.from('bible_cache_l2').delete({ count: 'exact' }).like('cache_key', `${body.prefix}%`);
        if (error) return json({ error: 'purge_failed', detail: error.message }, 500);
        return json({ ok: true, purged_count: count ?? 0 });
      }
      return json({ error: 'missing cache_key or prefix' }, 400);
    }

    if (action === 'warm') {
      const items = Array.isArray(body?.items) ? body.items : (body?.abbrev && body?.chapter ? [{ abbrev: body.abbrev, chapter: Number(body.chapter) }] : []);
      if (items.length === 0) return json({ error: 'missing items' }, 400);

      // Chama bible-text em modo warm sequencialmente (concorrência baixa para não saturar Bolls)
      const results: any[] = [];
      for (const it of items.slice(0, 500)) {
        try {
          const r = await fetch(`${SUPABASE_URL}/functions/v1/bible-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY },
            body: JSON.stringify({ abbrev: it.abbrev, chapter: Number(it.chapter), warm: true }),
          });
          const j = await r.json().catch(() => ({}));
          results.push({ abbrev: it.abbrev, chapter: it.chapter, ok: !!j?.ok, source: j?.source ?? null, status: r.status });
        } catch (e: any) {
          results.push({ abbrev: it.abbrev, chapter: it.chapter, ok: false, error: String(e?.message || e) });
        }
      }
      const okCount = results.filter((r) => r.ok).length;
      return json({ ok: true, total: results.length, succeeded: okCount, failed: results.length - okCount, results });
    }

    return json({ error: 'unknown_action', action }, 400);
  } catch (e: any) {
    console.error('[bible-cache-admin] error:', e);
    return json({ error: 'internal', detail: String(e?.message || e) }, 500);
  }
});
