import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Download, Flame, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';

type ListRow = { cache_key: string; version: number; expires_at: string | null; created_at: string | null; fresh: boolean; age_s: number; hash: string | null };
type SummaryBook = { abbrev: string; hits: number; misses: number; stale: number; total: number; sum_ms: number; max_p95: number; bolls_calls: number; bolls_failures: number; hit_rate: number; avg_ms: number; bolls_rate: number };
type Summary = { global: { hits: number; misses: number; stale: number; total: number; hit_rate: number; avg_ms: number; p95_ms: number; bolls_calls: number; bolls_failures: number; bolls_rate: number }; books: SummaryBook[]; hours: number };
type AlertRow = { id: string; created_at: string; severity: 'info' | 'warning' | 'critical'; kind: string; message: string; details: Record<string, unknown>; bucket_start: string | null; abbrev: string | null; resolved_at: string | null };
type MetricRow = { bucket_start: string; abbrev: string; hits: number; misses: number; stale: number; total: number; sum_ms: number; p95_ms: number; bolls_calls: number; bolls_failures: number };

async function call(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('bible-cache-admin', { body: { action, ...payload } });
  if (error) throw new Error(error.message);
  return data;
}

export default function BibleCacheAdminPage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [hours, setHours] = useState(24);
  const [prefix, setPrefix] = useState('');
  const [warmInput, setWarmInput] = useState('Sl:1, Mt:1, Jo:1');
  const [bulkAbbrev, setBulkAbbrev] = useState('Sl');
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(50);

  const stats = useQuery({ queryKey: ['bible-cache-stats'], enabled: isAdmin, queryFn: () => call('stats'), refetchInterval: 30_000 });
  const summary = useQuery<Summary>({ queryKey: ['bible-cache-summary', hours], enabled: isAdmin, queryFn: () => call('metrics_summary', { hours }), refetchInterval: 60_000 });
  const metrics = useQuery<{ rows: MetricRow[] }>({ queryKey: ['bible-cache-metrics', hours], enabled: isAdmin, queryFn: () => call('metrics', { hours }), refetchInterval: 60_000 });
  const alerts = useQuery<{ rows: AlertRow[] }>({ queryKey: ['bible-cache-alerts'], enabled: isAdmin, queryFn: () => call('alerts', { only_open: true }), refetchInterval: 30_000 });
  const list = useQuery<{ rows: ListRow[] }>({ queryKey: ['bible-cache-list', prefix], enabled: isAdmin, queryFn: () => call('list', { limit: 200, prefix: prefix || undefined }) });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['bible-cache-stats'] });
    qc.invalidateQueries({ queryKey: ['bible-cache-summary'] });
    qc.invalidateQueries({ queryKey: ['bible-cache-metrics'] });
    qc.invalidateQueries({ queryKey: ['bible-cache-list'] });
  };

  const purge = useMutation({
    mutationFn: (vars: { cache_key?: string; prefix?: string }) => call('purge', vars),
    onSuccess: () => { toast.success('Cache purgado'); invalidateAll(); },
    onError: (e: any) => toast.error(e?.message || 'Falha ao purgar'),
  });
  const warm = useMutation({
    mutationFn: (items: { abbrev: string; chapter: number }[]) => call('warm', { items }),
    onSuccess: (r: any) => { toast.success(`Warm: ${r?.succeeded ?? 0}/${r?.total ?? 0}`); invalidateAll(); },
    onError: (e: any) => toast.error(e?.message || 'Falha no warm'),
  });
  const bulk = useMutation({
    mutationFn: (vars: { abbrev: string; chapter_from: number; chapter_to: number; op: 'warm' | 'purge' }) => call('bulk_range', vars),
    onSuccess: (r: any) => {
      if (r?.op === 'purge') toast.success(`Purgados ${r?.purged_count ?? 0} capítulos`);
      else toast.success(`Warm em lote: ${r?.succeeded ?? 0}/${r?.total ?? 0}`);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e?.message || 'Falha no bulk'),
  });
  const resolveAlert = useMutation({
    mutationFn: (id: string) => call('resolve_alert', { id }),
    onSuccess: () => { toast.success('Alerta resolvido'); qc.invalidateQueries({ queryKey: ['bible-cache-alerts'] }); },
    onError: (e: any) => toast.error(e?.message || 'Falha ao resolver'),
  });
  const runAggregator = useMutation({
    mutationFn: () => call('run_aggregator'),
    onSuccess: () => { toast.success('Agregação disparada'); invalidateAll(); qc.invalidateQueries({ queryKey: ['bible-cache-alerts'] }); },
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

  const downloadExport = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-admin', {
        body: { action: 'export', format, hours },
      });
      if (error) throw error;
      const blob = format === 'json' ? new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }) : new Blob([typeof data === 'string' ? data : ''], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bible-cache-metrics-${hours}h.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e?.message || 'Falha no export'); }
  };

  if (roleLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleWarm = () => {
    const items = warmInput.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [a, c] = s.split(':').map((p) => p.trim()); return { abbrev: a, chapter: Number(c) }; }).filter((i) => i.abbrev && Number.isFinite(i.chapter));
    if (!items.length) { toast.error('Formato: "Sl:1, Mt:5, Jo:3"'); return; }
    warm.mutate(items);
  };

  const g = summary.data?.global;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cache da Bíblia (L2)</h1>
          <p className="text-sm text-muted-foreground">Métricas, alertas, entradas e operações em lote.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Última 1h</SelectItem>
              <SelectItem value="6">Últimas 6h</SelectItem>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="72">Últimos 3d</SelectItem>
              <SelectItem value="168">Últimos 7d</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => runAggregator.mutate()} disabled={runAggregator.isPending}>
            {runAggregator.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Agregar agora
          </Button>
        </div>
      </header>

      {/* Alertas abertos */}
      {(alerts.data?.rows?.length ?? 0) > 0 && (
        <Card className="space-y-2 border-amber-500/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">{alerts.data!.rows.length} alerta(s) aberto(s)</span>
          </div>
          <ul className="space-y-1.5">
            {alerts.data!.rows.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded border border-amber-500/20 bg-background/60 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase">{a.severity}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{a.kind}</span>
                  <span>{a.message}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => resolveAlert.mutate(a.id)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Resolver
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* KPIs */}
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
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Hits / Miss / Stale (por hora)</h2>
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
                {(summary.data?.books ?? []).map((b) => (
                  <tr key={b.abbrev} className="border-t border-border/40">
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
                {(summary.data?.books?.length ?? 0) === 0 && (
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
            <p className="text-xs text-muted-foreground">Limite: até 200 capítulos por chamada. Warm chama BollsLife sequencialmente.</p>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Entradas no cache</h2>
              <div className="flex gap-2">
                <Input placeholder="Filtrar por prefixo (ex.: Sl:)" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="h-8 w-64 text-sm" />
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
          </Card>
        </TabsContent>
      </Tabs>
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

function formatAge(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}
