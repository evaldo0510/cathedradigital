// Admin endpoint para inspecionar e operar o cache L2 da Bíblia.
// Requer JWT válido + role 'admin' em user_roles.
//
// Ações (POST {action: ...}):
//   - 'stats'          → contagens (total / fresh / stale)
//   - 'list'           → lista entradas paginadas (cache_key, version, expires_at, fresh, age_s)
//   - 'purge'          → remove uma entrada (cache_key) ou bulk por prefixo (prefix)
//   - 'warm'           → dispara warm de {abbrev, chapter} ou lista [{abbrev,chapter},...]
//   - 'bulk_range'     → bulk_warm OU bulk_purge em range {abbrev, chapter_from, chapter_to, op}
//   - 'metrics'        → buckets horários (param: hours=24, abbrev?)
//   - 'metrics_summary'→ resumo agregado (hits/miss/stale/p95/bolls rate por livro)
//   - 'alerts'         → lista alertas abertos / recentes
//   - 'resolve_alert'  → marca alerta como resolvido
//   - 'export'         → metrics em csv|json no intervalo

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

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
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

async function warmOne(abbrev: string, chapter: number) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/bible-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY },
    body: JSON.stringify({ abbrev, chapter: Number(chapter), warm: true }),
  });
  const j = await r.json().catch(() => ({}));
  return { abbrev, chapter, ok: !!j?.ok, source: j?.source ?? null, status: r.status };
}

