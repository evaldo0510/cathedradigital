import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight,
  CheckCircle2, Download, Flame, Loader2, RefreshCcw, Trash2, Wifi, WifiOff,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line,
  CartesianGrid, Legend,
} from 'recharts';

type ListRow = { cache_key: string; version: number; expires_at: string | null; created_at: string | null; fresh: boolean; age_s: number; hash: string | null };
type SummaryBook = { abbrev: string; hits: number; misses: number; stale: number; total: number; sum_ms: number; max_p95: number; bolls_calls: number; bolls_failures: number; hit_rate: number; avg_ms: number; bolls_rate: number };
type Summary = { global: { hits: number; misses: number; stale: number; total: number; hit_rate: number; avg_ms: number; p95_ms: number; bolls_calls: number; bolls_failures: number; bolls_rate: number }; books: SummaryBook[] };
type AlertRow = { id: string; created_at: string; severity: 'info' | 'warning' | 'critical'; kind: string; message: string; details: Record<string, unknown>; bucket_start: string | null; abbrev: string | null; resolved_at: string | null };
type MetricRow = { bucket_start: string; abbrev: string; hits: number; misses: number; stale: number; total: number; sum_ms: number; p95_ms: number; bolls_calls: number; bolls_failures: number };
type AuditRow = { id: number; created_at: string; actor_email: string | null; action: string; target: string | null; abbrev: string | null; chapter_from: number | null; chapter_to: number | null; count: number | null; succeeded: number | null; failed: number | null; details: Record<string, unknown> };
type ChapterRow = { chapter: number; total: number; hits: number; misses: number; stale: number; avg_ms: number; p95_ms: number; max_ms: number; bolls_calls: number; bolls_failures: number };
type CompareBook = { abbrev: string; hits: number; misses: number; stale: number; total: number; sum_ms: number; max_p95: number; bolls_calls: number; bolls_failures: number; hit_rate: number; avg_ms: number; bolls_rate: number };
type CompareWindow = { since: string; until: string; global: { hits: number; misses: number; stale: number; total: number; hit_rate: number; avg_ms: number; p95_ms: number; bolls_calls: number; bolls_failures: number; bolls_rate: number }; books: CompareBook[] };
type CompareChapter = { chapter: number; hits: number; misses: number; stale: number; total: number; avg_ms: number; p95_ms: number; bolls_calls: number; bolls_failures: number; hit_rate: number; bolls_rate: number };
type CompareResponse = { a: CompareWindow; b: CompareWindow; abbrev: string | null; chapters: { a: CompareChapter[]; b: CompareChapter[] } | null };

const POLL_FAST = 10_000;
const POLL_SLOW = 30_000;

async function call(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('bible-cache-admin', { body: { action, ...payload } });
  if (error) throw new Error(error.message);
  return data;
}

