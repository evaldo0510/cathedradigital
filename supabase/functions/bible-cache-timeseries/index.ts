// Expõe ferramentas administrativas do bible cache para o dashboard:
//   action=series     → bible_cache_timeseries(window, since, abbrev?)
//   action=drilldown  → top N requests mais lentos numa bucket específica
//   action=benchmark  → resumo + detalhado por livro/tipo com baseline TTL=0
// Requer role 'admin' em user_roles.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const _corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-correlation-id",
  "Access-Control-Expose-Headers": "x-correlation-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
// Alias módulo-level (helpers fora do handler não conhecem o CID do request)
const corsHeaders = _corsBase;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidAbbrev(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9 ]{1,8}$/.test(v);
}

function toCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const out = [headers.join(",")];
  for (const r of rows) out.push(headers.map((h) => esc(r[h])).join(","));
  return out.join("\n");
}

serve(async (req) => {
  // Sprint A / CAT-001 CID + CAT-002 Wave 4b envelope estrito
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };
  const R = makeResponder(_cid);

  if (req.method === "OPTIONS") return R.cors();

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return R.error(401, 'unauthorized', { detail: 'no_token' });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return R.error(401, 'unauthorized', { detail: 'invalid_token' });
    const userId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return R.error(403, 'forbidden', {
        detail: 'not_admin',
        message: 'Acesso restrito a administradores.',
        request_access_to: 'admin@cathedradigital.com.br',
        user_id: userId,
      });
    }

    const url = new URL(req.url);
    let params: Record<string, unknown> = {};
    if (req.method === "POST") {
      try { params = await req.json(); } catch { params = {}; }
    } else {
      params = Object.fromEntries(url.searchParams.entries());
    }

    const action = (params.action as string) ?? "series";

    // ---------- drilldown ----------
    if (action === "drilldown") {
      const bucketStart = params.bucket_start as string;
      if (!bucketStart || isNaN(Date.parse(bucketStart))) {
        return R.error(400, 'invalid_body', { detail: 'bucket_start (ISO) obrigatório' });
      }
      const windowMinutes = clampInt(params.window_minutes, 1, 1440, 5);
      const limit = clampInt(params.limit, 1, 100, 20);
      const abbrev = isValidAbbrev(params.abbrev) ? (params.abbrev as string) : null;

      const start = new Date(bucketStart);
      const end = new Date(start.getTime() + windowMinutes * 60_000);

      let q = admin
        .from("bible_cache_metric_events")
        .select("created_at, abbrev, chapter, cache, l1_phase, correlation_id, total_ms, sql_ms, edge_ms, bolls_ms, bolls_ok, status_code, cold_start, cache_level, total_wall_clock_ms, instance_id, request_source, sql_breakdown")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("total_ms", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (abbrev) q = q.eq("abbrev", abbrev);

      const { data, error } = await q;
      if (error) return R.error(500, 'internal_error', { detail: error.message });
      return json({ action, bucket_start: bucketStart, window_minutes: windowMinutes, abbrev, rows: data ?? [] });
    }

    // ---------- benchmark ----------
    if (action === "benchmark") {
      const sinceDays = clampInt(params.since_days, 1, 30, 7);

      const detailedSql = `
        WITH base AS (
          SELECT abbrev,
            CASE WHEN cache='HIT' THEN 'L1_HIT_FRESH'
                 WHEN cache IN ('STALE','STALE_LAST_RESORT') THEN 'L1_HIT_STALE'
                 ELSE 'L1_MISS' END AS cache_type,
            sql_ms, total_ms
          FROM public.bible_cache_metric_events
          WHERE created_at >= now() - make_interval(days => $1)
        ),
        agg AS (
          SELECT abbrev, cache_type, COUNT(*)::INT AS n,
            ROUND(AVG(COALESCE(sql_ms,0))::NUMERIC,1) AS sql_avg_ms,
            COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY COALESCE(sql_ms,0)),0)::INT AS sql_p95_ms,
            ROUND(AVG(total_ms)::NUMERIC,1) AS total_avg_ms,
            COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY total_ms),0)::INT AS total_p50_ms,
            COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY total_ms),0)::INT AS total_p95_ms,
            COALESCE(MAX(total_ms),0)::INT AS total_max_ms
          FROM base GROUP BY abbrev, cache_type
        ),
        mb AS (SELECT abbrev, total_avg_ms AS b_avg, total_p95_ms AS b_p95 FROM agg WHERE cache_type='L1_MISS')
        SELECT a.abbrev, a.cache_type, a.n, a.sql_avg_ms, a.sql_p95_ms,
          a.total_avg_ms, a.total_p50_ms, a.total_p95_ms, a.total_max_ms,
          mb.b_avg AS ttl0_baseline_total_avg_ms, mb.b_p95 AS ttl0_baseline_total_p95_ms,
          CASE WHEN mb.b_avg IS NULL OR mb.b_avg=0 THEN NULL ELSE ROUND(a.total_avg_ms/mb.b_avg,3) END AS total_avg_ratio_vs_ttl0,
          CASE WHEN mb.b_p95 IS NULL OR mb.b_p95=0 THEN NULL ELSE ROUND(a.total_p95_ms::NUMERIC/mb.b_p95,3) END AS total_p95_ratio_vs_ttl0
        FROM agg a LEFT JOIN mb USING (abbrev)
        ORDER BY a.abbrev, a.cache_type;
      `;
      const summarySql = `
        WITH base AS (
          SELECT
            CASE WHEN cache='HIT' THEN 'L1_HIT_FRESH'
                 WHEN cache IN ('STALE','STALE_LAST_RESORT') THEN 'L1_HIT_STALE'
                 ELSE 'L1_MISS' END AS cache_type,
            sql_ms, total_ms
          FROM public.bible_cache_metric_events
          WHERE created_at >= now() - make_interval(days => $1)
        )
        SELECT cache_type, COUNT(*)::INT AS n,
          ROUND(AVG(COALESCE(sql_ms,0))::NUMERIC,1) AS sql_avg_ms,
          COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY COALESCE(sql_ms,0)),0)::INT AS sql_p95_ms,
          ROUND(AVG(total_ms)::NUMERIC,1) AS total_avg_ms,
          COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY total_ms),0)::INT AS total_p50_ms,
          COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY total_ms),0)::INT AS total_p95_ms,
          COALESCE(MAX(total_ms),0)::INT AS total_max_ms
        FROM base GROUP BY cache_type
        ORDER BY CASE cache_type WHEN 'L1_HIT_FRESH' THEN 1 WHEN 'L1_HIT_STALE' THEN 2 ELSE 3 END;
      `;

      // Sem RPC genérica — usamos uma RPC pré-existente diferente.
      // Como não há execute_sql, fazemos a agregação no cliente a partir dos eventos brutos.
      // (custo aceitável: 7 dias × few thousand rows.)
      const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
      const { data: events, error: evErr } = await admin
        .from("bible_cache_metric_events")
        .select("abbrev, cache, total_ms, sql_ms")
        .gte("created_at", since)
        .limit(100000);
      if (evErr) return R.error(500, 'internal_error', { stage: 'events_read', detail: evErr.message });

      const classify = (cache: string | null) =>
        cache === "HIT" ? "L1_HIT_FRESH"
        : (cache === "STALE" || cache === "STALE_LAST_RESORT") ? "L1_HIT_STALE"
        : "L1_MISS";

      const bucket = new Map<string, { abbrev: string; cache_type: string; totals: number[]; sqls: number[] }>();
      for (const e of (events ?? []) as Array<{ abbrev: string; cache: string | null; total_ms: number | null; sql_ms: number | null }>) {
        if (!e.abbrev || e.total_ms == null) continue;
        const ct = classify(e.cache);
        const k = `${e.abbrev}\u0000${ct}`;
        let cell = bucket.get(k);
        if (!cell) { cell = { abbrev: e.abbrev, cache_type: ct, totals: [], sqls: [] }; bucket.set(k, cell); }
        cell.totals.push(e.total_ms);
        cell.sqls.push(e.sql_ms ?? 0);
      }
      const pct = (arr: number[], p: number) => {
        if (!arr.length) return 0;
        const s = [...arr].sort((a, b) => a - b);
        return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
      };
      const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0;

      const agg = Array.from(bucket.values()).map(c => ({
        abbrev: c.abbrev,
        cache_type: c.cache_type,
        n: c.totals.length,
        sql_avg_ms: avg(c.sqls),
        sql_p95_ms: pct(c.sqls, 95),
        total_avg_ms: avg(c.totals),
        total_p50_ms: pct(c.totals, 50),
        total_p95_ms: pct(c.totals, 95),
        total_max_ms: c.totals.length ? Math.max(...c.totals) : 0,
      }));

      const baselineByAbbrev = new Map(
        agg.filter(r => r.cache_type === "L1_MISS").map(r => [r.abbrev, { avg: r.total_avg_ms, p95: r.total_p95_ms }])
      );
      const detailed = agg
        .map(r => {
          const b = baselineByAbbrev.get(r.abbrev);
          return {
            ...r,
            ttl0_baseline_total_avg_ms: b?.avg ?? null,
            ttl0_baseline_total_p95_ms: b?.p95 ?? null,
            total_avg_ratio_vs_ttl0: b?.avg ? Math.round((r.total_avg_ms / b.avg) * 1000) / 1000 : null,
            total_p95_ratio_vs_ttl0: b?.p95 ? Math.round((r.total_p95_ms / b.p95) * 1000) / 1000 : null,
          };
        })
        .sort((a, b) => a.abbrev.localeCompare(b.abbrev) || a.cache_type.localeCompare(b.cache_type));

      // Summary
      const sumBucket = new Map<string, { totals: number[]; sqls: number[] }>();
      for (const c of bucket.values()) {
        let s = sumBucket.get(c.cache_type);
        if (!s) { s = { totals: [], sqls: [] }; sumBucket.set(c.cache_type, s); }
        s.totals.push(...c.totals); s.sqls.push(...c.sqls);
      }
      const summary = ["L1_HIT_FRESH", "L1_HIT_STALE", "L1_MISS"].map(ct => {
        const s = sumBucket.get(ct);
        if (!s) return { cache_type: ct, n: 0, sql_avg_ms: 0, sql_p95_ms: 0, total_avg_ms: 0, total_p50_ms: 0, total_p95_ms: 0, total_max_ms: 0 };
        return {
          cache_type: ct,
          n: s.totals.length,
          sql_avg_ms: avg(s.sqls),
          sql_p95_ms: pct(s.sqls, 95),
          total_avg_ms: avg(s.totals),
          total_p50_ms: pct(s.totals, 50),
          total_p95_ms: pct(s.totals, 95),
          total_max_ms: s.totals.length ? Math.max(...s.totals) : 0,
        };
      });

      const fresh = summary[0], stale = summary[1], miss = summary[2];
      const pctDrop = (a: number, b: number) => b > 0 ? ((1 - a / b) * 100).toFixed(1) : "—";
      const markdown =
`# Benchmark Bible Cache — TTL=0 (baseline) vs TTL=5min

**Gerado em:** ${new Date().toISOString()}
**Janela:** últimos ${sinceDays} dias de \`bible_cache_metric_events\`
**Baseline TTL=0 sintético:** desempenho médio de \`L1_MISS\` por livro.

## Resumo agregado

| Tipo | n | sql_avg_ms | sql_p95_ms | total_avg_ms | total_p50_ms | total_p95_ms | total_max_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| L1_HIT_FRESH | ${fresh.n} | ${fresh.sql_avg_ms} | ${fresh.sql_p95_ms} | **${fresh.total_avg_ms}** | ${fresh.total_p50_ms} | ${fresh.total_p95_ms} | ${fresh.total_max_ms} |
| L1_HIT_STALE | ${stale.n} | ${stale.sql_avg_ms} | ${stale.sql_p95_ms} | **${stale.total_avg_ms}** | ${stale.total_p50_ms} | ${stale.total_p95_ms} | ${stale.total_max_ms} |
| L1_MISS (~TTL=0) | ${miss.n} | ${miss.sql_avg_ms} | ${miss.sql_p95_ms} | **${miss.total_avg_ms}** | ${miss.total_p50_ms} | ${miss.total_p95_ms} | ${miss.total_max_ms} |

### Ganho vs baseline TTL=0
- avg total_ms: ${miss.total_avg_ms} → ${fresh.total_avg_ms} (**−${pctDrop(fresh.total_avg_ms, miss.total_avg_ms)}%**)
- p95 total_ms: ${miss.total_p95_ms} → ${fresh.total_p95_ms} (**−${pctDrop(fresh.total_p95_ms, miss.total_p95_ms)}%**)
- STALE (SWR): ${stale.total_avg_ms} ms avg (n=${stale.n}${stale.n < 30 ? " — baixa confiança" : ""})

Veja \`bible_cache_ttl_benchmark_detailed.csv\` para a tabela por livro.
`;

      const summaryHeaders = ["cache_type","n","sql_avg_ms","sql_p95_ms","total_avg_ms","total_p50_ms","total_p95_ms","total_max_ms"];
      const detailedHeaders = ["abbrev","cache_type","n","sql_avg_ms","sql_p95_ms","total_avg_ms","total_p50_ms","total_p95_ms","total_max_ms","ttl0_baseline_total_avg_ms","ttl0_baseline_total_p95_ms","total_avg_ratio_vs_ttl0","total_p95_ratio_vs_ttl0"];

      return json({
        action,
        since_days: sinceDays,
        generated_at: new Date().toISOString(),
        summary,
        detailed,
        files: {
          summary_csv: toCsv(summary, summaryHeaders),
          detailed_csv: toCsv(detailed as unknown as Array<Record<string, unknown>>, detailedHeaders),
          report_md: markdown,
        },
      });
    }

    // ---------- series (default) ----------
    const windowMinutes = clampInt(params.window_minutes ?? params.p_window_minutes, 1, 1440, 5);
    const sinceHours = clampInt(params.since_hours ?? params.p_since_hours, 1, 720, 24);
    const rawAbbrev = (params.abbrev ?? params.p_abbrev ?? null) as string | null;
    const abbrev = isValidAbbrev(rawAbbrev) ? rawAbbrev : null;

    const { data, error } = await admin.rpc("bible_cache_timeseries", {
      p_window_minutes: windowMinutes,
      p_since_hours: sinceHours,
      p_abbrev: abbrev,
    });
    if (error) {
      console.error("[bible-cache-timeseries] rpc error", error);
      return R.error(500, 'internal_error', { stage: 'timeseries_rpc', detail: error.message });
    }
    return json({
      action: "series",
      window_minutes: windowMinutes,
      since_hours: sinceHours,
      abbrev,
      rows: data ?? [],
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[bible-cache-timeseries] unexpected", e);
    return R.error(500, 'internal_error', { detail: (e as Error).message ?? "Internal error" });
  }
});