function toCsv(rows: any[], cols: string[]) {
  const head = cols.join(',');
  const body = rows.map((r) =>
    cols.map((c) => {
      const v = r[c];
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  ).join('\n');
  return head + '\n' + body + '\n';
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
      return json({ total: total ?? 0, fresh: fresh ?? 0, stale: Math.max(0, (total ?? 0) - (fresh ?? 0)), now });
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
          cache_key: r.cache_key, version: r.version, expires_at: r.expires_at, created_at: r.created_at,
          fresh: expMs > now, age_s: Math.max(0, Math.round((now - createdMs) / 1000)), hash: r.hash,
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
      const items = Array.isArray(body?.items)
        ? body.items
        : (body?.abbrev && body?.chapter ? [{ abbrev: body.abbrev, chapter: Number(body.chapter) }] : []);
      if (items.length === 0) return json({ error: 'missing items' }, 400);
      const results: any[] = [];
      for (const it of items.slice(0, 500)) {
        try { results.push(await warmOne(String(it.abbrev), Number(it.chapter))); }
        catch (e: any) { results.push({ abbrev: it.abbrev, chapter: it.chapter, ok: false, error: String(e?.message || e) }); }
      }
      const okCount = results.filter((r) => r.ok).length;
      return json({ ok: true, total: results.length, succeeded: okCount, failed: results.length - okCount, results });
    }

    if (action === 'bulk_range') {
      const abbrev = String(body?.abbrev || '');
      const from = Number(body?.chapter_from);
      const to = Number(body?.chapter_to);
      const op = String(body?.op || 'warm');
      if (!abbrev || !Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from || (to - from) > 200) {
        return json({ error: 'invalid range', hint: 'abbrev required; 1 <= from <= to; (to-from) <= 200' }, 400);
      }
      if (op === 'purge') {
        const keys = Array.from({ length: to - from + 1 }, (_, i) => `${abbrev}:${from + i}`);
        const { error, count } = await admin.from('bible_cache_l2').delete({ count: 'exact' }).in('cache_key', keys);
        if (error) return json({ error: 'purge_failed', detail: error.message }, 500);
        return json({ ok: true, op: 'purge', range: [from, to], purged_count: count ?? 0 });
      }
      if (op === 'warm') {
        const results: any[] = [];
        for (let c = from; c <= to; c++) {
          try { results.push(await warmOne(abbrev, c)); }
          catch (e: any) { results.push({ abbrev, chapter: c, ok: false, error: String(e?.message || e) }); }
        }
        const okCount = results.filter((r) => r.ok).length;
        return json({ ok: true, op: 'warm', range: [from, to], total: results.length, succeeded: okCount, failed: results.length - okCount, results });
      }
      return json({ error: 'unknown op (warm|purge)' }, 400);
    }

    if (action === 'metrics') {
      const hours = Math.min(Math.max(Number(body?.hours) || 24, 1), 24 * 14);
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      let q = admin.from('bible_cache_metrics')
        .select('bucket_start, abbrev, hits, misses, stale, errors, total, sum_ms, max_ms, p95_ms, bolls_calls, bolls_failures, bolls_sum_ms')
        .gte('bucket_start', since)
        .order('bucket_start', { ascending: true });
      if (body?.abbrev) q = q.eq('abbrev', String(body.abbrev));
      const { data, error } = await q;
      if (error) return json({ error: 'query_failed', detail: error.message }, 500);
      return json({ rows: data ?? [], hours, since });
    }

    if (action === 'metrics_summary') {
      const hours = Math.min(Math.max(Number(body?.hours) || 24, 1), 24 * 14);
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data, error } = await admin.from('bible_cache_metrics')
        .select('abbrev, hits, misses, stale, total, sum_ms, p95_ms, bolls_calls, bolls_failures')
        .gte('bucket_start', since);
      if (error) return json({ error: 'query_failed', detail: error.message }, 500);

      const perBook = new Map<string, any>();
      let g = { hits: 0, misses: 0, stale: 0, total: 0, sum_ms: 0, bolls_calls: 0, bolls_failures: 0, p95_samples: [] as number[] };
      for (const r of data ?? []) {
        const slot = perBook.get(r.abbrev) || { abbrev: r.abbrev, hits: 0, misses: 0, stale: 0, total: 0, sum_ms: 0, bolls_calls: 0, bolls_failures: 0, max_p95: 0 };
        slot.hits += r.hits ?? 0;
        slot.misses += r.misses ?? 0;
        slot.stale += r.stale ?? 0;
        slot.total += r.total ?? 0;
        slot.sum_ms += Number(r.sum_ms ?? 0);
        slot.bolls_calls += r.bolls_calls ?? 0;
        slot.bolls_failures += r.bolls_failures ?? 0;
        slot.max_p95 = Math.max(slot.max_p95, r.p95_ms ?? 0);
        perBook.set(r.abbrev, slot);
        g.hits += r.hits ?? 0; g.misses += r.misses ?? 0; g.stale += r.stale ?? 0;
        g.total += r.total ?? 0; g.sum_ms += Number(r.sum_ms ?? 0);
        g.bolls_calls += r.bolls_calls ?? 0; g.bolls_failures += r.bolls_failures ?? 0;
        if (r.p95_ms) g.p95_samples.push(r.p95_ms);
      }
      const perBookArr = [...perBook.values()].map((s) => ({
        ...s,
        hit_rate: s.total ? s.hits / s.total : 0,
        avg_ms: s.total ? Math.round(s.sum_ms / s.total) : 0,
        bolls_rate: s.total ? s.bolls_calls / s.total : 0,
      })).sort((a, b) => b.total - a.total);

      g.p95_samples.sort((a, b) => a - b);
      const p95 = g.p95_samples.length ? g.p95_samples[Math.floor(g.p95_samples.length * 0.95)] || g.p95_samples[g.p95_samples.length - 1] : 0;
      const global = {
        hits: g.hits, misses: g.misses, stale: g.stale, total: g.total,
        hit_rate: g.total ? g.hits / g.total : 0,
        avg_ms: g.total ? Math.round(g.sum_ms / g.total) : 0,
        p95_ms: p95,
        bolls_calls: g.bolls_calls,
        bolls_failures: g.bolls_failures,
        bolls_rate: g.total ? g.bolls_calls / g.total : 0,
      };
      return json({ global, books: perBookArr, hours, since });
    }

    if (action === 'alerts') {
      const limit = Math.min(Number(body?.limit) || 50, 200);
      const onlyOpen = body?.only_open !== false;
      let q = admin.from('bible_cache_alerts')
        .select('id, created_at, severity, kind, message, details, bucket_start, abbrev, resolved_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (onlyOpen) q = q.is('resolved_at', null);
      const { data, error } = await q;
      if (error) return json({ error: 'query_failed', detail: error.message }, 500);
      return json({ rows: data ?? [] });
    }

    if (action === 'resolve_alert') {
      if (!body?.id) return json({ error: 'missing id' }, 400);
      const { error } = await admin.from('bible_cache_alerts').update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      }).eq('id', body.id);
      if (error) return json({ error: 'update_failed', detail: error.message }, 500);
      return json({ ok: true });
    }

    if (action === 'export') {
      const format = String(body?.format || 'csv').toLowerCase();
      const hours = Math.min(Math.max(Number(body?.hours) || 168, 1), 24 * 30);
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data, error } = await admin.from('bible_cache_metrics')
        .select('bucket_start, abbrev, hits, misses, stale, errors, total, sum_ms, max_ms, p95_ms, bolls_calls, bolls_failures, bolls_sum_ms')
        .gte('bucket_start', since)
        .order('bucket_start', { ascending: true });
      if (error) return json({ error: 'query_failed', detail: error.message }, 500);
      const filename = `bible-cache-metrics-${hours}h-${new Date().toISOString().slice(0, 10)}`;
      if (format === 'json') {
        return new Response(JSON.stringify({ since, hours, rows: data ?? [] }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${filename}.json"` },
        });
      }
      const csv = toCsv(data ?? [], [
        'bucket_start', 'abbrev', 'hits', 'misses', 'stale', 'errors', 'total',
        'sum_ms', 'max_ms', 'p95_ms', 'bolls_calls', 'bolls_failures', 'bolls_sum_ms',
      ]);
      return new Response(csv, {
        headers: { ...corsHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}.csv"` },
      });
    }

    if (action === 'run_aggregator') {
      // Permite forçar agregação manual a partir da UI.
      const r = await fetch(`${SUPABASE_URL}/functions/v1/bible-cache-aggregator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY },
      });
      const j = await r.json().catch(() => ({}));
      return json(j, r.status);
    }

    return json({ error: 'unknown_action', action }, 400);
  } catch (e: any) {
    console.error('[bible-cache-admin] error:', e);
    return json({ error: 'internal', detail: String(e?.message || e) }, 500);
  }
});
