import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Activity } from 'lucide-react';

interface TimeseriesRow {
  bucket_start: string;
  abbrev: string;
  total: number;
  hits: number;
  misses: number;
  stale: number;
  cache_hit_rate: number | null;
  invalidation_rate: number | null;
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

const WINDOW_OPTIONS = [
  { value: '1', label: '1 min' },
  { value: '5', label: '5 min' },
  { value: '15', label: '15 min' },
  { value: '60', label: '1 hora' },
  { value: '360', label: '6 horas' },
];

const SINCE_OPTIONS = [
  { value: '1', label: 'Última hora' },
  { value: '6', label: 'Últimas 6h' },
  { value: '24', label: 'Últimas 24h' },
  { value: '72', label: 'Últimos 3 dias' },
  { value: '168', label: 'Últimos 7 dias' },
];

function fmtTime(iso: string, windowMin: number): string {
  const d = new Date(iso);
  if (windowMin >= 60) {
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit' });
  }
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function BibleCacheTimeseriesDashboard() {
  const [windowMinutes, setWindowMinutes] = useState('5');
  const [sinceHours, setSinceHours] = useState('24');
  const [abbrev, setAbbrev] = useState('');
  const [rows, setRows] = useState<TimeseriesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: {
          window_minutes: Number(windowMinutes),
          since_hours: Number(sinceHours),
          abbrev: abbrev.trim() || null,
        },
      });
      if (error) throw error;
      setRows(((data as { rows?: TimeseriesRow[] })?.rows) ?? []);
    } catch (e) {
      setError((e as Error).message ?? 'Erro ao carregar métricas');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // Agrega por bucket somando livros (quando não filtrado, mostra a soma)
  const agg = useMemo(() => {
    const byBucket = new Map<string, TimeseriesRow & { _n: number }>();
    for (const r of rows) {
      const k = r.bucket_start;
      const acc = byBucket.get(k);
      if (!acc) {
        byBucket.set(k, { ...r, _n: 1 });
      } else {
        acc.total += r.total;
        acc.hits += r.hits;
        acc.misses += r.misses;
        acc.stale += r.stale;
        acc.l1_fresh += r.l1_fresh;
        acc.l1_stale += r.l1_stale;
        acc.l1_miss += r.l1_miss;
        acc.l1_bypass += r.l1_bypass;
        acc.edge_avg_ms = ((acc.edge_avg_ms ?? 0) * acc._n + (r.edge_avg_ms ?? 0)) / (acc._n + 1);
        acc.total_avg_ms = ((acc.total_avg_ms ?? 0) * acc._n + (r.total_avg_ms ?? 0)) / (acc._n + 1);
        acc.edge_p95_ms = Math.max(acc.edge_p95_ms, r.edge_p95_ms);
        acc.total_p95_ms = Math.max(acc.total_p95_ms, r.total_p95_ms);
        acc._n += 1;
      }
    }
    return Array.from(byBucket.values())
      .sort((a, b) => a.bucket_start.localeCompare(b.bucket_start))
      .map((r) => ({
        ...r,
        time: fmtTime(r.bucket_start, Number(windowMinutes)),
        cache_hit_rate_pct: r.total > 0 ? Math.round((r.hits / r.total) * 10000) / 100 : 0,
        invalidation_pct: r.total > 0 ? Math.round((r.misses / r.total) * 10000) / 100 : 0,
      }));
  }, [rows, windowMinutes]);

  const totals = useMemo(() => {
    const t = agg.reduce(
      (acc, r) => {
        acc.total += r.total;
        acc.hits += r.hits;
        acc.misses += r.misses;
        acc.stale += r.stale;
        acc.l1_fresh += r.l1_fresh;
        acc.l1_stale += r.l1_stale;
        acc.l1_miss += r.l1_miss;
        acc.l1_bypass += r.l1_bypass;
        return acc;
      },
      { total: 0, hits: 0, misses: 0, stale: 0, l1_fresh: 0, l1_stale: 0, l1_miss: 0, l1_bypass: 0 },
    );
    return {
      ...t,
      hitRate: t.total > 0 ? ((t.hits / t.total) * 100).toFixed(1) : '0.0',
      invalidationRate: t.total > 0 ? ((t.misses / t.total) * 100).toFixed(1) : '0.0',
    };
  }, [agg]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-secondary" /> Bible Cache — Séries Temporais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            cache_hit_rate, latência de Edge e distribuição L1 fresh/stale/miss/bypass por janela.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
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
                <SelectContent>
                  {WINDOW_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <Select value={sinceHours} onValueChange={setSinceHours}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SINCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Livro (abbrev)</Label>
              <Input value={abbrev} onChange={(e) => setAbbrev(e.target.value)} placeholder="ex: gn (vazio = todos)" maxLength={8} />
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={loading} className="w-full">
                {loading ? 'Carregando...' : 'Aplicar'}
              </Button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Requisições', value: totals.total.toLocaleString('pt-BR') },
          { label: 'Cache hit rate', value: `${totals.hitRate}%` },
          { label: 'Invalidação (MISS)', value: `${totals.invalidationRate}%` },
          { label: 'L1 fresh / stale / miss', value: `${totals.l1_fresh} / ${totals.l1_stale} / ${totals.l1_miss}` },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-lg border bg-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cache hit rate (%) por janela</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={agg}>
              <defs>
                <linearGradient id="hitRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
              <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="cache_hit_rate_pct" name="Hit rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#hitRate)" />
              <Area type="monotone" dataKey="invalidation_pct" name="Invalidação" stroke="hsl(var(--destructive))" strokeWidth={1.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Latência de Edge (ms) — avg, p50, p95</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={agg}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
              <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
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
          <CardDescription className="text-xs">fresh • stale • miss • bypass</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agg}>
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
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem dados na janela selecionada.
        </p>
      )}
    </div>
  );
}
