import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Activity, FlaskConical, Flame, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface MetricRow {
  abbrev: string;
  chapter: number;
  cache: string | null;
  total_ms: number | null;
  bolls_ms: number | null;
  source: string | null;
  created_at: string;
}

interface BookBreakdown {
  abbrev: string;
  cache: string;
  samples: number;
  avgTotal: number;
  avgUpstream: number;
  avgInternal: number; // total - upstream (SQL + edge compute)
  p95Total: number;
}

// Espelha CHAPTERS de scripts/warm-bible-cache.ts
const CHAPTERS: Record<string, number> = {
  Gn: 50, Ex: 40, Lv: 27, Nm: 36, Dt: 34, Js: 24, Jz: 21, Rt: 4,
  '1Sm': 31, '2Sm': 24, '1Rs': 22, '2Rs': 25, '1Cr': 29, '2Cr': 36,
  Ed: 10, Ne: 13, Et: 10, 'Jó': 42, Sl: 150, Pv: 31, Ec: 12, Ct: 8,
  Is: 66, Jr: 52, Lm: 5, Ez: 48, Dn: 14, Os: 14, Jl: 3, Am: 9, Ab: 1,
  Jn: 4, Mq: 7, Na: 3, Hc: 3, Sf: 3, Ag: 2, Zc: 14, Ml: 4,
  Mt: 28, Mc: 16, Lc: 24, Jo: 21, At: 28, Rm: 16, '1Co': 16, '2Co': 13,
  Gl: 6, Ef: 6, Fp: 4, Cl: 4, '1Ts': 5, '2Ts': 3, '1Tm': 6, '2Tm': 4,
  Tt: 3, Fm: 1, Hb: 13, Tg: 5, '1Pe': 5, '2Pe': 3, '1Jo': 5, '2Jo': 1, '3Jo': 1, Jd: 1, Ap: 22,
  Tb: 14, Jdt: 16, Sb: 19, Eclo: 51, Br: 6, '1Mc': 16, '2Mc': 15,
};

const TIERS = {
  hot: ['Sl', 'Pv', 'Mt', 'Mc', 'Lc', 'Jo'],
  pentateuch: ['Gn', 'Ex', 'Lv', 'Nm', 'Dt', 'Js'],
  deutero: ['Tb', 'Jdt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc'],
};

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
}

