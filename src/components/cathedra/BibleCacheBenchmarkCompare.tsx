import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Camera, GitCompareArrows, Trash2, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface SummaryRow {
  cache_type: string;
  n: number;
  sql_avg_ms: number;
  sql_p95_ms: number;
  total_avg_ms: number;
  total_p50_ms: number;
  total_p95_ms: number;
  total_max_ms: number;
}

interface Snapshot {
  id: string;
  label: string;
  generated_at: string;
  since_days: number;
  summary: SummaryRow[];
}

const STORAGE_KEY = 'bible_cache_benchmark_snapshots_v1';
const MAX_SNAPSHOTS = 10;

function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snaps: Snapshot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snaps.slice(-MAX_SNAPSHOTS)));
}

function pctDelta(after: number, before: number): { value: number; display: string; dir: 'down' | 'up' | 'flat' } {
  if (!before || before === 0) return { value: 0, display: '—', dir: 'flat' };
  const d = ((after - before) / before) * 100;
  const dir = Math.abs(d) < 0.5 ? 'flat' : d < 0 ? 'down' : 'up';
  return { value: d, display: `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`, dir };
}

function hitRate(summary: SummaryRow[]): { rate: number; totalN: number } {
  const total = summary.reduce((a, r) => a + r.n, 0);
  const hits = summary.filter(r => r.cache_type === 'L1_HIT_FRESH' || r.cache_type === 'L1_HIT_STALE').reduce((a, r) => a + r.n, 0);
  return { rate: total > 0 ? (hits / total) * 100 : 0, totalN: total };
}

// Para latência: queda (negativa) é boa → verde; alta é ruim → vermelha.
// Para hit_rate: alta (positiva) é boa.
function DeltaCell({ delta, betterDown }: { delta: ReturnType<typeof pctDelta>; betterDown: boolean }) {
  if (delta.dir === 'flat' || delta.display === '—') {
    return <span className="text-muted-foreground inline-flex items-center gap-1"><Minus className="h-3 w-3" />{delta.display}</span>;
  }
  const good = betterDown ? delta.dir === 'down' : delta.dir === 'up';
  const cls = good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const Icon = delta.dir === 'down' ? ArrowDown : ArrowUp;
  return <span className={`${cls} inline-flex items-center gap-1 font-medium`}><Icon className="h-3 w-3" />{delta.display}</span>;
}

