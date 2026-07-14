import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SnapshotTrends } from './SnapshotTrends';
import { IntervalCompareCard } from './IntervalCompareCard';
import type { SnapshotHistoryRow } from './useSnapshotHistory';

type SnapshotRow = SnapshotHistoryRow;


const fmtMs = (v: number | null | undefined) => {
  if (v == null) return '—';
  if (v >= 1000) return `${(v / 1000).toFixed(2)} s`;
  return `${v.toFixed(2)} ms`;
};
const fmtInt = (v: number | null | undefined) => (v ?? 0).toLocaleString('pt-BR');

function normQuery(q: string): string {
  return q.replace(/\s+/g, ' ').trim().slice(0, 240);
}

function computeP95(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
}

interface SnapshotsPanelProps {
  snapshots: SnapshotRow[];
  loading: boolean;
  reload: () => Promise<void> | void;
}

export function SnapshotsPanel({ snapshots, loading, reload }: SnapshotsPanelProps) {
  const [capturing, setCapturing] = useState(false);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [baseId, setBaseId] = useState<string>('');
  const [compareId, setCompareId] = useState<string>('');

  const load = useCallback(async () => { await reload(); }, [reload]);



  const capture = useCallback(async () => {
    setCapturing(true);
    try {
      const { error } = await supabase.rpc('admin_capture_pg_stat_snapshot' as never, {
        p_label: label.trim() || null,
        p_note: note.trim() || null,
        p_limit: 200,
      } as never);
      if (error) throw error;
      toast.success('Snapshot capturado');
      setLabel(''); setNote('');
      await load();
    } catch (e) {
      toast.error(`Falha ao capturar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCapturing(false);
    }
  }, [label, note, load]);

  const remove = async (id: string) => {
    if (!confirm('Remover este snapshot?')) return;
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
      };
    }).from('pg_stat_snapshots').delete().eq('id', id);
    if (error) { toast.error('Falha ao remover'); return; }
    toast.success('Snapshot removido');
    await load();
  };

  const stats = useMemo(() => {
    const map = new Map<string, { mean: number; p95: number; calls: number; total: number }>();
    for (const s of snapshots) {
      const times = (s.rows || []).map((r) => r.mean_exec_time).sort((a, b) => a - b);
      const p95 = computeP95(times);
      const mean = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const calls = (s.rows || []).reduce((a, r) => a + (r.calls || 0), 0);
      const total = s.total_exec_ms ?? 0;
      map.set(s.id, { mean, p95, calls, total });
    }
    return map;
  }, [snapshots]);

  const diff = useMemo(() => {
    if (!baseId || !compareId || baseId === compareId) return null;
    const base = snapshots.find((s) => s.id === baseId);
    const cmp = snapshots.find((s) => s.id === compareId);
    if (!base || !cmp) return null;
    const baseMap = new Map(base.rows.map((r) => [normQuery(r.query), r]));
    const rows: Array<{
      query: string;
      baseMs: number; cmpMs: number; delta: number;
      baseCalls: number; cmpCalls: number;
      baseMean: number; cmpMean: number;
    }> = [];
    for (const r of cmp.rows) {
      const key = normQuery(r.query);
      const b = baseMap.get(key);
      rows.push({
        query: key,
        baseMs: b?.total_exec_time ?? 0,
        cmpMs: r.total_exec_time,
        delta: r.total_exec_time - (b?.total_exec_time ?? 0),
        baseCalls: b?.calls ?? 0,
        cmpCalls: r.calls,
        baseMean: b?.mean_exec_time ?? 0,
        cmpMean: r.mean_exec_time,
      });
    }
    rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    return rows.slice(0, 20);
  }, [baseId, compareId, snapshots]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Snapshots — tendências entre janelas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label htmlFor="snap-label">Label (opcional)</Label>
            <Input id="snap-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="antes-deploy-b3.1" />
          </div>
          <div>
            <Label htmlFor="snap-note">Nota (opcional)</Label>
            <Input id="snap-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="baseline antes do batching" />
          </div>
          <div className="flex gap-2">
            <Button onClick={capture} disabled={capturing} size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Capturar agora
            </Button>
            <Button onClick={load} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Janela</TableHead>
                <TableHead className="text-right">Chamadas</TableHead>
                <TableHead className="text-right">Total ms</TableHead>
                <TableHead className="text-right">Média</TableHead>
                <TableHead className="text-right">p95</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                    Nenhum snapshot ainda. Capture um antes/depois de deploys para comparar.
                  </TableCell>
                </TableRow>
              )}
              {snapshots.map((s) => {
                const st = stats.get(s.id);
                const win = s.window_seconds ? `${(s.window_seconds / 3600).toFixed(1)} h` : '—';
                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">
                      {new Date(s.taken_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {s.label ? <Badge variant="secondary">{s.label}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      {s.note && <div className="text-xs text-muted-foreground mt-0.5">{s.note}</div>}
                    </TableCell>
                    <TableCell className="text-right text-xs">{win}</TableCell>
                    <TableCell className="text-right">{fmtInt(st?.calls)}</TableCell>
                    <TableCell className="text-right">{fmtMs(st?.total)}</TableCell>
                    <TableCell className="text-right">{fmtMs(st?.mean)}</TableCell>
                    <TableCell className="text-right">{fmtMs(st?.p95)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Tendências entre janelas</p>
          <SnapshotTrends snapshots={snapshots} />
        </div>


        {snapshots.length >= 2 && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Base (antes)</Label>
                <Select value={baseId} onValueChange={setBaseId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {snapshots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {new Date(s.taken_at).toLocaleString('pt-BR')} {s.label ? `· ${s.label}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Comparar (depois)</Label>
                <Select value={compareId} onValueChange={setCompareId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {snapshots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {new Date(s.taken_at).toLocaleString('pt-BR')} {s.label ? `· ${s.label}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {diff && diff.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">Base total</TableHead>
                      <TableHead className="text-right">Novo total</TableHead>
                      <TableHead className="text-right">Δ</TableHead>
                      <TableHead className="text-right">Base média</TableHead>
                      <TableHead className="text-right">Nova média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diff.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs max-w-md truncate">{d.query}</TableCell>
                        <TableCell className="text-right">{fmtMs(d.baseMs)}</TableCell>
                        <TableCell className="text-right">{fmtMs(d.cmpMs)}</TableCell>
                        <TableCell className={`text-right font-medium ${d.delta > 0 ? 'text-destructive' : 'text-primary'}`}>
                          {d.delta > 0 ? '+' : ''}{fmtMs(d.delta)}
                        </TableCell>
                        <TableCell className="text-right text-xs">{fmtMs(d.baseMean)}</TableCell>
                        <TableCell className="text-right text-xs">{fmtMs(d.cmpMean)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
      </Card>
      <IntervalCompareCard snapshots={snapshots} />
    </>
  );
}

