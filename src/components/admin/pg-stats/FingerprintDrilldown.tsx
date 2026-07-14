import { useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { fingerprintQuery } from './queryFingerprint';
import type { SnapshotHistoryRow } from './useSnapshotHistory';

const fmtMs = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(2)} ms`;
const fmtInt = (v: number) => (v ?? 0).toLocaleString('pt-BR');

interface Variant {
  query: string;
  calls: number;
  total_exec_ms: number;
  mean_exec_ms: number;
  max_exec_ms: number;
}

export function FingerprintDrilldown({
  fingerprint,
  variants,
  snapshots,
}: {
  fingerprint: string;
  variants: Variant[];
  snapshots: SnapshotHistoryRow[];
}) {
  // per-variant evolution across snapshots (by exact query text)
  const evolution = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime(),
    );
    const map = new Map<string, Array<{ when: string; mean: number; calls: number }>>();
    for (const v of variants) map.set(v.query, []);
    for (const s of sorted) {
      const when = new Date(s.taken_at).toLocaleString('pt-BR', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      });
      for (const r of s.rows || []) {
        if (fingerprintQuery(r.query) !== fingerprint) continue;
        // find matching variant by literal query; if not, still track as generic bucket
        const list = map.get(r.query);
        if (list) list.push({ when, mean: r.mean_exec_time || 0, calls: r.calls || 0 });
      }
    }
    return map;
  }, [snapshots, variants, fingerprint]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        {variants.length} variante{variants.length !== 1 ? 's' : ''} nesta classe
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">#</TableHead>
            <TableHead className="text-right">Chamadas</TableHead>
            <TableHead className="text-right">Média</TableHead>
            <TableHead className="text-right">Máx</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>SQL variante · evolução nos snapshots</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v, i) => {
            const evo = evolution.get(v.query) || [];
            return (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                <TableCell className="text-right text-xs">{fmtInt(v.calls)}</TableCell>
                <TableCell className="text-right text-xs">{fmtMs(v.mean_exec_ms)}</TableCell>
                <TableCell className="text-right text-xs">
                  <span className={v.max_exec_ms > 200 ? 'text-destructive font-medium' : ''}>
                    {fmtMs(v.max_exec_ms)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs">{fmtMs(v.total_exec_ms)}</TableCell>
                <TableCell>
                  <pre className="text-[11px] whitespace-pre-wrap break-all font-mono bg-background border rounded p-2 max-h-24 overflow-y-auto">
                    {v.query}
                  </pre>
                  {evo.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {evo.slice(-8).map((e, idx) => (
                        <span key={idx} className="border rounded px-1.5 py-0.5 bg-muted/30">
                          {e.when} · <strong>{fmtMs(e.mean)}</strong> · {fmtInt(e.calls)} calls
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Sem histórico nos snapshots ainda.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
