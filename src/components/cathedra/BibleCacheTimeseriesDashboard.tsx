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
import { RefreshCw, Activity, ShieldAlert, Download, Mail } from 'lucide-react';
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

  const [benchLoading, setBenchLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError(null); setErrorCode(null);
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: { action: 'series', window_minutes: Number(windowMinutes), since_hours: Number(sinceHours), abbrev: abbrev.trim() || null },
      });
      if (error) {
        // edge runtime devolve FunctionsHttpError com status + context; tentamos extrair
        const ctx = (error as { context?: { status?: number; json?: () => Promise<{ code?: string }> } }).context;
        if (ctx?.status === 403) { setErrorCode('not_admin'); setError('forbidden'); return; }
        throw error;
      }
      setRows(((data as { rows?: TimeseriesRow[] })?.rows) ?? []);
    } catch (e) {
      setError((e as Error).message ?? 'Erro ao carregar métricas'); setRows([]);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

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

  const openDrilldown = async (bucketStart: string, displayTime: string) => {
    setDrillOpen(true); setDrillLoading(true); setDrillRows([]);
    setDrillTitle(`Top requests mais lentos · ${displayTime}`);
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: { action: 'drilldown', bucket_start: bucketStart, window_minutes: Number(windowMinutes), abbrev: abbrev.trim() || null, limit: 20 },
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
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: { action: 'benchmark', since_days: 7 },
      });
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

  // ----- access denied screen -----
  if (errorCode === 'not_admin') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-display text-lg">Acesso restrito a administradores</AlertTitle>
          <AlertDescription className="mt-3 space-y-3">
            <p>Este painel expõe métricas operacionais sensíveis (correlation_id, latências por janela, distribuição L1). Apenas usuários com role <code className="px-1 py-0.5 rounded bg-muted">admin</code> podem acessá-lo.</p>
            <div className="space-y-2 pt-2">
              <p className="font-semibold text-sm">Como solicitar acesso:</p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                <li>Envie um e-mail para <a className="text-primary underline" href="mailto:admin@cathedradigital.com.br?subject=Solicitação de acesso admin — Bible Cache Dashboard">admin@cathedradigital.com.br</a> com o motivo da solicitação.</li>
                <li>Inclua seu e-mail de login para que o admin localize seu user_id.</li>
                <li>Após a aprovação, o role admin será atribuído e este painel ficará disponível sem novo login.</li>
              </ol>
            </div>
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

      {/* Drilldown dialog */}
      <Dialog open={drillOpen} onOpenChange={setDrillOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{drillTitle}</DialogTitle>
            <DialogDescription className="text-xs">
              Top {drillRows.length} requests mais lentos da janela selecionada, com correlation_id e l1_phase.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 -mx-6 px-6">
            {drillLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
            ) : drillRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem requests nesta janela.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Hora</TableHead>
                    <TableHead className="text-xs">Livro / cap</TableHead>
                    <TableHead className="text-xs">Cache</TableHead>
                    <TableHead className="text-xs">L1 phase</TableHead>
                    <TableHead className="text-right text-xs">total</TableHead>
                    <TableHead className="text-right text-xs">edge</TableHead>
                    <TableHead className="text-right text-xs">sql</TableHead>
                    <TableHead className="text-right text-xs">bolls</TableHead>
                    <TableHead className="text-xs">correlation_id</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillRows.map((r, i) => (
                    <TableRow key={`${r.correlation_id ?? i}-${r.created_at}`}>
                      <TableCell className="font-mono text-xs">{new Date(r.created_at).toLocaleTimeString('pt-BR')}</TableCell>
                      <TableCell className="text-xs">{r.abbrev} {r.chapter ?? ''}</TableCell>
                      <TableCell className="text-xs">{r.cache ?? '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${l1PhaseColor(r.l1_phase)}`}>
                          {r.l1_phase ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-semibold">{r.total_ms ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{r.edge_ms ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{r.sql_ms ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{r.bolls_ms ?? '—'}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[180px] truncate" title={r.correlation_id ?? ''}>
                        {r.correlation_id ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
