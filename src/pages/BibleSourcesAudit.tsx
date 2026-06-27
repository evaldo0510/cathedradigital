import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BIBLE_MISSING_CHAPTERS, MISSING_CHAPTER_REASON } from '@/lib/bibleMissingChapters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, AlertTriangle, CheckCircle2, Database, Globe2, Repeat, FileText, Download, Wand2, Layers, Sliders, Filter, FlaskConical, TrendingUp, PauseCircle, PlayCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

type SourceTag = 'Cathedra (Local)' | 'BollsLife (Fallback)' | 'BibliaCatolica (Ave-Maria)' | 'unavailable' | string | null;

interface SourceEntry {
  abbrev: string;
  chapter: number;
  source: SourceTag;
  cache: string;
  status_code: number;
  created_at: string;
  total_ms?: number;
  root_cause?: string | null;
  fallback_chain?: any;
  attempts?: any;
}

interface AlertRow {
  id: string;
  severity: string;
  message: string;
  details: any;
  is_resolved: boolean | null;
  created_at: string;
}

function sourceBadge(s: SourceTag) {
  if (!s) return <Badge variant="outline">—</Badge>;
  if (s.startsWith('Cathedra')) return <Badge className="bg-emerald-100 text-emerald-800"><Database className="w-3 h-3 mr-1" />Banco (dump)</Badge>;
  if (s.startsWith('BollsLife')) return <Badge className="bg-blue-100 text-blue-800"><Globe2 className="w-3 h-3 mr-1" />bolls.life</Badge>;
  if (s.startsWith('BibliaCatolica')) return <Badge className="bg-amber-100 text-amber-800"><Globe2 className="w-3 h-3 mr-1" />BibliaCatolica</Badge>;
  if (s === 'unavailable') return <Badge variant="destructive">Indisponível</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

function chainBadge(label: string, state: 'ok' | 'fail' | 'skip') {
  const cls =
    state === 'ok' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : state === 'fail' ? 'bg-red-100 text-red-700 border-red-300'
    : 'bg-zinc-100 text-zinc-500 border-zinc-300';
  return <span className={`inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>;
}

function deriveFallbackChain(e: SourceEntry): { bolls: 'ok' | 'fail' | 'skip'; biblia: 'ok' | 'fail' | 'skip'; dump: 'ok' | 'fail' | 'skip' } {
  const chain = e.fallback_chain ?? e.attempts;
  if (chain && typeof chain === 'object') {
    const get = (k: string): 'ok' | 'fail' | 'skip' => {
      const v = (chain as any)[k];
      if (v === true || v === 'ok' || v === 'success') return 'ok';
      if (v === false || v === 'fail' || v === 'error') return 'fail';
      if (typeof v === 'string' && /ok|success|200/i.test(v)) return 'ok';
      if (typeof v === 'string' && /fail|error|4\d\d|5\d\d|empty/i.test(v)) return 'fail';
      return 'skip';
    };
    return { bolls: get('bolls') ?? get('bolls.life'), biblia: get('biblia') ?? get('bibliacatolica'), dump: get('dump') ?? get('cathedra') };
  }
  const src = (e.source ?? '') as string;
  if (src.startsWith('Cathedra')) return { bolls: 'skip', biblia: 'skip', dump: 'ok' };
  if (src.startsWith('BollsLife')) return { bolls: 'ok', biblia: 'skip', dump: 'skip' };
  if (src.startsWith('BibliaCatolica')) return { bolls: 'fail', biblia: 'ok', dump: 'skip' };
  return { bolls: 'fail', biblia: 'fail', dump: 'fail' };
}

function deriveRootCause(e: SourceEntry): string {
  if (e.root_cause) return e.root_cause;
  if (e.status_code >= 500) return `upstream_5xx (${e.status_code})`;
  if (e.status_code === 404) return 'not_found';
  if (e.status_code >= 400) return `client_error (${e.status_code})`;
  if (e.source === 'unavailable') return 'all_sources_empty';
  return '—';
}

export default function BibleSourcesAudit() {
  const [entries, setEntries] = useState<SourceEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [autoRetry, setAutoRetry] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const [reconciling, setReconciling] = useState(false);
  type RetryLogRow = { ts: string; target: string; outcome: string; httpStatus?: number | null; error?: string | null };
  const [retryLog, setRetryLog] = useState<RetryLogRow[]>([]);
  // Última tentativa por capítulo (abbrev:chapter → metadados)
  const [lastAttempts, setLastAttempts] = useState<Record<string, { ts: string; outcome: string; httpStatus?: number | null; error?: string | null }>>({});
  const lastRetryAt = useRef<Map<string, number>>(new Map());

  // Batch retry controls (persisted in localStorage)
  const LS_KEY = 'bibleSourcesAudit.batchConfig.v1';
  const loadCfg = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  };
  const initialCfg = loadCfg();
  const [batchConcurrency, setBatchConcurrency] = useState<number>(initialCfg.batchConcurrency ?? 2);
  const [batchMaxPerRun, setBatchMaxPerRun] = useState<number>(initialCfg.batchMaxPerRun ?? 25);
  const [batchCooldownMs, setBatchCooldownMs] = useState<number>(initialCfg.batchCooldownMs ?? 2 * 60 * 1000);
  const [avgRetryMs, setAvgRetryMs] = useState<number>(initialCfg.avgRetryMs ?? 1500);

  // Spike alert thresholds (persisted)
  const [spikeUnavailPct, setSpikeUnavailPct] = useState<number>(initialCfg.spikeUnavailPct ?? 15);
  const [spikeLatencyPct, setSpikeLatencyPct] = useState<number>(initialCfg.spikeLatencyPct ?? 50);
  const [spikeWindowDays, setSpikeWindowDays] = useState<number>(initialCfg.spikeWindowDays ?? 3);

  // Persist whenever any config changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        batchConcurrency, batchMaxPerRun, batchCooldownMs, avgRetryMs,
        spikeUnavailPct, spikeLatencyPct, spikeWindowDays,
      }));
    } catch {}
  }, [batchConcurrency, batchMaxPerRun, batchCooldownMs, avgRetryMs, spikeUnavailPct, spikeLatencyPct, spikeWindowDays]);

  // Source filter for unavailable CSV export
  const [csvSourceFilter, setCsvSourceFilter] = useState<string>('all');

  // Date range filters (created_at / last_seen)
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dateFrom, setDateFrom] = useState<string>(sevenDaysAgo.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState<string>(today.toISOString().slice(0, 10));

  // Batch progress (real-time)
  const [batchProgress, setBatchProgress] = useState<{ total: number; done: number; ok: number; fail: number }>({ total: 0, done: 0, ok: 0, fail: 0 });

  // Filtros/busca das tabelas (Última tentativa + Log)
  const [attemptStatusFilter, setAttemptStatusFilter] = useState<string>('all'); // all|ok|fail|2xx|4xx|5xx
  const [attemptSearch, setAttemptSearch] = useState<string>('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  // Confirmação Pausar/Retomar
  const [confirmAction, setConfirmAction] = useState<null | 'pause' | 'resume'>(null);

  // Falhas consecutivas por capítulo → alerta repetidas
  const consecutiveFailures = useRef<Map<string, number>>(new Map());
  const REPEATED_FAIL_THRESHOLD = 3;
  const notifiedRepeated = useRef<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const fromIso = new Date(`${dateFrom}T00:00:00`).toISOString();
    const toIso = new Date(`${dateTo}T23:59:59`).toISOString();
    const [m, a] = await Promise.all([
      supabase.from('bible_cache_metric_events')
        .select('abbrev, chapter, source, cache, status_code, created_at, total_ms')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false }).limit(2000),
      supabase.from('bible_audit_alerts')
        .select('id, severity, message, details, is_resolved, created_at')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false }).limit(50),
    ]);
    setEntries((m.data ?? []) as SourceEntry[]);
    setAlerts((a.data ?? []) as AlertRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const latestBySource = useMemo(() => {
    const map = new Map<string, SourceEntry>();
    for (const e of entries) {
      const key = `${e.abbrev}:${e.chapter}`;
      if (!map.has(key)) map.set(key, e);
    }
    return map;
  }, [entries]);

  const unavailableChapters = useMemo(() => {
    const seen = new Set<string>();
    const out: SourceEntry[] = [];
    for (const e of entries) {
      const key = `${e.abbrev}:${e.chapter}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (e.source === 'unavailable' || e.status_code >= 400) out.push(e);
    }
    return out;
  }, [entries]);

  // Attempt counts per chapter (from event history within range)
  const attemptsByChapter = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (e.source === 'unavailable' || e.status_code >= 400) {
        const key = `${e.abbrev}:${e.chapter}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  }, [entries]);

  const missingList = useMemo(() => {
    const rows: { abbrev: string; chapter: number }[] = [];
    for (const [abbr, chapters] of Object.entries(BIBLE_MISSING_CHAPTERS)) {
      for (const ch of chapters) rows.push({ abbrev: abbr, chapter: ch });
    }
    return rows;
  }, []);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of latestBySource.values()) {
      const k = (e.source ?? 'unknown') as string;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [latestBySource]);

  const sourceSla = useMemo(() => {
    const buckets = new Map<string, { total: number; unavailable: number; sumMs: number; samples: number; errors: number }>();
    for (const e of entries) {
      const src = (e.source ?? 'unknown') as string;
      const b = buckets.get(src) ?? { total: 0, unavailable: 0, sumMs: 0, samples: 0, errors: 0 };
      b.total++;
      if (src === 'unavailable' || e.status_code >= 400) b.unavailable++;
      if (e.status_code >= 500) b.errors++;
      const ms = e.total_ms;
      if (typeof ms === 'number' && ms > 0) { b.sumMs += ms; b.samples++; }
      buckets.set(src, b);
    }
    return [...buckets.entries()].map(([source, b]) => ({
      source, total: b.total, unavailable: b.unavailable, errors: b.errors,
      unavailableRate: b.total > 0 ? b.unavailable / b.total : 0,
      avgMs: b.samples > 0 ? Math.round(b.sumMs / b.samples) : null,
    })).sort((a, b) => b.total - a.total);
  }, [entries]);

  // Timeline: per day × per source — rate of unavailable + avg latency
  const slaTimeline = useMemo(() => {
    const daily = new Map<string, Map<string, { total: number; unavailable: number; sumMs: number; samples: number }>>();
    for (const e of entries) {
      const day = e.created_at.slice(0, 10);
      const src = (e.source ?? 'unknown') as string;
      if (!daily.has(day)) daily.set(day, new Map());
      const inner = daily.get(day)!;
      const b = inner.get(src) ?? { total: 0, unavailable: 0, sumMs: 0, samples: 0 };
      b.total++;
      if (src === 'unavailable' || e.status_code >= 400) b.unavailable++;
      if (typeof e.total_ms === 'number' && e.total_ms > 0) { b.sumMs += e.total_ms; b.samples++; }
      inner.set(src, b);
    }
    const days = [...daily.keys()].sort();
    const sources = [...new Set(entries.map(e => (e.source ?? 'unknown') as string))];
    return { days, sources, daily };
  }, [entries]);

  // Spike detection: compare last N days vs prior N days per source
  const spikeAlerts = useMemo(() => {
    const days = slaTimeline.days;
    if (days.length < 2) return [] as { source: string; metric: 'unavailable' | 'latency'; recent: number; prior: number; delta: number }[];
    const N = Math.max(1, spikeWindowDays);
    const recentDays = days.slice(-N);
    const priorDays = days.slice(-2 * N, -N);
    const agg = (ds: string[]) => {
      const out = new Map<string, { total: number; unavailable: number; sumMs: number; samples: number }>();
      for (const d of ds) {
        const inner = slaTimeline.daily.get(d);
        if (!inner) continue;
        for (const [src, b] of inner) {
          const x = out.get(src) ?? { total: 0, unavailable: 0, sumMs: 0, samples: 0 };
          x.total += b.total; x.unavailable += b.unavailable; x.sumMs += b.sumMs; x.samples += b.samples;
          out.set(src, x);
        }
      }
      return out;
    };
    const recent = agg(recentDays);
    const prior = agg(priorDays);
    const alerts: { source: string; metric: 'unavailable' | 'latency'; recent: number; prior: number; delta: number }[] = [];
    for (const [src, r] of recent) {
      const p = prior.get(src);
      if (!p) continue;
      const rRate = r.total > 0 ? (r.unavailable / r.total) * 100 : 0;
      const pRate = p.total > 0 ? (p.unavailable / p.total) * 100 : 0;
      const rateDelta = rRate - pRate;
      if (rateDelta >= spikeUnavailPct) {
        alerts.push({ source: src, metric: 'unavailable', recent: rRate, prior: pRate, delta: rateDelta });
      }
      const rAvg = r.samples > 0 ? r.sumMs / r.samples : 0;
      const pAvg = p.samples > 0 ? p.sumMs / p.samples : 0;
      if (pAvg > 0) {
        const pct = ((rAvg - pAvg) / pAvg) * 100;
        if (pct >= spikeLatencyPct) {
          alerts.push({ source: src, metric: 'latency', recent: rAvg, prior: pAvg, delta: pct });
        }
      }
    }
    return alerts;
  }, [slaTimeline, spikeWindowDays, spikeUnavailPct, spikeLatencyPct]);

  const escapeCsv = (s: any) => {
    const v = String(s ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };

  const downloadCsv = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportAlertsCsv = () => {
    const rows: string[][] = [[
      'alert_id', 'created_at', 'severity', 'book', 'chapter', 'source', 'root_cause', 'attempts', 'last_seen', 'message',
    ]];
    for (const a of alerts) {
      const d: any = a.details ?? {};
      const items = [...(Array.isArray(d.new_problems) ? d.new_problems : []), ...(Array.isArray(d.recurrent_problems) ? d.recurrent_problems : [])];
      if (items.length === 0) {
        rows.push([a.id, a.created_at, a.severity, '', '', '', '', '', '', a.message ?? '']);
        continue;
      }
      for (const p of items) {
        const cause = Array.isArray(p.failed_sources) && p.failed_sources.length > 0 ? `failed:${p.failed_sources.join('|')}` : 'unknown';
        rows.push([
          a.id, a.created_at, a.severity,
          String(p.abbrev ?? ''), String(p.chapter ?? ''),
          Array.isArray(p.failed_sources) ? p.failed_sources.join('|') : '',
          cause, String(p.occurrences ?? ''), String(p.last_seen ?? ''),
          (a.message ?? '').replace(/[\r\n]+/g, ' '),
        ]);
      }
    }
    downloadCsv(rows, `bible-alerts-${dateFrom}_to_${dateTo}.csv`);
    toast.success(`CSV de alertas exportado (${rows.length - 1} linhas)`);
  };

  const filterMatchesSource = (e: SourceEntry, filter: string) => {
    if (filter === 'all') return true;
    const s = (e.source ?? '') as string;
    if (filter === 'bolls') return s.startsWith('BollsLife');
    if (filter === 'biblia') return s.startsWith('BibliaCatolica');
    if (filter === 'dump') return s.startsWith('Cathedra');
    if (filter === 'unavailable') return s === 'unavailable';
    return true;
  };

  const exportUnavailableCsv = () => {
    const filtered = unavailableChapters.filter(e => filterMatchesSource(e, csvSourceFilter));
    const rows: string[][] = [[
      'book', 'chapter', 'last_source', 'root_cause', 'status_code',
      'attempts_in_range', 'last_seen', 'bolls', 'biblia', 'dump',
    ]];
    for (const e of filtered) {
      const chain = deriveFallbackChain(e);
      const key = `${e.abbrev}:${e.chapter}`;
      rows.push([
        e.abbrev, String(e.chapter), String(e.source ?? ''),
        deriveRootCause(e), String(e.status_code ?? ''),
        String(attemptsByChapter.get(key) ?? 1),
        e.created_at,
        chain.bolls, chain.biblia, chain.dump,
      ]);
    }
    const suffix = csvSourceFilter === 'all' ? '' : `-${csvSourceFilter}`;
    downloadCsv(rows, `bible-unavailable${suffix}-${dateFrom}_to_${dateTo}.csv`);
    toast.success(`CSV de indisponíveis exportado (${rows.length - 1} linhas, fonte=${csvSourceFilter})`);
  };

  const runImport = async (targets?: { abbrev: string; chapter: number }[]) => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-import-deutero', {
        body: { dryRun: false, ...(targets ? { targets } : {}) },
      });
      if (error) throw error;
      toast.success(`Importação: ${data?.imported ?? 0}/${data?.total ?? 0}.`);
      await load();
      return data;
    } catch (e: any) {
      toast.error(`Falha no import: ${e?.message ?? e}`);
    } finally {
      setImporting(false);
    }
  };

  const runReport = async () => {
    setReporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-availability-report', {
        body: { hours: 24, from: dateFrom, to: dateTo },
      });
      if (error) throw error;
      toast.success(`Relatório: ${data?.report?.problem_chapters ?? 0} problemas, ${data?.report?.new_problem_chapters ?? 0} novos.`);
      await load();
    } catch (e: any) {
      toast.error(`Falha no relatório: ${e?.message ?? e}`);
    } finally {
      setReporting(false);
    }
  };

  const retryChapter = async (abbrev: string, chapter: number): Promise<{ outcome: string; httpStatus?: number | null; error?: string | null }> => {
    const key = `${abbrev}:${chapter}`;
    const now = Date.now();
    const last = lastRetryAt.current.get(key) ?? 0;
    if (now - last < batchCooldownMs) return { outcome: 'cooldown', httpStatus: null, error: null };
    lastRetryAt.current.set(key, now);
    let result: { outcome: string; httpStatus?: number | null; error?: string | null };
    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { abbrev, chapter, force_revalidate: true },
      });
      const httpStatus = (error as any)?.context?.status ?? (data?.status_code ?? null);
      if (error) {
        result = { outcome: `error: ${error.message}`, httpStatus, error: error.message };
      } else if (data?.unavailable) {
        const imp = await supabase.functions.invoke('bible-import-deutero', {
          body: { dryRun: false, targets: [{ abbrev, chapter }] },
        });
        const r = imp.data?.results?.[0];
        const impStatus = (imp.error as any)?.context?.status ?? null;
        result = r?.status === 'imported'
          ? { outcome: `imported (${r.verses}v)`, httpStatus: impStatus, error: null }
          : { outcome: `failed: ${r?.error ?? r?.status ?? 'unknown'}`, httpStatus: impStatus, error: r?.error ?? null };
      } else {
        result = { outcome: `resolved via ${data?.metadata?.source ?? 'unknown'}`, httpStatus, error: null };
      }
    } catch (e: any) {
      result = { outcome: `error: ${e?.message ?? e}`, httpStatus: null, error: String(e?.message ?? e) };
    }
    const ts = new Date().toISOString();
    setLastAttempts(prev => ({ ...prev, [key]: { ts, ...result } }));
    return result;
  };

  // Aguarda enquanto pausa estiver ativa (polling leve, sem timers pesados)
  const waitWhilePaused = async () => {
    while (pausedRef.current) {
      await new Promise(r => setTimeout(r, 250));
    }
  };

  useEffect(() => {
    if (!autoRetry) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled || unavailableChapters.length === 0) return;
      const log: RetryLogRow[] = [];
      for (const c of unavailableChapters.slice(0, 5)) {
        if (cancelled) break;
        await waitWhilePaused();
        const r = await retryChapter(c.abbrev, c.chapter);
        log.push({ ts: new Date().toISOString(), target: `${c.abbrev} ${c.chapter}`, outcome: r.outcome, httpStatus: r.httpStatus ?? null, error: r.error ?? null });
      }
      if (!cancelled) {
        setRetryLog(prev => [...log, ...prev].slice(0, 30));
        await load();
      }
    };
    tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRetry, unavailableChapters.length, batchCooldownMs]);

  const runBatchRetry = async () => {
    if (batchRunning) return;
    const queue = unavailableChapters.slice(0, batchMaxPerRun);
    if (queue.length === 0) { toast.info('Nada para reprocessar.'); return; }
    setBatchRunning(true);
    setPaused(false);
    const log: RetryLogRow[] = [];
    let idx = 0;
    const workers = Array.from({ length: Math.max(1, batchConcurrency) }, async () => {
      while (idx < queue.length) {
        await waitWhilePaused();
        const c = queue[idx++];
        const r = await retryChapter(c.abbrev, c.chapter);
        log.push({ ts: new Date().toISOString(), target: `${c.abbrev} ${c.chapter}`, outcome: r.outcome, httpStatus: r.httpStatus ?? null, error: r.error ?? null });
      }
    });
    await Promise.all(workers);
    setRetryLog(prev => [...log, ...prev].slice(0, 60));
    const resolved = log.filter(l => l.outcome.startsWith('resolved') || l.outcome.startsWith('imported')).length;
    toast.success(`Batch retry: ${resolved}/${queue.length} resolvidos.`);
    await load();
    setBatchRunning(false);
  };

  const simulateBatchRetry = () => {
    const queue = unavailableChapters.slice(0, batchMaxPerRun);
    if (queue.length === 0) { toast.info('Nada a simular: nenhum capítulo indisponível no período.'); return; }
    const now = Date.now();
    const eligible = queue.filter(c => {
      const last = lastRetryAt.current.get(`${c.abbrev}:${c.chapter}`) ?? 0;
      return now - last >= batchCooldownMs;
    });
    const inCooldown = queue.length - eligible.length;
    const workers = Math.max(1, batchConcurrency);
    // Round-robin estimate: ceil(N/workers) * avgRetryMs
    const wavesMs = Math.ceil(eligible.length / workers) * avgRetryMs;
    const secs = Math.round(wavesMs / 1000);
    const minutes = Math.floor(secs / 60);
    const remSec = secs % 60;
    toast.message('Simulação de re-tentar lote', {
      description: `Fila: ${queue.length} · Elegíveis: ${eligible.length} · Em cooldown: ${inCooldown} · Workers: ${workers} · Previsão: ~${minutes}m${remSec}s (avg ${avgRetryMs}ms/cap)`,
      duration: 8000,
    });
  };

  const runReconcile = async () => {
    setReconciling(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-alerts-reconcile', { body: {} });
      if (error) throw error;
      const s = data?.stats ?? {};
      toast.success(`Reconciliado: ${s.chapters_resolved ?? 0} resolvidos, ${s.alerts_resolved ?? 0} alertas fechados, ${s.legacy_events_purged ?? 0} eventos purgados.`);
      await load();
    } catch (e: any) {
      toast.error(`Falha no reconcile: ${e?.message ?? e}`);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Auditoria de Fontes da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Origem usada por capítulo, alertas de indisponibilidade, SLA e auto-retry.
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="auto-retry" className="text-xs">Auto-retry (5min)</Label>
            <Switch id="auto-retry" checked={autoRetry} onCheckedChange={setAutoRetry} />
          </div>
          <Button onClick={runReport} disabled={reporting} size="sm" variant="secondary">
            <FileText className="w-4 h-4 mr-2" />{reporting ? 'Gerando…' : 'Gerar relatório'}
          </Button>
          <Button onClick={exportAlertsCsv} disabled={alerts.length === 0} size="sm" variant="secondary">
            <Download className="w-4 h-4 mr-2" />CSV alertas
          </Button>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-card">
            <Label className="text-xs text-muted-foreground">CSV fonte:</Label>
            <Select value={csvSourceFilter} onValueChange={setCsvSourceFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="bolls">bolls.life</SelectItem>
                <SelectItem value="biblia">BibliaCatolica</SelectItem>
                <SelectItem value="dump">dump (Cathedra)</SelectItem>
                <SelectItem value="unavailable">unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportUnavailableCsv} disabled={unavailableChapters.length === 0} size="sm" variant="secondary">
              <Download className="w-4 h-4 mr-2" />CSV indisponíveis
            </Button>
          </div>
          <Button onClick={runReconcile} disabled={reconciling} size="sm" variant="secondary">
            <Wand2 className="w-4 h-4 mr-2" />{reconciling ? 'Reconciliando…' : 'Reclassificar'}
          </Button>
          <Button onClick={simulateBatchRetry} disabled={unavailableChapters.length === 0} size="sm" variant="outline">
            <FlaskConical className="w-4 h-4 mr-2" />Simular lote
          </Button>
          <Button onClick={runBatchRetry} disabled={batchRunning || unavailableChapters.length === 0} size="sm">
            <Layers className="w-4 h-4 mr-2" />{batchRunning ? 'Reprocessando…' : `Re-tentar lote (${Math.min(unavailableChapters.length, batchMaxPerRun)})`}
          </Button>
          {batchRunning && (
            paused ? (
              <Button onClick={() => { setPaused(false); toast.success('Retomado.'); }} size="sm" variant="outline">
                <PlayCircle className="w-4 h-4 mr-2" />Retomar
              </Button>
            ) : (
              <Button onClick={() => { setPaused(true); toast.message('Pausado — workers aguardando.'); }} size="sm" variant="outline">
                <PauseCircle className="w-4 h-4 mr-2" />Pausar
              </Button>
            )
          )}
          <Button onClick={() => runImport()} disabled={importing} size="sm">
            {importing ? 'Importando…' : 'Importar faltantes'}
          </Button>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros: intervalo de datas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros — intervalo de datas (created_at / last_seen)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs">De</Label>
            <Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs">Até</Label>
            <Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-44" />
          </div>
          <Button onClick={load} size="sm" variant="secondary" disabled={loading}>Aplicar</Button>
          <p className="text-xs text-muted-foreground ml-auto">{entries.length} eventos · {alerts.length} alertas no período</p>
        </CardContent>
      </Card>

      {/* Controles do batch retry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Re-tentar em lote & detecção de spikes — persistido localmente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="b-conc" className="text-xs">Concorrência (workers paralelos)</Label>
            <Input id="b-conc" type="number" min={1} max={10} value={batchConcurrency}
                   onChange={e => setBatchConcurrency(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="b-max" className="text-xs">Máximo por execução</Label>
            <Input id="b-max" type="number" min={1} max={200} value={batchMaxPerRun}
                   onChange={e => setBatchMaxPerRun(Math.max(1, Math.min(200, Number(e.target.value) || 1)))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="b-cool" className="text-xs">Cooldown por capítulo (segundos)</Label>
            <Input id="b-cool" type="number" min={0} max={3600} value={Math.round(batchCooldownMs / 1000)}
                   onChange={e => setBatchCooldownMs(Math.max(0, Math.min(3600, Number(e.target.value) || 0)) * 1000)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="b-avg" className="text-xs">Tempo médio estimado por capítulo (ms, simulação)</Label>
            <Input id="b-avg" type="number" min={100} max={60000} step={100} value={avgRetryMs}
                   onChange={e => setAvgRetryMs(Math.max(100, Math.min(60000, Number(e.target.value) || 1500)))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-unav" className="text-xs">Spike — Δ taxa unavailable (pontos %)</Label>
            <Input id="sp-unav" type="number" min={1} max={100} value={spikeUnavailPct}
                   onChange={e => setSpikeUnavailPct(Math.max(1, Math.min(100, Number(e.target.value) || 15)))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-lat" className="text-xs">Spike — Δ latência média (%)</Label>
            <Input id="sp-lat" type="number" min={1} max={500} value={spikeLatencyPct}
                   onChange={e => setSpikeLatencyPct(Math.max(1, Math.min(500, Number(e.target.value) || 50)))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp-win" className="text-xs">Janela do spike (X dias recentes vs prévios)</Label>
            <Input id="sp-win" type="number" min={1} max={14} value={spikeWindowDays}
                   onChange={e => setSpikeWindowDays(Math.max(1, Math.min(14, Number(e.target.value) || 3)))} />
          </div>
          <p className="md:col-span-3 text-xs text-muted-foreground">
            Ajustes persistem em localStorage (chave <code>{LS_KEY}</code>) e sobrevivem a reload.
          </p>
        </CardContent>
      </Card>

      {/* Alertas de spike automáticos */}
      {spikeAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <TrendingUp className="w-4 h-4" /> Spike detectado ({spikeAlerts.length}) — últimos {spikeWindowDays}d vs prévios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Métrica</TableHead>
                  <TableHead className="text-right">Prévio</TableHead>
                  <TableHead className="text-right">Recente</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spikeAlerts.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{sourceBadge(s.source as any)}</TableCell>
                    <TableCell className="text-xs">{s.metric === 'unavailable' ? 'taxa unavailable' : 'latência média'}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {s.metric === 'unavailable' ? `${s.prior.toFixed(1)}%` : `${Math.round(s.prior)}ms`}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {s.metric === 'unavailable' ? `${s.recent.toFixed(1)}%` : `${Math.round(s.recent)}ms`}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums font-semibold text-red-700">
                      {s.metric === 'unavailable' ? `+${s.delta.toFixed(1)}pp` : `+${s.delta.toFixed(0)}%`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Alertas recentes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas recentes ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="text-right">Novos / Recorrentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs font-mono">{new Date(a.created_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'}>{a.severity}</Badge></TableCell>
                    <TableCell className="text-xs">{a.message}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {a.details?.new_problem_chapters ?? 0} / {a.details?.recurrent_problem_chapters ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sumário de fontes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(sourceCounts).map(([src, count]) => (
          <Card key={src}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider">{src}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{count}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* SLA por fonte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe2 className="w-4 h-4" /> SLA por fonte (últimos {entries.length} eventos no período)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fonte</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
                <TableHead className="text-right">Unavailable</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Latência média</TableHead>
                <TableHead className="text-right">Erros 5xx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceSla.map(r => {
                const pct = (r.unavailableRate * 100).toFixed(1);
                const bad = r.unavailableRate >= 0.1;
                return (
                  <TableRow key={r.source}>
                    <TableCell>{sourceBadge(r.source as any)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{r.total}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{r.unavailable}</TableCell>
                    <TableCell className={`text-right tabular-nums text-xs font-semibold ${bad ? 'text-red-600' : 'text-emerald-600'}`}>{pct}%</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{r.avgMs != null ? `${r.avgMs}ms` : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{r.errors}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Linha do tempo SLA */}
      {slaTimeline.days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="w-4 h-4" /> Linha do tempo — taxa de unavailable & latência média por dia
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  {slaTimeline.sources.map(s => (
                    <TableHead key={s} className="text-right">{s}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaTimeline.days.map(day => {
                  const inner = slaTimeline.daily.get(day)!;
                  return (
                    <TableRow key={day}>
                      <TableCell className="text-xs font-mono">{day}</TableCell>
                      {slaTimeline.sources.map(s => {
                        const b = inner.get(s);
                        if (!b) return <TableCell key={s} className="text-right text-xs text-muted-foreground">—</TableCell>;
                        const rate = b.total > 0 ? (b.unavailable / b.total) * 100 : 0;
                        const avg = b.samples > 0 ? Math.round(b.sumMs / b.samples) : null;
                        const bad = rate >= 10;
                        // Sparkline-ish bar
                        const barW = Math.min(100, Math.max(2, rate));
                        return (
                          <TableCell key={s} className="text-right text-xs tabular-nums">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-1.5 rounded bg-zinc-200 overflow-hidden">
                                <div className={`h-full ${bad ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${barW}%` }} />
                              </div>
                              <span className={`font-semibold ${bad ? 'text-red-600' : 'text-emerald-700'}`}>{rate.toFixed(1)}%</span>
                              <span className="text-muted-foreground">{avg != null ? `${avg}ms` : '—'}</span>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Indisponíveis com root_cause + fallback chain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Capítulos servidos como unavailable ({unavailableChapters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unavailableChapters.length === 0 ? (
            <p className="text-sm text-emerald-700 py-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Nenhum capítulo indisponível no período selecionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capítulo</TableHead>
                  <TableHead>Fonte usada</TableHead>
                  <TableHead>Cadeia de fallback</TableHead>
                  <TableHead>Causa raiz</TableHead>
                  <TableHead className="text-right">Tentativas</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unavailableChapters.map((e) => {
                  const chain = deriveFallbackChain(e);
                  const key = `${e.abbrev}:${e.chapter}`;
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">{e.abbrev} {e.chapter}</TableCell>
                      <TableCell>{sourceBadge(e.source)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {chainBadge('bolls', chain.bolls)}
                          <span className="text-muted-foreground">→</span>
                          {chainBadge('biblia', chain.biblia)}
                          <span className="text-muted-foreground">→</span>
                          {chainBadge('dump', chain.dump)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{deriveRootCause(e)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{attemptsByChapter.get(key) ?? 1}</TableCell>
                      <TableCell className="text-xs font-mono">{new Date(e.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={async () => {
                          const r = await retryChapter(e.abbrev, e.chapter);
                          toast.message(`${e.abbrev} ${e.chapter}: ${r.outcome}`);
                          setRetryLog(prev => [{ ts: new Date().toISOString(), target: `${e.abbrev} ${e.chapter}`, outcome: r.outcome }, ...prev].slice(0, 30));
                          await load();
                        }}>
                          <Repeat className="w-3 h-3 mr-1" /> Re-tentar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Última tentativa por capítulo */}
      {Object.keys(lastAttempts).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Repeat className="w-4 h-4" /> Última tentativa por capítulo ({Object.keys(lastAttempts).length})
              {batchRunning && (
                <Badge variant={paused ? 'outline' : 'secondary'} className="ml-2">
                  {paused ? 'Pausado' : 'Em execução'}
                </Badge>
              )}
            </CardTitle>
            {batchRunning && (
              paused ? (
                <Button onClick={() => { setPaused(false); toast.success('Retomado.'); }} size="sm" variant="outline">
                  <PlayCircle className="w-4 h-4 mr-2" />Retomar
                </Button>
              ) : (
                <Button onClick={() => { setPaused(true); toast.message('Pausado — workers aguardando.'); }} size="sm" variant="outline">
                  <PauseCircle className="w-4 h-4 mr-2" />Pausar
                </Button>
              )
            )}
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capítulo</TableHead>
                    <TableHead>Último timestamp</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Resultado / erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(lastAttempts)
                    .sort(([, a], [, b]) => b.ts.localeCompare(a.ts))
                    .map(([key, a]) => {
                      const failed = a.outcome.startsWith('error') || a.outcome.startsWith('failed');
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-mono text-xs">{key}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(a.ts).toLocaleString()}</TableCell>
                          <TableCell>
                            {a.httpStatus ? (
                              <Badge variant={a.httpStatus >= 400 ? 'destructive' : 'secondary'}>{a.httpStatus}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-xs ${failed ? 'text-destructive' : ''}`}>
                            <div className="font-mono break-all">{a.outcome}</div>
                            {a.error && <div className="text-[10px] text-muted-foreground mt-0.5 break-all">{a.error}</div>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log de retries */}
      {retryLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Log de tentativas ({retryLog.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
              {retryLog.map((r, i) => (
                <div key={i}>
                  <span className="text-muted-foreground">{new Date(r.ts).toLocaleTimeString()}</span>
                  {' · '}<span className="font-semibold">{r.target}</span>
                  {r.httpStatus != null && <> {' · '}<span className={r.httpStatus >= 400 ? 'text-destructive' : ''}>HTTP {r.httpStatus}</span></>}
                  {' → '}{r.outcome}
                  {r.error && <span className="text-muted-foreground"> ({r.error})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gaps hardcoded */}
      {missingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Gaps conhecidos (hardcoded)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">{MISSING_CHAPTER_REASON}</p>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Capítulo</TableHead><TableHead>Última fonte</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {missingList.map(({ abbrev, chapter }) => {
                  const entry = latestBySource.get(`${abbrev}:${chapter}`);
                  const resolved = entry && entry.source && entry.source !== 'unavailable';
                  return (
                    <TableRow key={`${abbrev}:${chapter}`}>
                      <TableCell className="font-mono text-xs">{abbrev} {chapter}</TableCell>
                      <TableCell>{sourceBadge(entry?.source ?? null)}</TableCell>
                      <TableCell>
                        {resolved
                          ? <span className="text-emerald-600 flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />resolvido</span>
                          : <span className="text-amber-600 text-xs">pendente</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