export default function BibleCacheAdminPage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const qc = useQueryClient();

  // ----- Filtros globais -----
  const [hours, setHours] = useState(24);
  const [bookFilter, setBookFilter] = useState<string>('__all__');
  const [bookSort, setBookSort] = useState<keyof SummaryBook>('total');
  const [bookSortDir, setBookSortDir] = useState<'asc' | 'desc'>('desc');
  const [live, setLive] = useState(true);
  const [realtimeOk, setRealtimeOk] = useState(false);

  // ----- Filtros da aba Entradas -----
  const [prefix, setPrefix] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'fresh' | 'stale'>('all');
  const [listSort, setListSort] = useState<'created_at' | 'expires_at' | 'cache_key' | 'version'>('created_at');
  const [listDir, setListDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // ----- Operações em lote -----
  const [warmInput, setWarmInput] = useState('Sl:1, Mt:1, Jo:1');
  const [bulkAbbrev, setBulkAbbrev] = useState('Sl');
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(50);

  // ----- Drilldown -----
  const [drillBook, setDrillBook] = useState<string | null>(null);

  // ----- Auditoria -----
  const [auditFilter, setAuditFilter] = useState<string>('__all__');
  const [auditPage, setAuditPage] = useState(0);

  // ----- Comparação -----
  const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const isoOffset = (h: number) => new Date(Date.now() - h * 3600 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [cmpASince, setCmpASince] = useState(isoOffset(48));
  const [cmpAUntil, setCmpAUntil] = useState(isoOffset(24));
  const [cmpBSince, setCmpBSince] = useState(isoOffset(24));
  const [cmpBUntil, setCmpBUntil] = useState(nowLocal());
  const [cmpAbbrev, setCmpAbbrev] = useState<string>('__none__');
  const [cmpRun, setCmpRun] = useState(0);
  const compare = useQuery<CompareResponse>({
    queryKey: ['bcs-compare', cmpRun],
    enabled: false,
    queryFn: () => call('compare', {
      a: { since: new Date(cmpASince).toISOString(), until: new Date(cmpAUntil).toISOString() },
      b: { since: new Date(cmpBSince).toISOString(), until: new Date(cmpBUntil).toISOString() },
      ...(cmpAbbrev !== '__none__' ? { abbrev: cmpAbbrev } : {}),
    }),
  });

  const stats = useQuery({ queryKey: ['bcs-stats'], enabled: isAdmin, queryFn: () => call('stats'), refetchInterval: live ? POLL_FAST : false });
  const summary = useQuery<Summary>({ queryKey: ['bcs-summary', hours], enabled: isAdmin, queryFn: () => call('metrics_summary', { hours }), refetchInterval: live ? POLL_SLOW : false });
  const metrics = useQuery<{ rows: MetricRow[] }>({ queryKey: ['bcs-metrics', hours, bookFilter], enabled: isAdmin, queryFn: () => call('metrics', { hours, ...(bookFilter !== '__all__' ? { abbrev: bookFilter } : {}) }), refetchInterval: live ? POLL_SLOW : false });
  const alerts = useQuery<{ rows: AlertRow[] }>({ queryKey: ['bcs-alerts'], enabled: isAdmin, queryFn: () => call('alerts', { only_open: true }), refetchInterval: live ? POLL_FAST : false });
  const list = useQuery<{ rows: ListRow[]; total: number | null }>({
    queryKey: ['bcs-list', prefix, statusFilter, listSort, listDir, page],
    enabled: isAdmin,
    queryFn: () => call('list', { limit: pageSize, offset: page * pageSize, prefix: prefix || undefined, status: statusFilter, sort: listSort, dir: listDir }),
  });
  const auditQ = useQuery<{ rows: AuditRow[]; total: number | null }>({
    queryKey: ['bcs-audit', auditFilter, auditPage],
    enabled: isAdmin,
    queryFn: () => call('audit', { limit: 50, offset: auditPage * 50, ...(auditFilter !== '__all__' ? { action_filter: auditFilter } : {}) }),
    refetchInterval: live ? POLL_SLOW : false,
  });
  const drilldown = useQuery<{ rows: ChapterRow[] }>({
    queryKey: ['bcs-chapter', drillBook, hours],
    enabled: isAdmin && !!drillBook,
    queryFn: () => call('chapter_drilldown', { abbrev: drillBook, hours }),
  });

  // ----- Realtime: assinatura de bible_cache_alerts -----
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('bible_cache_alerts_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bible_cache_alerts' }, (payload) => {
        qc.invalidateQueries({ queryKey: ['bcs-alerts'] });
        if (payload.eventType === 'INSERT') {
          const a = payload.new as AlertRow;
          toast.warning(`Novo alerta: ${a.message}`);
        }
      })
      .subscribe((status) => setRealtimeOk(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, qc]);

  const invalidateOps = () => {
    qc.invalidateQueries({ queryKey: ['bcs-stats'] });
    qc.invalidateQueries({ queryKey: ['bcs-summary'] });
    qc.invalidateQueries({ queryKey: ['bcs-list'] });
    qc.invalidateQueries({ queryKey: ['bcs-audit'] });
    if (drillBook) qc.invalidateQueries({ queryKey: ['bcs-chapter', drillBook, hours] });
  };

  const purge = useMutation({
    mutationFn: (vars: { cache_key?: string; prefix?: string }) => call('purge', vars),
    onSuccess: () => { toast.success('Cache purgado'); invalidateOps(); },
    onError: (e: any) => toast.error(e?.message || 'Falha ao purgar'),
  });
  const warm = useMutation({
    mutationFn: (items: { abbrev: string; chapter: number }[]) => call('warm', { items }),
    onSuccess: (r: any) => { toast.success(`Warm: ${r?.succeeded ?? 0}/${r?.total ?? 0}`); invalidateOps(); },
    onError: (e: any) => toast.error(e?.message || 'Falha no warm'),
  });
  const bulk = useMutation({
    mutationFn: (vars: { abbrev: string; chapter_from: number; chapter_to: number; op: 'warm' | 'purge' }) => call('bulk_range', vars),
    onSuccess: (r: any) => {
      if (r?.op === 'purge') toast.success(`Purgados ${r?.purged_count ?? 0} capítulos`);
      else toast.success(`Warm em lote: ${r?.succeeded ?? 0}/${r?.total ?? 0}`);
      invalidateOps();
    },
    onError: (e: any) => toast.error(e?.message || 'Falha no bulk'),
  });
  const resolveAlert = useMutation({
    mutationFn: (id: string) => call('resolve_alert', { id }),
    onSuccess: () => { toast.success('Alerta resolvido'); qc.invalidateQueries({ queryKey: ['bcs-alerts'] }); qc.invalidateQueries({ queryKey: ['bcs-audit'] }); },
    onError: (e: any) => toast.error(e?.message || 'Falha ao resolver'),
  });
  const runAggregator = useMutation({
    mutationFn: () => call('run_aggregator'),
    onSuccess: () => { toast.success('Agregação disparada'); invalidateOps(); qc.invalidateQueries({ queryKey: ['bcs-alerts'] }); },
    onError: (e: any) => toast.error(e?.message || 'Falha ao agregar'),
  });

  const series = useMemo(() => {
    const rows = metrics.data?.rows ?? [];
    const byBucket = new Map<string, { ts: string; hits: number; misses: number; stale: number; bolls_calls: number; total: number; p95_max: number; sum_ms: number }>();
    for (const r of rows) {
      const slot = byBucket.get(r.bucket_start) || { ts: r.bucket_start, hits: 0, misses: 0, stale: 0, bolls_calls: 0, total: 0, p95_max: 0, sum_ms: 0 };
      slot.hits += r.hits; slot.misses += r.misses; slot.stale += r.stale; slot.bolls_calls += r.bolls_calls;
      slot.total += r.total; slot.sum_ms += Number(r.sum_ms ?? 0);
      slot.p95_max = Math.max(slot.p95_max, r.p95_ms);
      byBucket.set(r.bucket_start, slot);
    }
    return [...byBucket.values()]
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .map((s) => ({
        ts: new Date(s.ts).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit' }),
        Hit: s.hits, Miss: s.misses, Stale: s.stale,
        'Bolls calls': s.bolls_calls,
        'p95 (ms)': s.p95_max,
        'avg (ms)': s.total ? Math.round(s.sum_ms / s.total) : 0,
      }));
  }, [metrics.data]);

  const sortedBooks = useMemo(() => {
    const arr = [...(summary.data?.books ?? [])];
    const dir = bookSortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = a[bookSort] as number ?? 0; const bv = b[bookSort] as number ?? 0;
      return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
    });
    return arr;
  }, [summary.data, bookSort, bookSortDir]);

  const downloadExport = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-admin', { body: { action: 'export', format, hours } });
      if (error) throw error;
      const blob = format === 'json'
        ? new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        : new Blob([typeof data === 'string' ? data : ''], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bible-cache-metrics-${hours}h.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e?.message || 'Falha no export'); }
  };

  if (roleLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleWarm = () => {
    const items = warmInput.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const [a, c] = s.split(':').map((p) => p.trim());
      return { abbrev: a, chapter: Number(c) };
    }).filter((i) => i.abbrev && Number.isFinite(i.chapter));
    if (!items.length) { toast.error('Formato: "Sl:1, Mt:5, Jo:3"'); return; }
    warm.mutate(items);
  };

  const g = summary.data?.global;
  const allBookOptions = (summary.data?.books ?? []).map((b) => b.abbrev);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cache da Bíblia (L2)</h1>
          <p className="text-sm text-muted-foreground">Métricas, alertas, drilldown por capítulo e auditoria.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
            <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Última 1h</SelectItem>
              <SelectItem value="6">Últimas 6h</SelectItem>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="72">Últimos 3 dias</SelectItem>
              <SelectItem value="168">Últimos 7 dias</SelectItem>
              <SelectItem value="336">Últimos 14 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={bookFilter} onValueChange={setBookFilter}>
            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Livro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os livros</SelectItem>
              {allBookOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant={live ? 'default' : 'outline'} onClick={() => setLive((v) => !v)} title={live ? 'Live ON' : 'Live OFF'}>
            {live ? <Wifi className="mr-2 h-4 w-4" /> : <WifiOff className="mr-2 h-4 w-4" />}
            {live ? 'Live' : 'Pausado'}
            {live && realtimeOk && <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
          </Button>
          <Button size="sm" variant="outline" onClick={() => runAggregator.mutate()} disabled={runAggregator.isPending}>
            {runAggregator.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Agregar agora
          </Button>
        </div>
      </header>

      {(alerts.data?.rows?.length ?? 0) > 0 && (
        <Card className="space-y-2 border-amber-500/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">{alerts.data!.rows.length} alerta(s) aberto(s)</span>
          </div>
          <ul className="space-y-1.5">
            {alerts.data!.rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-500/20 bg-background/60 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase">{a.severity}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{a.kind}</span>
                  <span>{a.message}</span>
                </div>
                <div className="flex gap-1">
                  {a.abbrev && (
                    <Button size="sm" variant="ghost" onClick={() => setDrillBook(a.abbrev!)}>Drilldown</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => resolveAlert.mutate(a.id)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Resolver
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Kpi label="Cache total" value={stats.data?.total} />
        <Kpi label="Frescos" value={stats.data?.fresh} tone="ok" />
        <Kpi label="Stale" value={stats.data?.stale} tone="warn" />
        <Kpi label="Hit rate" value={g ? `${(g.hit_rate * 100).toFixed(1)}%` : '—'} tone="ok" />
        <Kpi label="p95 (ms)" value={g?.p95_ms ?? '—'} tone={g && g.p95_ms > 4000 ? 'warn' : 'default'} />
        <Kpi label="BollsLife rate" value={g ? `${(g.bolls_rate * 100).toFixed(1)}%` : '—'} tone={g && g.bolls_rate > 0.3 ? 'warn' : 'default'} />
      </div>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="books">Por livro</TabsTrigger>
          <TabsTrigger value="ops">Operações</TabsTrigger>
          <TabsTrigger value="entries">Entradas</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="compare">Comparar</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Hits / Miss / Stale {bookFilter !== '__all__' ? `· ${bookFilter}` : ''}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadExport('csv')}><Download className="mr-1 h-4 w-4" />CSV</Button>
                <Button size="sm" variant="outline" onClick={() => downloadExport('json')}><Download className="mr-1 h-4 w-4" />JSON</Button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="ts" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Hit" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="Stale" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Miss" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Latência (p95 vs médio)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="ts" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="p95 (ms)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="avg (ms)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Bolls calls" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="books">
          <Card className="overflow-auto p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ordenar por</span>
              <Select value={bookSort} onValueChange={(v) => setBookSort(v as keyof SummaryBook)}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="hits">Hits</SelectItem>
                  <SelectItem value="misses">Misses</SelectItem>
                  <SelectItem value="stale">Stale</SelectItem>
                  <SelectItem value="hit_rate">Hit rate</SelectItem>
                  <SelectItem value="avg_ms">avg (ms)</SelectItem>
                  <SelectItem value="max_p95">p95 (ms)</SelectItem>
                  <SelectItem value="bolls_rate">Bolls rate</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setBookSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>
                {bookSortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">Clique no livro para abrir o drilldown</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Livro</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Hit</th>
                  <th className="py-2 pr-3">Miss</th>
                  <th className="py-2 pr-3">Stale</th>
                  <th className="py-2 pr-3">Hit rate</th>
                  <th className="py-2 pr-3">avg (ms)</th>
                  <th className="py-2 pr-3">p95 (ms)</th>
                  <th className="py-2 pr-3">Bolls rate</th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((b) => (
                  <tr
                    key={b.abbrev}
                    className="cursor-pointer border-t border-border/40 hover:bg-muted/40"
                    onClick={() => setDrillBook(b.abbrev)}
                  >
                    <td className="py-2 pr-3 font-mono">{b.abbrev}</td>
                    <td className="py-2 pr-3">{b.total}</td>
                    <td className="py-2 pr-3">{b.hits}</td>
                    <td className="py-2 pr-3">{b.misses}</td>
                    <td className="py-2 pr-3">{b.stale}</td>
                    <td className="py-2 pr-3">{(b.hit_rate * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-3">{b.avg_ms}</td>
                    <td className={`py-2 pr-3 ${b.max_p95 > 4000 ? 'text-amber-600' : ''}`}>{b.max_p95}</td>
                    <td className={`py-2 pr-3 ${b.bolls_rate > 0.3 ? 'text-amber-600' : ''}`}>{(b.bolls_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                {sortedBooks.length === 0 && (
                  <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Sem dados na janela</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="ops" className="space-y-4">
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Reaquecer (lista livre)</h2>
            <p className="text-xs text-muted-foreground">Formato: <code className="rounded bg-muted px-1">Sl:1, Mt:5, Jo:3</code></p>
            <div className="flex gap-2">
              <Input value={warmInput} onChange={(e) => setWarmInput(e.target.value)} className="font-mono text-sm" />
              <Button onClick={handleWarm} disabled={warm.isPending}>
                {warm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
                Reaquecer
              </Button>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Operações em lote por intervalo</h2>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-muted-foreground">Livro (abbr)</label>
                <Input className="w-24" value={bulkAbbrev} onChange={(e) => setBulkAbbrev(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">De</label>
                <Input className="w-20" type="number" value={bulkFrom} onChange={(e) => setBulkFrom(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">Até</label>
                <Input className="w-20" type="number" value={bulkTo} onChange={(e) => setBulkTo(Number(e.target.value))} />
              </div>
              <Button onClick={() => bulk.mutate({ abbrev: bulkAbbrev, chapter_from: bulkFrom, chapter_to: bulkTo, op: 'warm' })} disabled={bulk.isPending}>
                <Flame className="mr-2 h-4 w-4" /> Reaquecer intervalo
              </Button>
              <Button variant="destructive" onClick={() => bulk.mutate({ abbrev: bulkAbbrev, chapter_from: bulkFrom, chapter_to: bulkTo, op: 'purge' })} disabled={bulk.isPending}>
                <Trash2 className="mr-2 h-4 w-4" /> Purgar intervalo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Limite: até 200 capítulos por chamada. Toda execução é registrada na aba Auditoria.</p>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">Entradas no cache</h2>
              <div className="ml-auto flex flex-wrap gap-2">
                <Input placeholder="Prefixo (ex.: Sl:)" value={prefix} onChange={(e) => { setPrefix(e.target.value); setPage(0); }} className="h-8 w-48 text-sm" />
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(0); }}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="fresh">Frescos</SelectItem>
                    <SelectItem value="stale">Stale</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={listSort} onValueChange={(v) => setListSort(v as any)}>
                  <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Criado em</SelectItem>
                    <SelectItem value="expires_at">Expira em</SelectItem>
                    <SelectItem value="cache_key">Chave</SelectItem>
                    <SelectItem value="version">Versão</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setListDir((d) => d === 'asc' ? 'desc' : 'asc')}>
                  {listDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => list.refetch()}><RefreshCcw className="h-4 w-4" /></Button>
                {prefix && <Button size="sm" variant="destructive" onClick={() => purge.mutate({ prefix })} disabled={purge.isPending}>Purgar prefixo</Button>}
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2 pr-3">Chave</th><th className="py-2 pr-3">v</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Idade</th><th className="py-2 pr-3">Expira</th><th className="py-2 pr-3" /></tr>
                </thead>
                <tbody>
                  {list.isLoading && <tr><td colSpan={6} className="py-6 text-center"><Loader2 className="inline h-4 w-4 animate-spin" /></td></tr>}
                  {!list.isLoading && (list.data?.rows ?? []).length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhuma entrada</td></tr>}
                  {(list.data?.rows ?? []).map((r) => (
                    <tr key={r.cache_key} className="border-t border-border/40">
                      <td className="py-2 pr-3 font-mono text-xs">{r.cache_key}</td>
                      <td className="py-2 pr-3">{r.version}</td>
                      <td className="py-2 pr-3"><Badge variant={r.fresh ? 'default' : 'secondary'}>{r.fresh ? 'fresh' : 'stale'}</Badge></td>
                      <td className="py-2 pr-3 text-muted-foreground">{formatAge(r.age_s)}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.expires_at ? new Date(r.expires_at).toLocaleString() : '—'}</td>
                      <td className="py-2 pr-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { const [a, c] = r.cache_key.split(':'); warm.mutate([{ abbrev: a, chapter: Number(c) }]); }}><Flame className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => purge.mutate({ cache_key: r.cache_key })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page} pageSize={pageSize} total={list.data?.total ?? null}
              loaded={list.data?.rows?.length ?? 0}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">Trilha de auditoria</h2>
              <Select value={auditFilter} onValueChange={(v) => { setAuditFilter(v); setAuditPage(0); }}>
                <SelectTrigger className="ml-auto h-8 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as ações</SelectItem>
                  <SelectItem value="purge">purge</SelectItem>
                  <SelectItem value="warm">warm</SelectItem>
                  <SelectItem value="bulk_range">bulk_range</SelectItem>
                  <SelectItem value="resolve_alert">resolve_alert</SelectItem>
                  <SelectItem value="run_aggregator">run_aggregator</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => auditQ.refetch()}><RefreshCcw className="h-4 w-4" /></Button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Usuário</th>
                    <th className="py-2 pr-3">Ação</th>
                    <th className="py-2 pr-3">Alvo</th>
                    <th className="py-2 pr-3">Intervalo</th>
                    <th className="py-2 pr-3">Qtd</th>
                    <th className="py-2 pr-3">Ok/Falha</th>
                  </tr>
                </thead>
                <tbody>
                  {auditQ.isLoading && <tr><td colSpan={7} className="py-6 text-center"><Loader2 className="inline h-4 w-4 animate-spin" /></td></tr>}
                  {!auditQ.isLoading && (auditQ.data?.rows ?? []).length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Sem registros</td></tr>}
                  {(auditQ.data?.rows ?? []).map((r) => (
                    <tr key={r.id} className="border-t border-border/40 align-top">
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-xs">{r.actor_email ?? '—'}</td>
                      <td className="py-2 pr-3"><Badge variant="outline" className="font-mono">{r.action}</Badge></td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.target ?? '—'}</td>
                      <td className="py-2 pr-3 text-xs">
                        {r.abbrev && (r.chapter_from != null && r.chapter_to != null) ? `${r.abbrev} ${r.chapter_from}–${r.chapter_to}` : '—'}
                      </td>
                      <td className="py-2 pr-3">{r.count ?? '—'}</td>
                      <td className="py-2 pr-3 text-xs">
                        {r.succeeded != null && (
                          <span>
                            <span className="text-emerald-600">{r.succeeded}</span>
                            {r.failed != null && <> / <span className="text-red-600">{r.failed}</span></>}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={auditPage} pageSize={50} total={auditQ.data?.total ?? null}
              loaded={auditQ.data?.rows?.length ?? 0}
              onPrev={() => setAuditPage((p) => Math.max(0, p - 1))}
              onNext={() => setAuditPage((p) => p + 1)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Comparar duas janelas</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded border border-border/40 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Janela A</div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] text-muted-foreground">Desde</label>
                    <Input type="datetime-local" value={cmpASince} onChange={(e) => setCmpASince(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] text-muted-foreground">Até</label>
                    <Input type="datetime-local" value={cmpAUntil} onChange={(e) => setCmpAUntil(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 rounded border border-border/40 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Janela B</div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] text-muted-foreground">Desde</label>
                    <Input type="datetime-local" value={cmpBSince} onChange={(e) => setCmpBSince(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] text-muted-foreground">Até</label>
                    <Input type="datetime-local" value={cmpBUntil} onChange={(e) => setCmpBUntil(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-[11px] text-muted-foreground">Drilldown por capítulo (opcional)</label>
                <Select value={cmpAbbrev} onValueChange={setCmpAbbrev}>
                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem drilldown</SelectItem>
                    {allBookOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => { setCmpRun((n) => n + 1); setTimeout(() => compare.refetch(), 0); }}
                disabled={compare.isFetching}
              >
                {compare.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Comparar
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Dica: janelas iguais → variação 0. Variação calculada como B − A.
              </span>
            </div>
          </Card>

          {compare.data && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <DeltaKpi label="Hit rate" a={compare.data.a.global.hit_rate} b={compare.data.b.global.hit_rate} fmt={(v) => `${(v * 100).toFixed(1)}%`} higherIsBetter />
                <DeltaKpi label="p95 (ms)" a={compare.data.a.global.p95_ms} b={compare.data.b.global.p95_ms} fmt={(v) => String(Math.round(v))} higherIsBetter={false} />
                <DeltaKpi label="BollsLife rate" a={compare.data.a.global.bolls_rate} b={compare.data.b.global.bolls_rate} fmt={(v) => `${(v * 100).toFixed(1)}%`} higherIsBetter={false} />
              </div>

              <Card className="overflow-auto p-4">
                <h3 className="mb-2 text-sm font-semibold">Variação por livro (B − A)</h3>
                <CompareBookTable a={compare.data.a.books} b={compare.data.b.books} />
              </Card>

              {compare.data.chapters && (
                <Card className="overflow-auto p-4">
                  <h3 className="mb-2 text-sm font-semibold">Variação por capítulo · {compare.data.abbrev}</h3>
                  <CompareChapterTable a={compare.data.chapters.a} b={compare.data.chapters.b} />
                </Card>
              )}
            </>
          )}
          {compare.error && (
            <Card className="border-red-500/40 bg-red-50/50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">
              {(compare.error as Error).message}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ----- Drilldown dialog ----- */}
      <Dialog open={!!drillBook} onOpenChange={(open) => { if (!open) setDrillBook(null); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Drilldown · {drillBook} <span className="text-xs font-normal text-muted-foreground">· últimas {hours}h</span></DialogTitle>
          </DialogHeader>
          {drilldown.isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {!drilldown.isLoading && (drilldown.data?.rows?.length ?? 0) === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Sem eventos para "{drillBook}" nesta janela.</div>
          )}
          {(drilldown.data?.rows?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={drilldown.data!.rows}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="chapter" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="p95_ms" fill="#ef4444" name="p95 (ms)" />
                    <Bar dataKey="avg_ms" fill="hsl(var(--primary))" name="avg (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Cap.</th>
                      <th className="py-2 pr-3">Chamadas</th>
                      <th className="py-2 pr-3">Hit</th>
                      <th className="py-2 pr-3">Miss</th>
                      <th className="py-2 pr-3">Stale</th>
                      <th className="py-2 pr-3">avg (ms)</th>
                      <th className="py-2 pr-3">p95 (ms)</th>
                      <th className="py-2 pr-3">max (ms)</th>
                      <th className="py-2 pr-3">Bolls calls</th>
                      <th className="py-2 pr-3">Bolls falhas</th>
                      <th className="py-2 pr-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {drilldown.data!.rows.map((r) => (
                      <tr key={r.chapter} className="border-t border-border/40">
                        <td className="py-2 pr-3 font-mono">{r.chapter}</td>
                        <td className="py-2 pr-3">{Number(r.total)}</td>
                        <td className="py-2 pr-3">{Number(r.hits)}</td>
                        <td className="py-2 pr-3">{Number(r.misses)}</td>
                        <td className="py-2 pr-3">{Number(r.stale)}</td>
                        <td className="py-2 pr-3">{Number(r.avg_ms)}</td>
                        <td className={`py-2 pr-3 ${r.p95_ms > 4000 ? 'text-amber-600' : ''}`}>{r.p95_ms}</td>
                        <td className="py-2 pr-3">{r.max_ms}</td>
                        <td className="py-2 pr-3">{Number(r.bolls_calls)}</td>
                        <td className={`py-2 pr-3 ${Number(r.bolls_failures) > 0 ? 'text-red-600' : ''}`}>{Number(r.bolls_failures)}</td>
                        <td className="py-2 pr-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => warm.mutate([{ abbrev: drillBook!, chapter: r.chapter }])}><Flame className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => purge.mutate({ cache_key: `${drillBook}:${r.chapter}` })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, value, tone = 'default' }: { label: string; value: any; tone?: 'default' | 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : '';
  return (
    <Card className="p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value ?? '—'}</div>
    </Card>
  );
}

function Pagination({ page, pageSize, total, loaded, onPrev, onNext }: { page: number; pageSize: number; total: number | null; loaded: number; onPrev: () => void; onNext: () => void }) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = page * pageSize + loaded;
  const hasNext = total != null ? to < total : loaded === pageSize;
  return (
    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
      <span>{total != null ? `${from}–${to} de ${total}` : `Página ${page + 1}`}</span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" disabled={!hasNext} onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function formatAge(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}
