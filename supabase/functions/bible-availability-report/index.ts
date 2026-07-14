// Relatório periódico de disponibilidade da Bíblia.
//
// Examina bible_cache_metric_events das últimas N horas (default 24h),
// agrupa por (abbrev, chapter), e identifica capítulos que foram servidos
// como `unavailable` (ou com status >= 400) — isto é, falharam em TODAS as
// fontes (bolls.life + bibliacatolica + dump local).
//
// Para cada capítulo problemático:
//   - identifica quais fontes foram tentadas e quais falharam
//   - compara com janela anterior para destacar NOVOS capítulos
//   - insere uma linha em bible_audit_alerts (severidade warning/critical)
//
// Invocação:
//   POST /functions/v1/bible-availability-report
//   Body opcional: { hours?: number, dryRun?: boolean }
//
// Pode ser agendado via pg_cron chamando esta função periodicamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getOrCreateCorrelationId } from '../_shared/correlation.ts';
import { makeResponder } from '../_shared/http-response.ts';

interface Event {
  abbrev: string;
  chapter: number;
  source: string | null;
  cache: string;
  status_code: number;
  bolls_called: boolean | null;
  bolls_ok: boolean | null;
  created_at: string;
}

interface ChapterProblem {
  abbrev: string;
  chapter: number;
  occurrences: number;
  last_seen: string;
  failed_sources: string[];
  succeeded_sources: string[];
}

Deno.serve(async (req) => {
  // Sprint A / CAT-001 CID + CAT-002 Wave 4a envelope estrito
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  if (req.method === 'OPTIONS') return R.cors();

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(url, key);

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const hours = Math.max(1, Math.min(168, Number(body?.hours) || 24));
  const dryRun = !!body?.dryRun;

  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const previousWindowStart = new Date(Date.now() - hours * 2 * 3600 * 1000).toISOString();

  // 1. Eventos da janela atual
  const { data: currentEvents, error: e1 } = await supabase
    .from('bible_cache_metric_events')
    .select('abbrev, chapter, source, cache, status_code, bolls_called, bolls_ok, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (e1) return R.error(500, 'internal_error', { message: e1.message });

  // 2. Eventos da janela anterior (para detectar "novos" problemas)
  const { data: previousEvents } = await supabase
    .from('bible_cache_metric_events')
    .select('abbrev, chapter, source')
    .gte('created_at', previousWindowStart)
    .lt('created_at', since);

  const previousProblems = new Set<string>();
  for (const e of (previousEvents ?? []) as { abbrev: string; chapter: number; source: string | null }[]) {
    if (e.source === 'unavailable') previousProblems.add(`${e.abbrev}:${e.chapter}`);
  }

  // 3. Agrupar por capítulo
  const grouped = new Map<string, ChapterProblem>();
  for (const e of (currentEvents ?? []) as Event[]) {
    const key = `${e.abbrev}:${e.chapter}`;
    const isProblem = e.source === 'unavailable' || e.status_code >= 400;
    if (!isProblem) {
      // sucesso recente — não é problema (mas registra fonte usada)
      const existing = grouped.get(key);
      if (existing && e.source && !existing.succeeded_sources.includes(e.source)) {
        existing.succeeded_sources.push(e.source);
      }
      continue;
    }
    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        abbrev: e.abbrev,
        chapter: e.chapter,
        occurrences: 0,
        last_seen: e.created_at,
        failed_sources: [],
        succeeded_sources: [],
      };
      grouped.set(key, entry);
    }
    entry.occurrences++;
    if (e.created_at > entry.last_seen) entry.last_seen = e.created_at;
    // Inferir fontes tentadas
    if (e.bolls_called && e.bolls_ok === false && !entry.failed_sources.includes('bolls.life')) {
      entry.failed_sources.push('bolls.life');
    }
    if (e.source === 'unavailable' && !entry.failed_sources.includes('bibliacatolica.com.br')) {
      entry.failed_sources.push('bibliacatolica.com.br');
    }
    if (e.source === 'unavailable' && !entry.failed_sources.includes('cathedra (dump local)')) {
      entry.failed_sources.push('cathedra (dump local)');
    }
  }

  const problems = [...grouped.values()].filter(p => p.succeeded_sources.length === 0);
  const newProblems = problems.filter(p => !previousProblems.has(`${p.abbrev}:${p.chapter}`));
  const recurrentProblems = problems.filter(p => previousProblems.has(`${p.abbrev}:${p.chapter}`));

  const report = {
    generated_at: new Date().toISOString(),
    window_hours: hours,
    total_events: currentEvents?.length ?? 0,
    problem_chapters: problems.length,
    new_problem_chapters: newProblems.length,
    recurrent_problem_chapters: recurrentProblems.length,
    new_problems: newProblems,
    recurrent_problems: recurrentProblems,
  };

  let alertId: string | null = null;
  if (!dryRun && problems.length > 0) {
    const severity = newProblems.length > 0 ? 'critical' : 'warning';
    const ins = await supabase
      .from('bible_audit_alerts')
      .insert({
        severity,
        message: newProblems.length > 0
          ? `${newProblems.length} novo(s) capítulo(s) indisponível(eis) nas últimas ${hours}h`
          : `${problems.length} capítulo(s) seguem indisponíveis nas últimas ${hours}h`,
        details: report as any,
      })
      .select('id').single();
    if (!ins.error) alertId = ins.data.id;
  }

  return R.raw({ ok: true, alert_id: alertId, report });
});
