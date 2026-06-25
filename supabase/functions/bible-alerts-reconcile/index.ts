// Reconcile legacy/recurrent Bible audit alerts and purge stale UI-alias events.
//
// Two responsibilities:
//   1. Re-classify open alerts using the current canon/aliases. For every
//      (abbrev, chapter) listed in `details.new_problems` /
//      `details.recurrent_problems`, re-validate via `bible-text`. If the
//      chapter now resolves, drop it from the alert payload, downgrade
//      severity, and resolve the alert when no problems remain.
//   2. Purge legacy `bible_cache_metric_events` rows recorded as
//      `unavailable` for UI-only abbreviations (Esd/Est/Pr/Ecl/1 Cor/2 Cor/
//      Fl/1 Pd/2 Pd, with or without spaces) that the canon now accepts as
//      aliases — they pollute the availability report with false positives.
//
// POST /functions/v1/bible-alerts-reconcile  { dryRun?: boolean }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { findBookByAbbr, normalizeAbbr } from '../_shared/bibleCanon.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LEGACY_UI_ABBREVS = ['Esd', 'Est', 'Pr', 'Ecl', '1 Cor', '2 Cor', '1Cor', '2Cor', 'Fl', '1 Pd', '2 Pd', '1Pd', '2Pd'];

interface ProblemEntry {
  abbrev: string;
  chapter: number;
  [k: string]: unknown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(url, key);

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const dryRun = !!body?.dryRun;

  const stats = {
    alerts_examined: 0,
    chapters_revalidated: 0,
    chapters_resolved: 0,
    alerts_updated: 0,
    alerts_resolved: 0,
    severity_downgraded: 0,
    legacy_events_purged: 0,
  };
  const details: any[] = [];

  // 1. Reclassificar alertas abertos
  const { data: openAlerts, error: e1 } = await supabase
    .from('bible_audit_alerts')
    .select('id, severity, message, details, is_resolved, created_at')
    .or('is_resolved.is.null,is_resolved.eq.false')
    .order('created_at', { ascending: false })
    .limit(50);

  if (e1) return new Response(JSON.stringify({ error: e1.message }), { status: 500, headers: corsHeaders });

  for (const alert of openAlerts ?? []) {
    stats.alerts_examined++;
    const d: any = alert.details ?? {};
    const newProblems: ProblemEntry[] = Array.isArray(d.new_problems) ? d.new_problems : [];
    const recProblems: ProblemEntry[] = Array.isArray(d.recurrent_problems) ? d.recurrent_problems : [];
    const all = [...newProblems, ...recProblems];
    if (all.length === 0) continue;

    const stillFailing: ProblemEntry[] = [];
    const resolvedChapters: ProblemEntry[] = [];

    for (const p of all) {
      stats.chapters_revalidated++;
      const canonical = normalizeAbbr(p.abbrev);
      const book = findBookByAbbr(canonical);
      if (!book) {
        // abreviação não mapeia em nada — considera resolvida (legacy noise)
        resolvedChapters.push({ ...p, abbrev: canonical, reason: 'unknown_abbrev_dropped' });
        stats.chapters_resolved++;
        continue;
      }
      try {
        const { data: txt } = await supabase.functions.invoke('bible-text', {
          body: { abbrev: canonical, chapter: p.chapter, force_revalidate: true },
        });
        if (txt && !txt.unavailable && (txt.verses?.length ?? 0) > 0) {
          resolvedChapters.push({ ...p, abbrev: canonical, source: txt?.metadata?.source });
          stats.chapters_resolved++;
        } else {
          stillFailing.push({ ...p, abbrev: canonical });
        }
      } catch {
        stillFailing.push({ ...p, abbrev: canonical });
      }
    }

    if (resolvedChapters.length === 0) continue;

    // Atualizar alerta: novo severity
    const totalRemaining = stillFailing.length;
    let nextSeverity = alert.severity;
    if (totalRemaining === 0) nextSeverity = 'info';
    else if (totalRemaining < (newProblems.length + recProblems.length) / 2) nextSeverity = 'warning';

    const update: any = {
      details: {
        ...d,
        reconciled_at: new Date().toISOString(),
        resolved_chapters: [...(d.resolved_chapters ?? []), ...resolvedChapters],
        new_problems: stillFailing.filter(p => newProblems.some(n => n.abbrev === p.abbrev && n.chapter === p.chapter)),
        recurrent_problems: stillFailing.filter(p => recProblems.some(n => n.abbrev === p.abbrev && n.chapter === p.chapter)),
        problem_chapters: stillFailing.length,
      },
      severity: nextSeverity,
    };

    if (nextSeverity !== alert.severity) stats.severity_downgraded++;

    if (totalRemaining === 0) {
      update.is_resolved = true;
      update.resolved_at = new Date().toISOString();
      stats.alerts_resolved++;
    }

    if (!dryRun) {
      const { error: upErr } = await supabase.from('bible_audit_alerts').update(update).eq('id', alert.id);
      if (!upErr) stats.alerts_updated++;
    } else {
      stats.alerts_updated++;
    }

    details.push({
      alert_id: alert.id,
      resolved: resolvedChapters.length,
      still_failing: stillFailing.length,
      new_severity: nextSeverity,
    });
  }

  // 2. Purgar eventos legados de abreviações UI marcados como unavailable
  if (!dryRun) {
    const { data: legacy, error: e3 } = await supabase
      .from('bible_cache_metric_events')
      .delete()
      .in('abbrev', LEGACY_UI_ABBREVS)
      .eq('source', 'unavailable')
      .select('id');
    if (!e3) stats.legacy_events_purged = legacy?.length ?? 0;
  } else {
    const { count } = await supabase
      .from('bible_cache_metric_events')
      .select('id', { count: 'exact', head: true })
      .in('abbrev', LEGACY_UI_ABBREVS)
      .eq('source', 'unavailable');
    stats.legacy_events_purged = count ?? 0;
  }

  return new Response(JSON.stringify({ ok: true, dryRun, stats, details }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
