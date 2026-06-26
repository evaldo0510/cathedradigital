import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Activity, ShieldAlert, Download, Mail, PlayCircle, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import BibleCacheBenchmarkCompare from './BibleCacheBenchmarkCompare';

interface TimeseriesRow {
  bucket_start: string;
  abbrev: string;
  total: number;
  hits: number;
  misses: number;
  stale: number;
  l1_fresh: number;
  l1_stale: number;
  l1_miss: number;
  l1_bypass: number;
  edge_avg_ms: number | null;
  edge_p50_ms: number;
  edge_p95_ms: number;
  edge_max_ms: number;
  total_avg_ms: number | null;
  total_p50_ms: number;
  total_p95_ms: number;
  total_max_ms: number;
  sql_avg_ms: number | null;
  sql_p95_ms: number;
  worst_correlation_ids: string[] | null;
}

interface DrilldownRow {
  created_at: string;
  abbrev: string;
  chapter: number | null;
  cache: string | null;
  l1_phase: string | null;
  correlation_id: string | null;
  total_ms: number | null;
  sql_ms: number | null;
  edge_ms: number | null;
  bolls_ms: number | null;
  bolls_ok: boolean | null;
  status_code: number | null;
  cold_start: boolean | null;
  cache_level: 'L1' | 'L2' | 'DB' | 'UNAVAILABLE' | null;
  total_wall_clock_ms: number | null;
  instance_id: string | null;
  request_source: string | null;
  sql_breakdown: Array<{ label: string; ms: number }> | null;
}

interface DiagnosticRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  triggered_by: string;
  total_books_checked: number;
  total_chapters_checked: number;
  total_findings: number;
  duration_ms: number | null;
  error: string | null;
}

const WINDOW_OPTIONS = [
  { value: '1', label: '1 min' }, { value: '5', label: '5 min' }, { value: '15', label: '15 min' },
  { value: '60', label: '1 hora' }, { value: '360', label: '6 horas' },
];
const SINCE_OPTIONS = [
  { value: '1', label: 'Última hora' }, { value: '6', label: 'Últimas 6h' },
  { value: '24', label: 'Últimas 24h' }, { value: '72', label: 'Últimos 3 dias' }, { value: '168', label: 'Últimos 7 dias' },
];

const STALE_LOW_CONFIDENCE_THRESHOLD = 30;

type SortKey = 'total_ms' | 'sql_ms' | 'edge_ms' | 'total_wall_clock_ms' | 'created_at';

