import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { biblePerf, type BiblePerfRun } from '@/lib/biblePerf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Activity } from 'lucide-react';

interface PhaseStats {
  phase: string;
  count: number;
  avg: number;
  p50: number;
  p95: number;
  max: number;
}

interface ServerMetric {
  abbrev: string;
  chapter: number;
  cache: string;
  total_ms: number;
  bolls_ms: number | null;
  source: string | null;
  created_at: string;
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx]);
}

function aggregate(values: number[]) {
  if (!values.length) return { count: 0, avg: 0, p50: 0, p95: 0, max: 0 };
  return {
    count: values.length,
    avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    max: Math.max(...values),
  };
}

export default function BiblePerfDashboard() {
  const [clientRuns, setClientRuns] = useState<BiblePerfRun[]>([]);
  const [serverMetrics, setServerMetrics] = useState<ServerMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setClientRuns(biblePerf.getRuns());
    const { data } = await supabase
      .from('bible_cache_metric_events')
      .select('abbrev, chapter, cache, total_ms, bolls_ms, source, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    setServerMetrics((data ?? []) as ServerMetric[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const phaseStats: PhaseStats[] = useMemo(() => {
    const phases = {
      'Capítulo (total)': clientRuns.map(r => biblePerf.getDurations(r).total_ms).filter((v): v is number => typeof v === 'number'),
      'Busca texto': clientRuns.map(r => biblePerf.getDurations(r).text_ms).filter((v): v is number => typeof v === 'number'),
      'Busca conexões': clientRuns.map(r => biblePerf.getDurations(r).connections_ms).filter((v): v is number => typeof v === 'number'),
      'Renderiza': clientRuns.map(r => biblePerf.getDurations(r).render_ms).filter((v): v is number => typeof v === 'number'),
      'Salva progresso': clientRuns.map(r => biblePerf.getDurations(r).progress_ms).filter((v): v is number => typeof v === 'number'),
    };
    return Object.entries(phases).map(([phase, values]) => ({ phase, ...aggregate(values) }));
  }, [clientRuns]);

  const coldVsWarm = useMemo(() => {
    const cold = serverMetrics.filter(m => m.cache === 'MISS').map(m => m.total_ms);
    const warm = serverMetrics.filter(m => m.cache === 'HIT').map(m => m.total_ms);
    const stale = serverMetrics.filter(m => m.cache.includes('STALE')).map(m => m.total_ms);
    return {
      cold: aggregate(cold),
      warm: aggregate(warm),
      stale: aggregate(stale),
    };
  }, [serverMetrics]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-secondary" /> Bible Performance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fases do fluxo de capítulo + comparação cold vs warm cache.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {/* Cold vs Warm */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Servidor: Cold vs Warm (últimas {serverMetrics.length} requisições)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cold (MISS)', data: coldVsWarm.cold, color: 'text-red-600' },
              { label: 'Warm (HIT)', data: coldVsWarm.warm, color: 'text-green-600' },
              { label: 'Stale (SWR)', data: coldVsWarm.stale, color: 'text-amber-600' },
            ].map(({ label, data, color }) => (
              <div key={label} className="space-y-1 p-4 rounded-lg border bg-card">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className={`text-2xl font-bold ${color}`}>{data.avg}ms <span className="text-xs text-muted-foreground">avg</span></div>
                <div className="text-xs text-muted-foreground">
                  n={data.count} · p50={data.p50}ms · p95={data.p95}ms · max={data.max}ms
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase stats (client) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cliente: tempo por fase (últimas {clientRuns.length} aberturas de capítulo)</CardTitle>
        </CardHeader>
        <CardContent>
          {clientRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sem amostras nesta sessão. Abra alguns capítulos da Bíblia e volte aqui.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fase</TableHead>
                  <TableHead className="text-right">N</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead className="text-right">p50</TableHead>
                  <TableHead className="text-right">p95</TableHead>
                  <TableHead className="text-right">Máx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phaseStats.map(s => (
                  <TableRow key={s.phase}>
                    <TableCell className="font-medium">{s.phase}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.avg}ms</TableCell>
                    <TableCell className="text-right tabular-nums">{s.p50}ms</TableCell>
                    <TableCell className="text-right tabular-nums">{s.p95}ms</TableCell>
                    <TableCell className="text-right tabular-nums">{s.max}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent runs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Aberturas recentes (sessão atual)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capítulo</TableHead>
                <TableHead>Cache</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Texto</TableHead>
                <TableHead className="text-right">Conexões</TableHead>
                <TableHead className="text-right">Render</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientRuns.slice(0, 30).map(r => {
                const d = biblePerf.getDurations(r);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.abbr} {r.chapter}</TableCell>
                    <TableCell>
                      {r.cacheHit
                        ? <Badge variant="secondary" className="bg-green-100 text-green-800">HIT</Badge>
                        : <Badge variant="outline">MISS</Badge>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{d.total_ms}ms</TableCell>
                    <TableCell className="text-right tabular-nums">{d.text_ms ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.connections_ms ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.render_ms ?? '—'}</TableCell>
                    <TableCell><span className="text-xs">{r.status ?? '—'}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