export default function BiblePerfBreakdown() {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);

  // Warm simulation controls
  const [simAvgMs, setSimAvgMs] = useState(450);
  const [simConcurrency, setSimConcurrency] = useState(4);
  const [simTier, setSimTier] = useState<'hot' | 'pentateuch' | 'deutero' | 'all'>('pentateuch');
  const [simThresholdMs, setSimThresholdMs] = useState(800);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('bible_cache_metric_events')
      .select('abbrev, chapter, cache, total_ms, bolls_ms, source, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) toast.error(error.message);
    setRows((data ?? []) as MetricRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [hours]);

  // Breakdown por livro × cache version (cache = HIT/MISS/STALE = proxy de "versão")
  const breakdown = useMemo<BookBreakdown[]>(() => {
    const map = new Map<string, { total: number[]; upstream: number[]; }>();
    for (const r of rows) {
      const total = r.total_ms;
      if (typeof total !== 'number') continue;
      const cache = r.cache ?? 'UNKNOWN';
      const key = `${r.abbrev}|${cache}`;
      const b = map.get(key) ?? { total: [], upstream: [] };
      b.total.push(total);
      b.upstream.push(typeof r.bolls_ms === 'number' && r.bolls_ms > 0 ? r.bolls_ms : 0);
      map.set(key, b);
    }
    return [...map.entries()].map(([key, b]) => {
      const [abbrev, cache] = key.split('|');
      const avgTotal = Math.round(b.total.reduce((s, v) => s + v, 0) / b.total.length);
      const avgUpstream = Math.round(b.upstream.reduce((s, v) => s + v, 0) / b.upstream.length);
      return {
        abbrev, cache,
        samples: b.total.length,
        avgTotal,
        avgUpstream,
        avgInternal: Math.max(0, avgTotal - avgUpstream),
        p95Total: percentile(b.total, 95),
      };
    }).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [rows]);

  const slowBooks = useMemo(() =>
    breakdown
      .filter(b => b.cache !== 'HIT' || b.avgTotal > simThresholdMs)
      .filter((b, i, arr) => arr.findIndex(x => x.abbrev === b.abbrev) === i)
      .filter(b => b.avgTotal > simThresholdMs)
      .map(b => b.abbrev),
    [breakdown, simThresholdMs]);

  const simulation = useMemo(() => {
    const books =
      simTier === 'all'
        ? Object.keys(CHAPTERS)
        : (TIERS as any)[simTier] as string[];
    const totalChapters = books.reduce((s, b) => s + (CHAPTERS[b] ?? 0), 0);
    const wallMs = Math.ceil(totalChapters / Math.max(1, simConcurrency)) * simAvgMs;
    const secs = Math.round(wallMs / 1000);
    return {
      books, totalChapters,
      durationLabel: `${Math.floor(secs / 60)}m${secs % 60}s`,
      estimatedRequests: totalChapters,
      writeCost: totalChapters, // 1 invocation per chapter
      impactedSlowBooks: books.filter(b => slowBooks.includes(b)),
    };
  }, [simTier, simAvgMs, simConcurrency, slowBooks]);

  const runRegressionCheck = async () => {
    const { data, error } = await supabase.functions.invoke('bible-latency-regression-alert', {
      body: { days: 3, threshold_ms: simThresholdMs, dry_run: true },
    });
    if (error) { toast.error(error.message); return; }
    toast.message(`Regressão (dry-run): ${data?.regressed_count ?? 0} livro(s)`, {
      description: (data?.regressed ?? []).slice(0, 5).map((r: any) => `${r.abbrev} ${r.window_avg}ms`).join(' · ') || 'nenhum acima do limiar',
    });
  };

  const runAutoWarm = async (dry: boolean) => {
    const { data, error } = await supabase.functions.invoke('bible-auto-warm-slow', {
      body: { threshold_ms: simThresholdMs, concurrency: simConcurrency, max_chapters_per_book: 10, dry_run: dry },
    });
    if (error) { toast.error(error.message); return; }
    toast.success(
      dry
        ? `Simulação warm: ${data?.queued ?? 0} capítulos · prioridade=${(data?.priority_books ?? []).join(',')} · lentos=${(data?.slow_books ?? []).join(',') || '—'}`
        : `Warm executado: ${data?.executed?.ok ?? 0} ok / ${data?.executed?.fail ?? 0} fail em ${data?.executed?.ms ?? 0}ms`,
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Breakdown de Performance da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Por livro × versão de cache (HIT/MISS/STALE). Tempo SQL+Edge derivado de <code>total_ms − bolls_ms</code>.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="hours" className="text-xs">Janela (horas)</Label>
            <Input id="hours" type="number" min={1} max={168} value={hours}
                   onChange={e => setHours(Math.max(1, Math.min(168, Number(e.target.value) || 24)))}
                   className="w-24" />
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Simulação do cron de warmup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Simulação do cron de warmup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Tier</Label>
              <select value={simTier} onChange={e => setSimTier(e.target.value as any)}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                <option value="pentateuch">Pentateuco + Js (6 livros)</option>
                <option value="hot">Hot (Sl, Pv, evangelhos)</option>
                <option value="deutero">Deuterocanônicos</option>
                <option value="all">Todos os 73 livros</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Concorrência</Label>
              <Input type="number" min={1} max={16} value={simConcurrency}
                     onChange={e => setSimConcurrency(Math.max(1, Math.min(16, Number(e.target.value) || 1)))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tempo médio/capítulo (ms)</Label>
              <Input type="number" min={100} max={10000} step={50} value={simAvgMs}
                     onChange={e => setSimAvgMs(Math.max(100, Math.min(10000, Number(e.target.value) || 450)))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Limiar de lentidão (ms)</Label>
              <Input type="number" min={100} max={5000} step={50} value={simThresholdMs}
                     onChange={e => setSimThresholdMs(Math.max(100, Math.min(5000, Number(e.target.value) || 800)))} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Livros</div>
              <div className="text-lg font-semibold">{simulation.books.length}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Capítulos</div>
              <div className="text-lg font-semibold">{simulation.totalChapters}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Duração estimada</div>
              <div className="text-lg font-semibold">{simulation.durationLabel}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Livros lentos atingidos</div>
              <div className="text-lg font-semibold">{simulation.impactedSlowBooks.length}</div>
              <div className="text-[10px] text-muted-foreground truncate">{simulation.impactedSlowBooks.join(', ') || '—'}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => runAutoWarm(true)}>
              <FlaskConical className="w-4 h-4 mr-2" /> Dry-run no servidor
            </Button>
            <Button size="sm" onClick={() => runAutoWarm(false)}>
              <Flame className="w-4 h-4 mr-2" /> Executar warmup seletivo
            </Button>
            <Button size="sm" variant="outline" onClick={runRegressionCheck}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Checar regressão (3d × {simThresholdMs}ms)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Breakdown de tempo por livro × versão de cache
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sem eventos na janela selecionada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livro</TableHead>
                  <TableHead>Cache</TableHead>
                  <TableHead className="text-right">Amostras</TableHead>
                  <TableHead className="text-right">SQL+Edge (ms)</TableHead>
                  <TableHead className="text-right">Upstream/Rede (ms)</TableHead>
                  <TableHead className="text-right">Render</TableHead>
                  <TableHead className="text-right">Total médio</TableHead>
                  <TableHead className="text-right">p95</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((b, i) => {
                  const slow = b.avgTotal > simThresholdMs;
                  return (
                    <TableRow key={i} className={slow ? 'bg-red-50/40' : ''}>
                      <TableCell className="font-mono text-xs">{b.abbrev}</TableCell>
                      <TableCell>
                        <Badge variant={b.cache === 'HIT' ? 'secondary' : 'outline'}>{b.cache}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.samples}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.avgInternal}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.avgUpstream || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">client-only</TableCell>
                      <TableCell className={`text-right tabular-nums text-xs font-semibold ${slow ? 'text-red-600' : 'text-emerald-700'}`}>
                        {b.avgTotal}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.p95Total}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            Render time não é medido no servidor — instrumentado no cliente via <code>biblePerf</code> (ver <a className="underline" href="/bible-perf">/bible-perf</a>).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
