// Agrega eventos crus (bible_cache_metric_events) em buckets horários por livro
// e avalia regras de alerta (taxa de fallback BollsLife, p95 alto).
//
// Chamado pelo pg_cron (POST sem corpo). Pode ser disparado manualmente também.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Defaults; podem ser sobrescritos via app_feature_flags:
//   feature_key='bible_cache_alert_bolls_rate' → metadata.threshold (0..1)
//   feature_key='bible_cache_alert_p95_ms'     → metadata.threshold (ms)
//   feature_key='bible_cache_alert_min_calls'  → metadata.threshold (n)
const DEFAULTS = {
  bollsRate: 0.30,
  p95Ms: 4000,
  minCalls: 10,
  regressionFactor: 1.5, // observed_p95 >= baseline_p95 * factor → alerta
  regressionFloorMs: 100, // ignora baselines minúsculos (ruído)
};


async function readFlag(key: string, fallback: number): Promise<number> {
  try {
    const { data } = await supabase
      .from('app_feature_flags')
      .select('metadata')
      .eq('feature_key', key)
      .maybeSingle();
    const n = Number(data?.metadata?.threshold);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Compara o p95 observado de `metric` (sql_ms ou total_ms) na janela do bucket
 * contra o baseline histórico do livro (últimos 7 dias, excluindo a última hora).
 * Retorna um payload de alerta se observado >= baseline * factor (e baseline >= floor),
 * já enriquecido com correlation_id + l1_phase + cache do pior request da janela.
 */
async function evaluateRegression(
  abbrev: string,
  bucketStart: string,
  metric: 'sql_ms' | 'total_ms',
  factor: number,
  floorMs: number,
): Promise<any | null> {
  const { data: observedP95Row, error: e1 } = await supabase.rpc('bible_cache_baseline_p95', {
    p_abbrev: abbrev,
    p_metric: metric,
  });
  // baseline_p95 vem como número escalar via RPC
  const baseline = Number(observedP95Row ?? 0);
  if (!Number.isFinite(baseline) || baseline < floorMs) return null;
  if (e1) { console.warn('[bible-cache-aggregator] baseline rpc failed:', e1.message); return null; }

  // p95 observado: calcula direto dos eventos da janela
  const end = new Date(new Date(bucketStart).getTime() + 60 * 60 * 1000).toISOString();
  const { data: rows, error: e2 } = await supabase
    .from('bible_cache_metric_events')
    .select(`${metric}`)
    .eq('abbrev', abbrev)
    .gte('created_at', bucketStart)
    .lt('created_at', end)
    .not(metric, 'is', null);
  if (e2 || !rows?.length) return null;
  const values = rows.map((r: any) => Number(r[metric])).filter(Number.isFinite).sort((a, b) => a - b);
  if (values.length < 5) return null; // ruído: poucas amostras
  const observedP95 = values[Math.min(values.length - 1, Math.floor(0.95 * values.length))];
  if (observedP95 < baseline * factor) return null;

  // Worst offender: correlation_id + l1_phase do pior request da janela
  const { data: worst } = await supabase.rpc('bible_cache_worst_offender', {
    p_abbrev: abbrev,
    p_bucket_start: bucketStart,
    p_metric: metric,
  });
  const w = Array.isArray(worst) ? worst[0] : null;

  return {
    severity: observedP95 >= baseline * factor * 1.5 ? 'critical' : 'warning',
    kind: `${metric}_regression`,
    metric_kind: metric,
    observed_p95_ms: Math.round(observedP95),
    baseline_p95_ms: Math.round(baseline),
    correlation_id: w?.correlation_id ?? null,
    l1_phase: w?.l1_phase ?? null,
    message: `${metric} de "${abbrev}" regrediu: p95=${Math.round(observedP95)}ms vs baseline ${Math.round(baseline)}ms (×${(observedP95 / baseline).toFixed(2)})`,
    details: {
      metric, observed_p95_ms: Math.round(observedP95), baseline_p95_ms: Math.round(baseline),
      factor, floor_ms: floorMs, samples: values.length,
      worst: w ? { correlation_id: w.correlation_id, l1_phase: w.l1_phase, value_ms: w.value_ms, cache: w.cache } : null,
    },
    bucket_start: bucketStart,
    abbrev,
  };
}

serve(async (req) => {

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const t0 = Date.now();

  try {
    // 1) Agrega eventos das últimas 2 horas (cobre janela do bucket atual + anterior)
    const { data: aggCount, error: aggErr } = await supabase.rpc('aggregate_bible_cache_metrics', {
      p_since: '2 hours',
    });
    if (aggErr) {
      console.error('[bible-cache-aggregator] rpc failed:', aggErr);
      return new Response(JSON.stringify({ ok: false, error: aggErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Carrega thresholds
    const [bollsRateMax, p95Max, minCalls, regressionFactor, regressionFloorMs] = await Promise.all([
      readFlag('bible_cache_alert_bolls_rate', DEFAULTS.bollsRate),
      readFlag('bible_cache_alert_p95_ms', DEFAULTS.p95Ms),
      readFlag('bible_cache_alert_min_calls', DEFAULTS.minCalls),
      readFlag('bible_cache_alert_regression_factor', DEFAULTS.regressionFactor),
      readFlag('bible_cache_alert_regression_floor_ms', DEFAULTS.regressionFloorMs),
    ]);


    // 3) Pega o bucket mais recente (hora corrente) por livro
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: buckets, error: bErr } = await supabase
      .from('bible_cache_metrics')
      .select('bucket_start, abbrev, total, bolls_calls, bolls_failures, p95_ms')
      .gte('bucket_start', sinceIso);
    if (bErr) {
      console.warn('[bible-cache-aggregator] read metrics failed:', bErr.message);
    }

    const newAlerts: any[] = [];
    for (const b of buckets ?? []) {
      if ((b.total ?? 0) < minCalls) continue;

      const bollsRate = (b.bolls_calls ?? 0) / Math.max(1, b.total ?? 1);
      if (b.bolls_calls > 0 && bollsRate >= bollsRateMax) {
        newAlerts.push({
          severity: bollsRate >= bollsRateMax * 1.5 ? 'critical' : 'warning',
          kind: 'bolls_fallback_rate',
          message: `Taxa de fallback BollsLife em "${b.abbrev}" = ${(bollsRate * 100).toFixed(1)}% (limite ${(bollsRateMax * 100).toFixed(0)}%)`,
          details: { bolls_calls: b.bolls_calls, bolls_failures: b.bolls_failures, total: b.total, rate: bollsRate, threshold: bollsRateMax },
          bucket_start: b.bucket_start,
          abbrev: b.abbrev,
        });
      }

      if ((b.p95_ms ?? 0) >= p95Max) {
        newAlerts.push({
          severity: b.p95_ms >= p95Max * 1.5 ? 'critical' : 'warning',
          kind: 'p95_high',
          message: `p95 de "${b.abbrev}" = ${b.p95_ms}ms (limite ${p95Max}ms)`,
          details: { p95_ms: b.p95_ms, total: b.total, threshold: p95Max },
          bucket_start: b.bucket_start,
          abbrev: b.abbrev,
        });
      }

      // Regressão de p95 contra baseline histórico, por métrica (sql_ms e total_ms)
      for (const metric of ['sql_ms', 'total_ms'] as const) {
        const reg = await evaluateRegression(b.abbrev, b.bucket_start, metric, regressionFactor, regressionFloorMs);
        if (reg) newAlerts.push(reg);
      }
    }


    // 4) Dedupe: se já existe alerta aberto do mesmo kind+metric_kind+bucket+abbrev, não duplica
    let inserted = 0;
    for (const a of newAlerts) {
      let q = supabase
        .from('bible_cache_alerts')
        .select('id')
        .eq('kind', a.kind)
        .eq('bucket_start', a.bucket_start)
        .eq('abbrev', a.abbrev)
        .is('resolved_at', null);
      // metric_kind diferencia regressão sql_ms vs total_ms para o mesmo bucket
      q = a.metric_kind ? q.eq('metric_kind', a.metric_kind) : q.is('metric_kind', null);
      const { data: existing } = await q.maybeSingle();
      if (existing) continue;
      const { error: insErr } = await supabase.from('bible_cache_alerts').insert(a);
      if (!insErr) inserted++;
      else console.warn('[bible-cache-aggregator] alert insert failed:', insErr.message);
    }


    const took = Date.now() - t0;
    console.info(JSON.stringify({ t: 'aggregator_run', ts: Date.now(), agg_count: aggCount, alerts_evaluated: newAlerts.length, alerts_inserted: inserted, ms: took }));
    return new Response(JSON.stringify({ ok: true, aggregated_rows: aggCount, alerts_evaluated: newAlerts.length, alerts_inserted: inserted, ms: took }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[bible-cache-aggregator] fatal:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
