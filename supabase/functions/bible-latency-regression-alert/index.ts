/**
 * bible-latency-regression-alert
 *
 * Para cada livro, calcula a média móvel de `total_ms` nos últimos N dias
 * (default 3) usando `bible_cache_metric_events`. Se a média ultrapassar
 * o limiar (default 800ms) por todos os dias da janela, abre um alerta
 * `warning` (ou `critical` se >2x o limiar) em `bible_audit_alerts`.
 *
 * Body opcional: { days?: number, threshold_ms?: number, min_samples?: number, dry_run?: boolean }
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getOrCreateCorrelationId } from '../_shared/correlation.ts';
import { makeResponder } from '../_shared/http-response.ts';


interface Body {
  days?: number;
  threshold_ms?: number;
  min_samples?: number;
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  // Sprint A / CAT-001 CID + CAT-002 Wave 4a envelope estrito
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  if (req.method === 'OPTIONS') return R.cors();

  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { /* default */ }
  const days = Math.max(1, Math.min(30, body.days ?? 3));
  const threshold = Math.max(100, body.threshold_ms ?? 800);
  const minSamples = Math.max(1, body.min_samples ?? 20);
  const dry = !!body.dry_run;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: events, error } = await supabase
    .from('bible_cache_metric_events')
    .select('abbrev, total_ms, created_at, status_code')
    .gte('created_at', since)
    .lt('status_code', 500)
    .not('total_ms', 'is', null);

  if (error) {
    return R.error(500, 'internal_error', { message: error.message });
  }

  // Bucket: book → day → samples
  const byBookDay = new Map<string, Map<string, number[]>>();
  for (const e of events ?? []) {
    const day = (e.created_at as string).slice(0, 10);
    if (!byBookDay.has(e.abbrev)) byBookDay.set(e.abbrev, new Map());
    const inner = byBookDay.get(e.abbrev)!;
    const arr = inner.get(day) ?? [];
    arr.push(Number(e.total_ms));
    inner.set(day, arr);
  }

  const regressed: Array<{
    abbrev: string; days_over: number; window_avg: number; max_day_avg: number; samples: number;
  }> = [];

  for (const [abbrev, perDay] of byBookDay) {
    let totalSamples = 0;
    let sumMs = 0;
    let daysOver = 0;
    let maxDayAvg = 0;
    let daysWithData = 0;
    for (const [, samples] of perDay) {
      if (samples.length === 0) continue;
      daysWithData++;
      totalSamples += samples.length;
      const sum = samples.reduce((a, b) => a + b, 0);
      sumMs += sum;
      const avg = sum / samples.length;
      if (avg > threshold) daysOver++;
      if (avg > maxDayAvg) maxDayAvg = avg;
    }
    if (totalSamples < minSamples) continue;
    if (daysWithData < days) continue;            // exige cobertura completa da janela
    if (daysOver < days) continue;                // exige TODOS os dias acima do limiar
    regressed.push({
      abbrev,
      days_over: daysOver,
      window_avg: Math.round(sumMs / totalSamples),
      max_day_avg: Math.round(maxDayAvg),
      samples: totalSamples,
    });
  }

  regressed.sort((a, b) => b.window_avg - a.window_avg);

  let alertId: string | null = null;
  if (regressed.length > 0 && !dry) {
    const severity = regressed.some(r => r.window_avg > threshold * 2) ? 'critical' : 'warning';
    const message = `Regressão de latência: ${regressed.length} livro(s) com média móvel > ${threshold}ms por ${days}d (pior: ${regressed[0].abbrev} ${regressed[0].window_avg}ms).`;
    const { data: ins } = await supabase
      .from('bible_audit_alerts')
      .insert({
        severity,
        message,
        details: { threshold_ms: threshold, days, regressed },
      })
      .select('id').single();
    alertId = (ins?.id as string) ?? null;
  }

  return R.raw({
    ok: true,
    days, threshold_ms: threshold, min_samples: minSamples,
    regressed_count: regressed.length,
    regressed,
    alert_id: alertId,
    dry_run: dry,
  });
});
