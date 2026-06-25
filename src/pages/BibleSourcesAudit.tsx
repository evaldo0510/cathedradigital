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
import { RefreshCw, AlertTriangle, CheckCircle2, Database, Globe2, Repeat, FileText, Download, Wand2, Layers, Sliders, Filter } from 'lucide-react';
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
  const [reconciling, setReconciling] = useState(false);
  const [retryLog, setRetryLog] = useState<{ ts: string; target: string; outcome: string }[]>([]);
  const lastRetryAt = useRef<Map<string, number>>(new Map());

  // Batch retry controls (live-tunable)
  const [batchConcurrency, setBatchConcurrency] = useState(2);
  const [batchMaxPerRun, setBatchMaxPerRun] = useState(25);
  const [batchCooldownMs, setBatchCooldownMs] = useState(2 * 60 * 1000);

  // Date range filters (created_at / last_seen)
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dateFrom, setDateFrom] = useState<string>(sevenDaysAgo.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState<string>(today.toISOString().slice(0, 10));

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

  const exportUnavailableCsv = () => {
    const rows: string[][] = [[
      'book', 'chapter', 'last_source', 'root_cause', 'status_code',
      'attempts_in_range', 'last_seen', 'bolls', 'biblia', 'dump',
    ]];
    for (const e of unavailableChapters) {
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
    downloadCsv(rows, `bible-unavailable-${dateFrom}_to_${dateTo}.csv`);
    toast.success(`CSV de indisponíveis exportado (${rows.length - 1} linhas)`);
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

  const retryChapter = async (abbrev: string, chapter: number) => {
    const key = `${abbrev}:${chapter}`;
    const now = Date.now();
    const last = lastRetryAt.current.get(key) ?? 0;
    if (now - last < batchCooldownMs) return { outcome: 'cooldown' };
    lastRetryAt.current.set(key, now);
    try {
      const { data } = await supabase.functions.invoke('bible-text', {
        body: { abbrev, chapter, force_revalidate: true },
      });
      if (data?.unavailable) {
        const imp = await supabase.functions.invoke('bible-import-deutero', {
          body: { dryRun: false, targets: [{ abbrev, chapter }] },
        });
        const result = imp.data?.results?.[0];
        return { outcome: result?.status === 'imported' ? `imported (${result.verses}v)` : `failed: ${result?.error ?? result?.status ?? 'unknown'}` };
      }
      return { outcome: `resolved via ${data?.metadata?.source ?? 'unknown'}` };
    } catch (e: any) {
      return { outcome: `error: ${e?.message ?? e}` };
    }
  };

  useEffect(() => {
    if (!autoRetry) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled || unavailableChapters.length === 0) return;
      const log: typeof retryLog = [];
      for (const c of unavailableChapters.slice(0, 5)) {
        const r = await retryChapter(c.abbrev, c.chapter);
        log.push({ ts: new Date().toISOString(), target: `${c.abbrev} ${c.chapter}`, outcome: r.outcome });
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
    const log: typeof retryLog = [];
    let idx = 0;
    const workers = Array.from({ length: Math.max(1, batchConcurrency) }, async () => {
      while (idx < queue.length) {
        const c = queue[idx++];
        const r = await retryChapter(c.abbrev, c.chapter);
        log.push({ ts: new Date().toISOString(), target: `${c.abbrev} ${c.chapter}`, outcome: r.outcome });
      }
    });
    await Promise.all(workers);
    setRetryLog(prev => [...log, ...prev].slice(0, 60));
    const resolved = log.filter(l => l.outcome.startsWith('resolved') || l.outcome.startsWith('imported')).length;
    toast.success(`Batch retry: ${resolved}/${queue.length} resolvidos.`);
    await load();
    setBatchRunning(false);
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
          <Button onClick={exportUnavailableCsv} disabled={unavailableChapters.length === 0} size="sm" variant="secondary">
            <Download className="w-4 h-4 mr-2" />CSV indisponíveis
          </Button>
          <Button onClick={runReconcile} disabled={reconciling} size="sm" variant="secondary">
            <Wand2 className="w-4 h-4 mr-2" />{reconciling ? 'Reconciliando…' : 'Reclassificar'}
          </Button>
          <Button onClick={runBatchRetry} disabled={batchRunning || unavailableChapters.length === 0} size="sm">
            <Layers className="w-4 h-4 mr-2" />{batchRunning ? 'Reprocessando…' : `Re-tentar lote (${Math.min(unavailableChapters.length, batchMaxPerRun)})`}
          </Button>
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
            <Sliders className="w-4 h-4" /> Re-tentar em lote — controles temporários
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
          <p className="md:col-span-3 text-xs text-muted-foreground">
            Ajustes vivem nesta sessão. Recarregar a página restaura os padrões (2 / 25 / 120s).
          </p>
        </CardContent>
      </Card>

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

      {/* Log de retries */}
      {retryLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Log de tentativas ({retryLog.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
              {retryLog.map((r, i) => (
                <div key={i}><span className="text-muted-foreground">{new Date(r.ts).toLocaleTimeString()}</span> · <span className="font-semibold">{r.target}</span> → {r.outcome}</div>
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
