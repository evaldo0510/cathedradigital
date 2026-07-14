import { useMemo, useState } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { fingerprintQuery, shortFingerprint } from './queryFingerprint';

export interface SnapshotForTrend {
  id: string;
  taken_at: string;
  label: string | null;
  total_calls: number | null;
  total_exec_ms: number | null;
  rows: Array<{
    query: string;
    calls: number;
    total_exec_time: number;
    mean_exec_time: number;
    max_exec_time: number;
  }>;
}

const OVERALL = '__overall__';

function p95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
}

const fmtMs = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(2)} ms`;

export function SnapshotTrends({ snapshots }: { snapshots: SnapshotForTrend[] }) {
  const [selected, setSelected] = useState<string>(OVERALL);

  // rank fingerprints by total exec across all snapshots
  const topFingerprints = useMemo(() => {
    const agg = new Map<string, { total: number; example: string }>();
    for (const s of snapshots) {
      for (const r of s.rows || []) {
        const fp = fingerprintQuery(r.query);
        const cur = agg.get(fp) || { total: 0, example: r.query };
        cur.total += r.total_exec_time || 0;
        agg.set(fp, cur);
      }
    }
    return [...agg.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 30)
      .map(([fp, v]) => ({ fp, example: v.example }));
  }, [snapshots]);

  const data = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime(),
    );
    return sorted.map((s) => {
      const when = new Date(s.taken_at);
      const label = `${when.toLocaleDateString('pt-BR')} ${when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (selected === OVERALL) {
        const means = (s.rows || []).map((r) => r.mean_exec_time || 0);
        const mean = means.length ? means.reduce((a, b) => a + b, 0) / means.length : 0;
        return {
          when: label,
          mean,
          p95: p95(means),
          calls: s.total_calls ?? 0,
          total: s.total_exec_ms ?? 0,
        };
      }
      const matches = (s.rows || []).filter((r) => fingerprintQuery(r.query) === selected);
      const calls = matches.reduce((a, r) => a + (r.calls || 0), 0);
      const total = matches.reduce((a, r) => a + (r.total_exec_time || 0), 0);
      const meanWeighted = calls > 0 ? total / calls : 0;
      // p95 of max_exec_time samples as proxy (pg_stat_statements doesn't expose per-call p95)
      const p95Val = p95(matches.map((r) => r.max_exec_time || 0));
      return { when: label, mean: meanWeighted, p95: p95Val, calls, total };
    });
  }, [snapshots, selected]);

  if (snapshots.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Capture pelo menos 2 snapshots para visualizar tendências.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Query normalizada</Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="max-w-[720px]">
            <SelectItem value={OVERALL}>— Geral (agregado do snapshot) —</SelectItem>
            {topFingerprints.map(({ fp }) => (
              <SelectItem key={fp} value={fp}>
                <span className="font-mono text-xs">{shortFingerprint(fp, 100)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TrendChart data={data} dataKey="mean" title="Tempo médio (ms)" formatY={fmtMs} />
        <TrendChart data={data} dataKey="p95" title="p95 (ms)" formatY={fmtMs} />
        <TrendChart data={data} dataKey="calls" title="Chamadas" formatY={(v) => v.toLocaleString('pt-BR')} />
      </div>
    </div>
  );
}

function TrendChart({
  data, dataKey, title, formatY,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: 'mean' | 'p95' | 'calls' | 'total';
  title: string;
  formatY: (v: number) => string;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
            <XAxis dataKey="when" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} width={60}
              tickFormatter={(v) => formatY(Number(v))} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 8, fontSize: 12,
              }}
              formatter={(v: number) => formatY(v)}
            />
            <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