function fmtTime(iso: string, windowMin: number): string {
  const d = new Date(iso);
  if (windowMin >= 60) return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit' });
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function downloadFile(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function l1PhaseColor(phase: string | null | undefined): string {
  switch (phase) {
    case 'fresh': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'stale': return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'miss': return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    case 'bypass': return 'bg-muted text-muted-foreground border-border';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export default function BibleCacheTimeseriesDashboard() {
  const [windowMinutes, setWindowMinutes] = useState('5');
  const [sinceHours, setSinceHours] = useState('24');
  const [abbrev, setAbbrev] = useState('');
  const [rows, setRows] = useState<TimeseriesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [drillOpen, setDrillOpen] = useState(false);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillRows, setDrillRows] = useState<DrilldownRow[]>([]);
  const [drillTitle, setDrillTitle] = useState('');

  // Drilldown filters/sort
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterInstance, setFilterInstance] = useState<string>('all');
  const [filterCold, setFilterCold] = useState<string>('all'); // all | true | false | compare
  const [sortKey, setSortKey] = useState<SortKey>('total_ms');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [benchLoading, setBenchLoading] = useState(false);

  // Diagnostic panel
  const [diagRuns, setDiagRuns] = useState<DiagnosticRun[]>([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);

  const load = async () => {
    setLoading(true); setError(null); setErrorCode(null);
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: { action: 'series', window_minutes: Number(windowMinutes), since_hours: Number(sinceHours), abbrev: abbrev.trim() || null },
      });
      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        if (ctx?.status === 403) { setErrorCode('not_admin'); setError('forbidden'); return; }
        throw error;
      }
      setRows(((data as { rows?: TimeseriesRow[] })?.rows) ?? []);
    } catch (e) {
      setError((e as Error).message ?? 'Erro ao carregar métricas'); setRows([]);
    } finally { setLoading(false); }
  };

  const loadDiagRuns = async () => {
    setDiagLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', { body: { action: 'list_runs', limit: 10 } });
      if (error) throw error;
      setDiagRuns(((data as { rows?: DiagnosticRun[] })?.rows) ?? []);
    } catch (e) {
      toast.error('Falha ao carregar diagnósticos: ' + ((e as Error).message ?? 'erro'));
    } finally { setDiagLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); loadDiagRuns(); }, []);

  const agg = useMemo(() => {
    const byBucket = new Map<string, TimeseriesRow & { _n: number }>();
    for (const r of rows) {
      const acc = byBucket.get(r.bucket_start);
      if (!acc) byBucket.set(r.bucket_start, { ...r, _n: 1 });
      else {
        acc.total += r.total; acc.hits += r.hits; acc.misses += r.misses; acc.stale += r.stale;
        acc.l1_fresh += r.l1_fresh; acc.l1_stale += r.l1_stale; acc.l1_miss += r.l1_miss; acc.l1_bypass += r.l1_bypass;
        acc.edge_avg_ms = ((acc.edge_avg_ms ?? 0) * acc._n + (r.edge_avg_ms ?? 0)) / (acc._n + 1);
        acc.edge_p95_ms = Math.max(acc.edge_p95_ms, r.edge_p95_ms);
        acc.total_p95_ms = Math.max(acc.total_p95_ms, r.total_p95_ms);
        const ids = (acc.worst_correlation_ids ?? []).concat(r.worst_correlation_ids ?? []);
        acc.worst_correlation_ids = ids.slice(0, 10);
        acc._n += 1;
      }
    }
    return Array.from(byBucket.values()).sort((a, b) => a.bucket_start.localeCompare(b.bucket_start))
      .map(r => ({
        ...r,
        time: fmtTime(r.bucket_start, Number(windowMinutes)),
        cache_hit_rate_pct: r.total > 0 ? Math.round((r.hits / r.total) * 10000) / 100 : 0,
        invalidation_pct: r.total > 0 ? Math.round((r.misses / r.total) * 10000) / 100 : 0,
        stale_low_confidence: r.l1_stale > 0 && r.l1_stale < STALE_LOW_CONFIDENCE_THRESHOLD,
      }));
  }, [rows, windowMinutes]);

  const totals = useMemo(() => {
    const t = agg.reduce((a, r) => ({
      total: a.total + r.total, hits: a.hits + r.hits, misses: a.misses + r.misses, stale: a.stale + r.stale,
      l1_fresh: a.l1_fresh + r.l1_fresh, l1_stale: a.l1_stale + r.l1_stale, l1_miss: a.l1_miss + r.l1_miss, l1_bypass: a.l1_bypass + r.l1_bypass,
    }), { total: 0, hits: 0, misses: 0, stale: 0, l1_fresh: 0, l1_stale: 0, l1_miss: 0, l1_bypass: 0 });
    return {
      ...t,
      hitRate: t.total > 0 ? ((t.hits / t.total) * 100).toFixed(1) : '0.0',
      invalidationRate: t.total > 0 ? ((t.misses / t.total) * 100).toFixed(1) : '0.0',
      staleLowConfidence: t.l1_stale > 0 && t.l1_stale < STALE_LOW_CONFIDENCE_THRESHOLD,
    };
  }, [agg]);

  // Lista de fontes/instâncias detectadas para popular selects
  const drillSources = useMemo(() => Array.from(new Set(drillRows.map(r => r.request_source ?? '').filter(Boolean))).sort(), [drillRows]);
  const drillInstances = useMemo(() => Array.from(new Set(drillRows.map(r => r.instance_id ?? '').filter(Boolean))).sort(), [drillRows]);

  const filteredDrill = useMemo(() => {
    let out = drillRows.slice();
    if (filterSource !== 'all') out = out.filter(r => (r.request_source ?? '') === filterSource);
    if (filterInstance !== 'all') out = out.filter(r => (r.instance_id ?? '') === filterInstance);
    if (filterCold === 'true') out = out.filter(r => r.cold_start === true);
    else if (filterCold === 'false') out = out.filter(r => r.cold_start === false);
    const dir = sortDir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      const va = (a[sortKey] ?? 0) as number | string;
      const vb = (b[sortKey] ?? 0) as number | string;
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * dir;
      return ((va as number) - (vb as number)) * dir;
    });
    return out;
  }, [drillRows, filterSource, filterInstance, filterCold, sortKey, sortDir]);

  // Comparação cold vs warm (quando filterCold = 'compare')
  const coldCompare = useMemo(() => {
    if (filterCold !== 'compare') return null;
    const cold = drillRows.filter(r => r.cold_start === true);
    const warm = drillRows.filter(r => r.cold_start === false);
    const stats = (arr: DrilldownRow[]) => {
      const totals = arr.map(r => r.total_ms ?? 0).filter(v => v > 0);
      const sorted = [...totals].sort((a, b) => a - b);
      const avg = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
      const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length))] : 0;
      const max = sorted.length ? sorted[sorted.length - 1] : 0;
      return { n: arr.length, avg, p95, max };
    };
    return { cold: stats(cold), warm: stats(warm) };
  }, [drillRows, filterCold]);

  const openDrilldown = async (bucketStart: string, displayTime: string) => {
    setDrillOpen(true); setDrillLoading(true); setDrillRows([]);
    setDrillTitle(`Top requests · ${displayTime}`);
    setFilterSource('all'); setFilterInstance('all'); setFilterCold('all');
    setSortKey('total_ms'); setSortDir('desc');
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: { action: 'drilldown', bucket_start: bucketStart, window_minutes: Number(windowMinutes), abbrev: abbrev.trim() || null, limit: 100 },
      });
      if (error) throw error;
      setDrillRows(((data as { rows?: DrilldownRow[] })?.rows) ?? []);
    } catch (e) {
      toast.error('Falha ao carregar drilldown: ' + ((e as Error).message ?? 'erro'));
    } finally { setDrillLoading(false); }
  };

  const handleChartClick = (e: { activePayload?: Array<{ payload?: { bucket_start?: string; time?: string } }> }) => {
    const p = e?.activePayload?.[0]?.payload;
    if (p?.bucket_start) openDrilldown(p.bucket_start, p.time ?? p.bucket_start);
  };

  const runBenchmark = async () => {
    setBenchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', { body: { action: 'benchmark', since_days: 7 } });
      if (error) throw error;
      const files = (data as { files?: { summary_csv: string; detailed_csv: string; report_md: string } }).files;
      if (!files) throw new Error('Resposta sem arquivos');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadFile(`bible_cache_ttl_benchmark_summary_${stamp}.csv`, 'text/csv', files.summary_csv);
      downloadFile(`bible_cache_ttl_benchmark_detailed_${stamp}.csv`, 'text/csv', files.detailed_csv);
      downloadFile(`bible_cache_ttl_benchmark_report_${stamp}.md`, 'text/markdown', files.report_md);
      toast.success('Benchmark gerado — 3 arquivos baixados.');
    } catch (e) {
      toast.error('Falha no benchmark: ' + ((e as Error).message ?? 'erro'));
    } finally { setBenchLoading(false); }
  };

  // ----- diagnostic actions -----
  const runDiagnostic = async () => {
    setDiagRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', { body: { action: 'run' } });
      if (error) throw error;
      const r = data as { total_findings: number; total_chapters: number; duration_ms: number; status: string };
      toast.success(`Diagnóstico ${r.status} · ${r.total_findings} findings · ${r.total_chapters} capítulos em ${r.duration_ms}ms`);
      loadDiagRuns();
    } catch (e) {
      toast.error('Falha no diagnóstico: ' + ((e as Error).message ?? 'erro'));
    } finally { setDiagRunning(false); }
  };

  const exportDiagnostic = async (runId: string, format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', { body: { action: 'export', run_id: runId, format } });
      if (error) throw error;
      const stamp = runId.slice(0, 8);
      if (format === 'csv') {
        const files = (data as { files?: { findings_csv: string; summary_csv: string } }).files;
        if (!files) throw new Error('sem arquivos');
        downloadFile(`bible_diagnostic_findings_${stamp}.csv`, 'text/csv', files.findings_csv);
        downloadFile(`bible_diagnostic_summary_${stamp}.csv`, 'text/csv', files.summary_csv);
      } else {
        downloadFile(`bible_diagnostic_${stamp}.json`, 'application/json', JSON.stringify(data, null, 2));
      }
      toast.success(`Exportado (${format.toUpperCase()})`);
    } catch (e) {
      toast.error('Falha ao exportar: ' + ((e as Error).message ?? 'erro'));
    }
  };

  // ----- access denied screen -----
  if (errorCode === 'not_admin') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-display text-lg">Acesso restrito a administradores</AlertTitle>
          <AlertDescription className="mt-3 space-y-3">
            <p>Este painel expõe métricas operacionais sensíveis (correlation_id, latências por janela, distribuição L1). Apenas usuários com role <code className="px-1 py-0.5 rounded bg-muted">admin</code> podem acessá-lo.</p>
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" variant="default">
                <a href="mailto:admin@cathedradigital.com.br?subject=Solicitação de acesso admin — Bible Cache Dashboard">
                  <Mail className="mr-2 h-4 w-4" /> Solicitar acesso
                </a>
              </Button>
              <Button onClick={load} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" /> Verificar novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-secondary" /> Bible Cache — Séries Temporais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            cache_hit_rate, latência de Edge e distribuição L1 fresh/stale/miss/bypass por janela. Clique em qualquer ponto para drilldown.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runBenchmark} variant="default" size="sm" disabled={benchLoading}>
            <Download className={`mr-2 h-4 w-4 ${benchLoading ? 'animate-pulse' : ''}`} />
            {benchLoading ? 'Gerando...' : 'Gerar benchmark (CSV+MD)'}
          </Button>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Controles</CardTitle>
          <CardDescription className="text-xs">Janela de agregação, período histórico e filtro por livro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Janela</Label>
              <Select value={windowMinutes} onValueChange={setWindowMinutes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WINDOW_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <Select value={sinceHours} onValueChange={setSinceHours}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SINCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Livro (abbrev)</Label>
              <Input value={abbrev} onChange={(e) => setAbbrev(e.target.value)} placeholder="ex: Gn (vazio = todos)" maxLength={8} />
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={loading} className="w-full">{loading ? 'Carregando...' : 'Aplicar'}</Button>
            </div>
          </div>
          {error && error !== 'forbidden' && <p className="text-xs text-destructive mt-3">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Requisições (n)', value: totals.total.toLocaleString('pt-BR') },
          { label: 'Cache hit rate', value: `${totals.hitRate}%` },
          { label: 'Invalidação (MISS)', value: `${totals.invalidationRate}%` },
          {
            label: 'L1 fresh / stale / miss',
            value: `${totals.l1_fresh} / ${totals.l1_stale} / ${totals.l1_miss}`,
            extra: totals.staleLowConfidence
              ? <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">stale n&lt;{STALE_LOW_CONFIDENCE_THRESHOLD} · baixa confiança</Badge>
              : null,
          },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-lg border bg-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
            {('extra' in s) ? s.extra : null}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cache hit rate (%) por janela</CardTitle>
          <CardDescription className="text-xs">Clique em um ponto para abrir o drilldown da bucket</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={agg} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
              <defs>
                <linearGradient id="hitRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
              <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string, item: { payload?: { total?: number } }) => {
                  const n = item.payload?.total ?? 0;
                  return [`${value}% (n=${n})`, name];
                }}
              />
              <Area type="monotone" dataKey="cache_hit_rate_pct" name="Hit rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#hitRate)" />
              <Area type="monotone" dataKey="invalidation_pct" name="Invalidação" stroke="hsl(var(--destructive))" strokeWidth={1.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Latência de Edge (ms) — avg, p50, p95</CardTitle>
          <CardDescription className="text-xs">Clique em um ponto para drilldown</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={agg} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
              <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string, item: { payload?: { total?: number } }) => {
                  const n = item.payload?.total ?? 0;
                  return [`${Math.round(value)}ms (n=${n})`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="edge_avg_ms" name="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="edge_p50_ms" name="p50" stroke="hsl(var(--secondary))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="edge_p95_ms" name="p95" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Segmentação L1 por janela</CardTitle>
          <CardDescription className="text-xs">fresh • stale • miss • bypass — clique numa barra para drilldown</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agg} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
              <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="l1_fresh" name="fresh" stackId="l1" fill="hsl(142 70% 45%)" />
              <Bar dataKey="l1_stale" name="stale" stackId="l1" fill="hsl(38 92% 50%)" />
              <Bar dataKey="l1_miss" name="miss" stackId="l1" fill="hsl(0 75% 55%)" />
              <Bar dataKey="l1_bypass" name="bypass" stackId="l1" fill="hsl(220 10% 55%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {agg.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">Sem dados na janela selecionada.</p>
      )}

      {/* ===== Diagnóstico read-only dos 73 livros ===== */}
      <Card className="border-secondary/30">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-secondary" /> Diagnóstico do cânon (73 livros)
            </CardTitle>
            <CardDescription className="text-xs">
              Valida existência, contagem de capítulos, capítulos vazios, idioma e metadata. Roda diariamente via cron e sob demanda.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="default" onClick={runDiagnostic} disabled={diagRunning}>
              <PlayCircle className={`mr-2 h-4 w-4 ${diagRunning ? 'animate-pulse' : ''}`} />
              {diagRunning ? 'Executando...' : 'Rodar agora'}
            </Button>
            <Button size="sm" variant="outline" onClick={loadDiagRuns} disabled={diagLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${diagLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {diagRuns.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma execução registrada. Clique em "Rodar agora".</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Início</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Origem</TableHead>
                  <TableHead className="text-right text-xs">Livros</TableHead>
                  <TableHead className="text-right text-xs">Capítulos</TableHead>
                  <TableHead className="text-right text-xs">Findings</TableHead>
                  <TableHead className="text-right text-xs">Duração</TableHead>
                  <TableHead className="text-right text-xs">Exportar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagRuns.map(r => {
                  const cls = r.status === 'ok' ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : r.status === 'warning' ? 'border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : r.status === 'error' ? 'border-rose-500/40 text-rose-700 dark:text-rose-300'
                    : 'border-muted text-muted-foreground';
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-[10px] whitespace-nowrap">{new Date(r.started_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${cls}`}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{r.triggered_by}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{r.total_books_checked}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{r.total_chapters_checked}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-semibold">{r.total_findings}</TableCell>
                      <TableCell className="text-right tabular-nums text-[10px] text-muted-foreground">{r.duration_ms ?? '—'}ms</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => exportDiagnostic(r.id, 'csv')} title="Exportar CSV">
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => exportDiagnostic(r.id, 'json')} title="Exportar JSON">
                            <FileJson className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drilldown dialog */}
      <Dialog open={drillOpen} onOpenChange={setDrillOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{drillTitle}</DialogTitle>
            <DialogDescription className="text-xs">
              {filteredDrill.length} de {drillRows.length} requests. Filtre por origem/instância/cold start e ordene por qualquer métrica.
            </DialogDescription>
          </DialogHeader>

          {/* Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pb-2 border-b">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Origem</Label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {drillSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Instância</Label>
              <Select value={filterInstance} onValueChange={setFilterInstance}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {drillInstances.map(i => <SelectItem key={i} value={i}>{i.slice(0, 12)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Cold start</Label>
              <Select value={filterCold} onValueChange={setFilterCold}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Apenas cold</SelectItem>
                  <SelectItem value="false">Apenas warm</SelectItem>
                  <SelectItem value="compare">Comparar cold vs warm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Ordenar por</Label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_ms">total_ms</SelectItem>
                  <SelectItem value="sql_ms">sql_ms</SelectItem>
                  <SelectItem value="edge_ms">edge_ms</SelectItem>
                  <SelectItem value="total_wall_clock_ms">wall_clock_ms</SelectItem>
                  <SelectItem value="created_at">created_at</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Direção</Label>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as 'asc' | 'desc')}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓ desc</SelectItem>
                  <SelectItem value="asc">↑ asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {coldCompare && (
            <div className="grid grid-cols-2 gap-3 py-2">
              {(['cold', 'warm'] as const).map(k => {
                const s = coldCompare[k];
                const cls = k === 'cold' ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/5';
                return (
                  <div key={k} className={`p-3 rounded-lg border ${cls}`}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k} starts (n={s.n})</div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div><span className="text-muted-foreground">avg</span><div className="font-bold tabular-nums">{s.avg}ms</div></div>
                      <div><span className="text-muted-foreground">p95</span><div className="font-bold tabular-nums">{s.p95}ms</div></div>
                      <div><span className="text-muted-foreground">max</span><div className="font-bold tabular-nums">{s.max}ms</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-auto flex-1 -mx-6 px-6">
            {drillLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
            ) : filteredDrill.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem requests para o filtro atual.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Hora</TableHead>
                    <TableHead className="text-xs">Livro / cap</TableHead>
                    <TableHead className="text-xs">Cache</TableHead>
                    <TableHead className="text-xs">Nível</TableHead>
                    <TableHead className="text-xs">L1 phase</TableHead>
                    <TableHead className="text-xs">Cold</TableHead>
                    <TableHead className="text-xs">Origem</TableHead>
                    <TableHead className="text-right text-xs">total</TableHead>
                    <TableHead className="text-right text-xs">wall</TableHead>
                    <TableHead className="text-right text-xs">edge</TableHead>
                    <TableHead className="text-right text-xs">sql</TableHead>
                    <TableHead className="text-right text-xs">bolls</TableHead>
                    <TableHead className="text-xs">instance / corr_id</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrill.map((r, i) => {
                    const levelCls =
                      r.cache_level === 'L1' ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' :
                      r.cache_level === 'L2' ? 'border-sky-500/40 text-sky-700 dark:text-sky-300' :
                      r.cache_level === 'DB' ? 'border-amber-500/40 text-amber-700 dark:text-amber-300' :
                      r.cache_level === 'UNAVAILABLE' ? 'border-rose-500/40 text-rose-700 dark:text-rose-300' :
                      'border-muted text-muted-foreground';
                    const breakdownTitle = (r.sql_breakdown ?? [])
                      .map(b => `${b.label}: ${b.ms}ms`).join('\n') || 'sem breakdown';
                    return (
                      <TableRow key={`${r.correlation_id ?? i}-${r.created_at}`}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleTimeString('pt-BR')}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{r.abbrev} {r.chapter ?? ''}</TableCell>
                        <TableCell className="text-xs">{r.cache ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${levelCls}`}>
                            {r.cache_level ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${l1PhaseColor(r.l1_phase)}`}>
                            {r.l1_phase ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.cold_start ? <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">cold</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-[10px] font-mono text-muted-foreground">{r.request_source ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs font-semibold">{r.total_ms ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-[10px] text-muted-foreground">{r.total_wall_clock_ms ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{r.edge_ms ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs cursor-help" title={breakdownTitle}>{r.sql_ms ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{r.bolls_ms ?? '—'}</TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[200px] truncate" title={`instance: ${r.instance_id ?? '—'}\ncorr: ${r.correlation_id ?? '—'}`}>
                          {r.instance_id ? r.instance_id.slice(0, 8) : '—'} / {r.correlation_id ? r.correlation_id.slice(0, 8) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BibleCacheBenchmarkCompare />
    </div>
  );
}