export default function BibleCacheBenchmarkCompare() {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [beforeId, setBeforeId] = useState<string>('');
  const [afterId, setAfterId] = useState<string>('');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const s = loadSnapshots();
    setSnaps(s);
    if (s.length >= 2) {
      setBeforeId(s[s.length - 2].id);
      setAfterId(s[s.length - 1].id);
    } else if (s.length === 1) {
      setAfterId(s[0].id);
    }
  }, []);

  const before = useMemo(() => snaps.find(s => s.id === beforeId), [snaps, beforeId]);
  const after = useMemo(() => snaps.find(s => s.id === afterId), [snaps, afterId]);

  const capture = async () => {
    setCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-cache-timeseries', {
        body: { action: 'benchmark', since_days: 7 },
      });
      if (error) throw error;
      const payload = data as { generated_at?: string; since_days?: number; summary?: SummaryRow[] };
      if (!payload?.summary) throw new Error('Resposta sem summary');
      const now = new Date();
      const id = `snap_${now.getTime()}`;
      const label = now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const snap: Snapshot = {
        id,
        label,
        generated_at: payload.generated_at ?? now.toISOString(),
        since_days: payload.since_days ?? 7,
        summary: payload.summary,
      };
      const next = [...snaps, snap].slice(-MAX_SNAPSHOTS);
      saveSnapshots(next);
      setSnaps(next);
      setAfterId(snap.id);
      if (!beforeId && next.length >= 2) setBeforeId(next[next.length - 2].id);
      toast.success('Snapshot capturado.');
    } catch (e) {
      toast.error('Falha ao capturar snapshot: ' + ((e as Error).message ?? 'erro'));
    } finally {
      setCapturing(false);
    }
  };

  const clearAll = () => {
    if (!confirm('Apagar todos os snapshots salvos neste navegador?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setSnaps([]); setBeforeId(''); setAfterId('');
  };

  const removeOne = (id: string) => {
    const next = snaps.filter(s => s.id !== id);
    saveSnapshots(next); setSnaps(next);
    if (beforeId === id) setBeforeId('');
    if (afterId === id) setAfterId('');
  };

  const rows = useMemo(() => {
    if (!before || !after) return [];
    const types = ['L1_HIT_FRESH', 'L1_HIT_STALE', 'L1_MISS'];
    return types.map(t => {
      const b = before.summary.find(s => s.cache_type === t) ?? { cache_type: t, n: 0, sql_avg_ms: 0, sql_p95_ms: 0, total_avg_ms: 0, total_p50_ms: 0, total_p95_ms: 0, total_max_ms: 0 };
      const a = after.summary.find(s => s.cache_type === t) ?? { cache_type: t, n: 0, sql_avg_ms: 0, sql_p95_ms: 0, total_avg_ms: 0, total_p50_ms: 0, total_p95_ms: 0, total_max_ms: 0 };
      return {
        type: t,
        b, a,
        d_avg: pctDelta(a.total_avg_ms, b.total_avg_ms),
        d_p95: pctDelta(a.total_p95_ms, b.total_p95_ms),
        d_sql_p95: pctDelta(a.sql_p95_ms, b.sql_p95_ms),
        d_n: pctDelta(a.n, b.n),
      };
    });
  }, [before, after]);

  const hitRateRow = useMemo(() => {
    if (!before || !after) return null;
    const hb = hitRate(before.summary);
    const ha = hitRate(after.summary);
    return { hb, ha, delta: pctDelta(ha.rate, hb.rate) };
  }, [before, after]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-secondary" /> Comparação lado a lado de benchmarks
        </CardTitle>
        <CardDescription className="text-xs">
          Capture snapshots em momentos diferentes (antes/depois de uma mudança de TTL, deploy, etc.) e compare deltas % de p95, avg e cache_hit_rate. Snapshots ficam neste navegador (localStorage, máx {MAX_SNAPSHOTS}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <Button onClick={capture} disabled={capturing} size="sm">
            <Camera className={`mr-2 h-4 w-4 ${capturing ? 'animate-pulse' : ''}`} />
            {capturing ? 'Capturando...' : 'Capturar snapshot agora'}
          </Button>
          {snaps.length > 0 && (
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Limpar snapshots ({snaps.length})
            </Button>
          )}
        </div>

        {snaps.length < 2 ? (
          <p className="text-xs text-muted-foreground">
            {snaps.length === 0 ? 'Nenhum snapshot ainda.' : '1 snapshot salvo.'} Capture pelo menos 2 para comparar.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Antes</Label>
                <Select value={beforeId} onValueChange={setBeforeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {snaps.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label} · {s.since_days}d</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Depois</Label>
                <Select value={afterId} onValueChange={setAfterId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {snaps.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label} · {s.since_days}d</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {before && after && (
              <>
                {hitRateRow && (
                  <div className="p-3 rounded-md border bg-muted/30 flex flex-wrap gap-4 items-center text-sm">
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">cache_hit_rate</div>
                      <div className="font-mono">
                        {hitRateRow.hb.rate.toFixed(1)}% → <span className="font-bold">{hitRateRow.ha.rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div><DeltaCell delta={hitRateRow.delta} betterDown={false} /></div>
                    <div className="text-xs text-muted-foreground">
                      n: {hitRateRow.hb.totalN.toLocaleString('pt-BR')} → {hitRateRow.ha.totalN.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">n (antes → depois)</TableHead>
                        <TableHead className="text-right">total_avg_ms</TableHead>
                        <TableHead className="text-right">Δ avg</TableHead>
                        <TableHead className="text-right">total_p95_ms</TableHead>
                        <TableHead className="text-right">Δ p95</TableHead>
                        <TableHead className="text-right">sql_p95_ms</TableHead>
                        <TableHead className="text-right">Δ sql_p95</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(r => (
                        <TableRow key={r.type}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{r.type}</Badge>
                            {r.type === 'L1_HIT_STALE' && r.a.n > 0 && r.a.n < 30 && (
                              <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">n&lt;30</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {r.b.n} → {r.a.n}
                          </TableCell>
                          <TableCell className="text-right font-mono">{r.b.total_avg_ms} → <strong>{r.a.total_avg_ms}</strong></TableCell>
                          <TableCell className="text-right"><DeltaCell delta={r.d_avg} betterDown /></TableCell>
                          <TableCell className="text-right font-mono">{r.b.total_p95_ms} → <strong>{r.a.total_p95_ms}</strong></TableCell>
                          <TableCell className="text-right"><DeltaCell delta={r.d_p95} betterDown /></TableCell>
                          <TableCell className="text-right font-mono">{r.b.sql_p95_ms} → <strong>{r.a.sql_p95_ms}</strong></TableCell>
                          <TableCell className="text-right"><DeltaCell delta={r.d_sql_p95} betterDown /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Verde = melhora (latência caiu ou hit_rate subiu). Vermelho = regressão. STALE com n&lt;30 marcado como baixa confiança.
                </p>
              </>
            )}
          </>
        )}

        {snaps.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Gerenciar snapshots ({snaps.length})</summary>
            <ul className="mt-2 space-y-1">
              {snaps.map(s => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-1 border-b border-border/40 last:border-0">
                  <span className="font-mono">{s.label} · {s.since_days}d · {s.summary.reduce((a, r) => a + r.n, 0)} req</span>
                  <Button size="sm" variant="ghost" onClick={() => removeOne(s.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
