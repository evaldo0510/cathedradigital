import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, RotateCcw, Copy, FileSearch, Download, Link2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { SavedViewsBar, type PgStatViewConfig } from '@/components/admin/pg-stats/SavedViewsBar';
import { SnapshotsPanel } from '@/components/admin/pg-stats/SnapshotsPanel';
import { ExplainDialog } from '@/components/admin/pg-stats/ExplainDialog';
import { AutoSnapshotConfigCard } from '@/components/admin/pg-stats/AutoSnapshotConfigCard';
import { fingerprintQuery, shortFingerprint } from '@/components/admin/pg-stats/queryFingerprint';
import { useSnapshotHistory } from '@/components/admin/pg-stats/useSnapshotHistory';
import { FingerprintDrilldown } from '@/components/admin/pg-stats/FingerprintDrilldown';
import { Sparkline } from '@/components/admin/pg-stats/Sparkline';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitialFromUrl<T extends string | number | boolean>(
  key: string, fallback: T, parse: (v: string) => T | undefined,
): T {
  if (typeof window === 'undefined') return fallback;
  const raw = new URLSearchParams(window.location.search).get(key);
  if (raw == null) return fallback;
  const parsed = parse(raw);
  return parsed !== undefined ? parsed : fallback;
}

type OrderBy = 'total_exec_time' | 'mean_exec_time' | 'max_exec_time' | 'calls';

interface StatRow {
  query: string;
  calls: number;
  total_exec_ms: number;
  mean_exec_ms: number;
  max_exec_ms: number;
  min_exec_ms: number;
  stddev_exec_ms: number;
  rows_returned: number;
  shared_blks_hit: number;
  shared_blks_read: number;
  stats_since: string;
}

const ORDER_LABELS: Record<OrderBy, string> = {
  total_exec_time: 'Tempo total',
  mean_exec_time: 'Tempo médio',
  max_exec_time: 'Tempo máximo (pico)',
  calls: 'Nº de chamadas',
};

const fmtMs = (v: number) => {
  if (v == null) return '—';
  if (v >= 1000) return `${(v / 1000).toFixed(2)} s`;
  return `${v.toFixed(2)} ms`;
};
const fmtInt = (v: number) => (v ?? 0).toLocaleString('pt-BR');

function firstLine(q: string, max = 180) {
  const clean = q.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

function inferTable(q: string): string {
  const m = q.match(/\b(?:FROM|INTO|UPDATE|JOIN)\s+"?public"?\."?([a-z_][a-z0-9_]*)"?/i);
  return m ? m[1] : '—';
}

function inferOp(q: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER' {
  const s = q.trim().toUpperCase();
  if (s.startsWith('WITH')) {
    if (/INSERT INTO/.test(s)) return 'INSERT';
    if (/UPDATE\s+"?PUBLIC/.test(s)) return 'UPDATE';
    if (/DELETE FROM/.test(s)) return 'DELETE';
    return 'SELECT';
  }
  if (s.startsWith('SELECT')) return 'SELECT';
  if (s.startsWith('INSERT')) return 'INSERT';
  if (s.startsWith('UPDATE')) return 'UPDATE';
  if (s.startsWith('DELETE')) return 'DELETE';
  return 'OTHER';
}

const OP_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SELECT: 'default',
  INSERT: 'secondary',
  UPDATE: 'outline',
  DELETE: 'destructive',
  OTHER: 'outline',
};

export default function PgStatStatements() {
  const { snapshots, loading: snapshotsLoading, reload: reloadSnapshots } = useSnapshotHistory(100);
  const [rows, setRows] = useState<StatRow[]>([]);
  const [orderBy, setOrderBy] = useState<OrderBy>(() =>
    getInitialFromUrl<OrderBy>('orderBy', 'total_exec_time',
      (v) => (['total_exec_time','mean_exec_time','max_exec_time','calls'].includes(v) ? (v as OrderBy) : undefined)));
  const [limit, setLimit] = useState<number>(() =>
    getInitialFromUrl<number>('limit', 25, (v) => {
      const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(200, n) : undefined;
    }));
  const [minCalls, setMinCalls] = useState<number>(() =>
    getInitialFromUrl<number>('minCalls', 1, (v) => {
      const n = Number(v); return Number.isFinite(n) && n > 0 ? n : undefined;
    }));
  const [tableFilter, setTableFilter] = useState<string>(() =>
    getInitialFromUrl<string>('tableFilter', '', (v) => v));
  const [opFilter, setOpFilter] = useState<'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'>(() =>
    getInitialFromUrl('opFilter', 'ALL' as const,
      (v) => (['ALL','SELECT','INSERT','UPDATE','DELETE'].includes(v) ? v as typeof opFilter : undefined)));
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainQuery, setExplainQuery] = useState('');
  const [groupByFingerprint, setGroupByFingerprint] = useState(() =>
    getInitialFromUrl<boolean>('groupByFp', false, (v) => v === '1' || v === 'true'));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() =>
    getInitialFromUrl<number>('pageSize', 25, (v) => {
      const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(500, n) : undefined;
    }));

  const currentView: PgStatViewConfig = {
    orderBy, limit, minCalls, opFilter, tableFilter,
  };

  const applyView = (cfg: PgStatViewConfig) => {
    setOrderBy(cfg.orderBy as OrderBy);
    setLimit(cfg.limit);
    setMinCalls(cfg.minCalls);
    setOpFilter(cfg.opFilter as typeof opFilter);
    setTableFilter(cfg.tableFilter);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_pg_stat_statements' as never, {
        p_order_by: orderBy,
        p_limit: limit,
        p_min_calls: minCalls,
      } as never);
      if (error) throw error;
      setRows((data as StatRow[]) || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha ao carregar: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [orderBy, limit, minCalls]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReset = useCallback(async () => {
    if (!confirm('Zerar pg_stat_statements? Toda a janela histórica de medição será perdida.')) return;
    setResetting(true);
    try {
      const { error } = await supabase.rpc('admin_reset_pg_stat_statements' as never);
      if (error) throw error;
      toast.success('Estatísticas zeradas. Nova janela iniciada.');
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha ao resetar: ${msg}`);
    } finally {
      setResetting(false);
    }
  }, [load]);

  const statsSince = rows[0]?.stats_since;
  const windowSeconds = useMemo(() => {
    if (!statsSince) return null;
    return Math.max(1, (Date.now() - new Date(statsSince).getTime()) / 1000);
  }, [statsSince]);

  const totalMsAll = useMemo(() => rows.reduce((s, r) => s + (r.total_exec_ms || 0), 0), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (opFilter !== 'ALL' && inferOp(r.query) !== opFilter) return false;
      if (tableFilter && !inferTable(r.query).toLowerCase().includes(tableFilter.toLowerCase())) return false;
      return true;
    });
  }, [rows, opFilter, tableFilter]);

  interface DisplayRow extends StatRow {
    fingerprint: string;
    variant_count: number;
  }

  const displayed = useMemo<DisplayRow[]>(() => {
    if (!groupByFingerprint) {
      return filtered.map((r) => ({ ...r, fingerprint: fingerprintQuery(r.query), variant_count: 1 }));
    }
    const map = new Map<string, DisplayRow>();
    for (const r of filtered) {
      const fp = fingerprintQuery(r.query);
      const cur = map.get(fp);
      if (!cur) {
        map.set(fp, { ...r, fingerprint: fp, variant_count: 1 });
      } else {
        const totalCalls = cur.calls + r.calls;
        const totalTime = cur.total_exec_ms + r.total_exec_ms;
        map.set(fp, {
          ...cur,
          calls: totalCalls,
          total_exec_ms: totalTime,
          mean_exec_ms: totalCalls > 0 ? totalTime / totalCalls : 0,
          max_exec_ms: Math.max(cur.max_exec_ms, r.max_exec_ms),
          min_exec_ms: Math.min(cur.min_exec_ms, r.min_exec_ms),
          stddev_exec_ms: Math.max(cur.stddev_exec_ms, r.stddev_exec_ms),
          rows_returned: cur.rows_returned + r.rows_returned,
          shared_blks_hit: cur.shared_blks_hit + r.shared_blks_hit,
          shared_blks_read: cur.shared_blks_read + r.shared_blks_read,
          variant_count: cur.variant_count + 1,
          query: cur.query, // keep first as example
        });
      }
    }
    const order = orderBy === 'total_exec_time' ? 'total_exec_ms'
      : orderBy === 'mean_exec_time' ? 'mean_exec_ms'
      : orderBy === 'max_exec_time' ? 'max_exec_ms' : 'calls';
    return [...map.values()].sort((a, b) => (b[order as keyof DisplayRow] as number) - (a[order as keyof DisplayRow] as number));
  }, [filtered, groupByFingerprint, orderBy]);

  // Pagination
  useEffect(() => { setPage(1); }, [orderBy, limit, minCalls, opFilter, tableFilter, groupByFingerprint, pageSize]);
  const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pageRows = useMemo(() => displayed.slice(pageStart, pageEnd), [displayed, pageStart, pageEnd]);

  const copyShareLink = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('orderBy', orderBy);
      params.set('limit', String(limit));
      params.set('minCalls', String(minCalls));
      params.set('opFilter', opFilter);
      params.set('tableFilter', tableFilter);
      params.set('groupByFp', groupByFingerprint ? '1' : '0');
      params.set('pageSize', String(pageSize));
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, '', url);
      toast.success('Link copiado — filtros e intervalos A×B preservados');
    } catch {
      toast.error('Falha ao copiar link');
    }
  };



  const toggleExpand = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const copyQuery = async (q: string) => {
    try {
      await navigator.clipboard.writeText(q);
      toast.success('Query copiada');
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const openExplain = (q: string) => {
    setExplainQuery(q);
    setExplainOpen(true);
  };

  const downloadBlob = (name: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      filters: { orderBy, limit, minCalls, opFilter, tableFilter, groupByFingerprint },
      window_started_at: statsSince ?? null,
      rows: displayed,
    };
    downloadBlob(
      `pg_stat_statements_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
    toast.success(`Exportados ${displayed.length} registros (JSON)`);
  };

  const exportCSV = () => {
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      'rank','op','table','calls','mean_ms','max_ms','min_ms','stddev_ms',
      'total_ms','pct_total','rows_returned','cache_hit','cache_read',
      'variants','fingerprint','query',
    ];
    const lines = [header.join(',')];
    displayed.forEach((r, i) => {
      const pct = totalMsAll > 0 ? (r.total_exec_ms / totalMsAll) * 100 : 0;
      lines.push([
        i + 1, inferOp(r.query), inferTable(r.query),
        r.calls, r.mean_exec_ms.toFixed(3), r.max_exec_ms.toFixed(3),
        r.min_exec_ms.toFixed(3), r.stddev_exec_ms.toFixed(3),
        r.total_exec_ms.toFixed(3), pct.toFixed(2),
        r.rows_returned, r.shared_blks_hit, r.shared_blks_read,
        r.variant_count, r.fingerprint,
        r.query.replace(/\s+/g, ' ').trim(),
      ].map(escape).join(','));
    });
    downloadBlob(
      `pg_stat_statements_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`,
      lines.join('\n'),
      'text/csv;charset=utf-8',
    );
    toast.success(`Exportados ${displayed.length} registros (CSV)`);
  };

  // ---- Fingerprint aggregate + evolution across snapshots (respects op/table filters) ----
  const fingerprintExportRows = useMemo(() => {
    const passFilters = (q: string) => {
      if (opFilter !== 'ALL' && inferOp(q) !== opFilter) return false;
      if (tableFilter && !inferTable(q).toLowerCase().includes(tableFilter.toLowerCase())) return false;
      return true;
    };
    const agg = new Map<string, {
      fingerprint: string; example: string;
      calls: number; totalMs: number; meanMs: number; p95Ms: number;
      evolution: Array<{ taken_at: string; calls: number; mean_ms: number; total_ms: number; p95_ms: number }>;
    }>();
    // live rows first (current window)
    for (const r of rows) {
      if (!passFilters(r.query)) continue;
      const fp = fingerprintQuery(r.query);
      const cur = agg.get(fp) || {
        fingerprint: fp, example: r.query,
        calls: 0, totalMs: 0, meanMs: 0, p95Ms: 0, evolution: [],
      };
      cur.calls += r.calls;
      cur.totalMs += r.total_exec_ms;
      cur.p95Ms = Math.max(cur.p95Ms, r.max_exec_ms);
      agg.set(fp, cur);
    }
    // evolution from snapshot history
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime(),
    );
    for (const s of sorted) {
      const perFp = new Map<string, { calls: number; total: number; max: number }>();
      for (const r of s.rows || []) {
        if (!passFilters(r.query)) continue;
        const fp = fingerprintQuery(r.query);
        const cur = perFp.get(fp) || { calls: 0, total: 0, max: 0 };
        cur.calls += r.calls || 0;
        cur.total += r.total_exec_time || 0;
        cur.max = Math.max(cur.max, r.max_exec_time || 0);
        perFp.set(fp, cur);
      }
      for (const [fp, v] of perFp) {
        if (!agg.has(fp)) {
          agg.set(fp, {
            fingerprint: fp, example: '',
            calls: 0, totalMs: 0, meanMs: 0, p95Ms: 0, evolution: [],
          });
        }
        agg.get(fp)!.evolution.push({
          taken_at: s.taken_at,
          calls: v.calls,
          mean_ms: v.calls > 0 ? v.total / v.calls : 0,
          total_ms: v.total,
          p95_ms: v.max,
        });
      }
    }
    for (const v of agg.values()) {
      v.meanMs = v.calls > 0 ? v.totalMs / v.calls : 0;
    }
    return [...agg.values()].sort((a, b) => b.totalMs - a.totalMs);
  }, [rows, snapshots, opFilter, tableFilter]);

  const exportFingerprintJSON = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      filters: { opFilter, tableFilter },
      snapshot_count: snapshots.length,
      rows: fingerprintExportRows,
    };
    downloadBlob(
      `pg_stat_fingerprints_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
    toast.success(`${fingerprintExportRows.length} fingerprints exportados (JSON)`);
  };

  const exportFingerprintCSV = () => {
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      'fingerprint','calls_live','mean_ms_live','p95_ms_live','total_ms_live',
      'snapshots_present','evolution_json','example',
    ];
    const lines = [header.join(',')];
    for (const r of fingerprintExportRows) {
      lines.push([
        r.fingerprint,
        r.calls, r.meanMs.toFixed(3), r.p95Ms.toFixed(3), r.totalMs.toFixed(3),
        r.evolution.length,
        JSON.stringify(r.evolution),
        r.example,
      ].map(escape).join(','));
    }
    downloadBlob(
      `pg_stat_fingerprints_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`,
      lines.join('\n'),
      'text/csv;charset=utf-8',
    );
    toast.success(`${fingerprintExportRows.length} fingerprints exportados (CSV)`);
  };




  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Top Queries — pg_stat_statements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ranking das consultas mais custosas do banco. Sprint B3 — priorização de otimizações.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros e ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label htmlFor="order-by">Ordenar por</Label>
              <Select value={orderBy} onValueChange={(v) => setOrderBy(v as OrderBy)}>
                <SelectTrigger id="order-by"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ORDER_LABELS) as OrderBy[]).map((k) => (
                    <SelectItem key={k} value={k}>{ORDER_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit">Top N</Label>
              <Input
                id="limit" type="number" min={1} max={200} value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value) || 25)))}
              />
            </div>

            <div>
              <Label htmlFor="min-calls">Mín. chamadas</Label>
              <Input
                id="min-calls" type="number" min={1} value={minCalls}
                onChange={(e) => setMinCalls(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <div>
              <Label htmlFor="op">Operação</Label>
              <Select value={opFilter} onValueChange={(v) => setOpFilter(v as typeof opFilter)}>
                <SelectTrigger id="op"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="SELECT">SELECT</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="table-filter">Filtrar tabela</Label>
              <Input
                id="table-filter" placeholder="ex: app_metrics"
                value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button onClick={load} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleReset} disabled={resetting} size="sm" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Zerar janela
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={displayed.length === 0}>
                  <Download className="h-4 w-4 mr-2" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={exportCSV}>Tabela atual · CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportJSON}>Tabela atual · JSON</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportFingerprintCSV} disabled={fingerprintExportRows.length === 0}>
                  Fingerprints + evolução · CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportFingerprintJSON} disabled={fingerprintExportRows.length === 0}>
                  Fingerprints + evolução · JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={copyShareLink}>
              <Link2 className="h-4 w-4 mr-2" /> Copiar link
            </Button>


            <div className="flex items-center gap-2 ml-2 rounded-md border px-3 py-1.5">
              <Switch
                id="group-fp"
                checked={groupByFingerprint}
                onCheckedChange={setGroupByFingerprint}
              />
              <Label htmlFor="group-fp" className="text-xs cursor-pointer">
                Agrupar por fingerprint
              </Label>
            </div>

            {statsSince && (
              <div className="text-xs text-muted-foreground ml-auto">
                Janela desde <strong>{new Date(statsSince).toLocaleString('pt-BR')}</strong>
                {windowSeconds != null && (
                  <> ({(windowSeconds / 3600).toFixed(1)} h)</>
                )}
                {' · '}
                Tempo acumulado (top {displayed.length}): <strong>{fmtMs(totalMsAll)}</strong>
              </div>
            )}
          </div>


          <p className="text-xs text-muted-foreground mt-3">
            <strong>Nota:</strong> <code>pg_stat_statements</code> é cumulativo desde o último reset —
            não há filtro por intervalo arbitrário. Use “Zerar janela” para começar uma nova medição
            (ex: antes de um deploy, para comparar antes/depois).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visões salvas</CardTitle>
        </CardHeader>
        <CardContent>
          <SavedViewsBar current={currentView} onApply={applyView} />
        </CardContent>
      </Card>

      <AutoSnapshotConfigCard />

      <SnapshotsPanel snapshots={snapshots} loading={snapshotsLoading} reload={reloadSnapshots} />


      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Resultado ({displayed.length}){groupByFingerprint ? ' — agrupado por fingerprint' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Op</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="text-right">Chamadas</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead className="text-right">Máx</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">% total</TableHead>
                  <TableHead>{groupByFingerprint ? 'Fingerprint' : 'Query'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma consulta encontrada com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((r, localIdx) => {
                  const i = pageStart + localIdx;
                  const op = inferOp(r.query);
                  const table = inferTable(r.query);
                  const pct = totalMsAll > 0 ? (r.total_exec_ms / totalMsAll) * 100 : 0;
                  const isOpen = expanded.has(i);
                  const display = groupByFingerprint
                    ? shortFingerprint(r.fingerprint, 100)
                    : firstLine(r.query, 100);
                  return (
                    <React.Fragment key={i}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(i)}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <Badge variant={OP_VARIANT[op]} className="text-xs">{op}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{table}</TableCell>
                        <TableCell className="text-right">
                          {fmtInt(r.calls)}
                          {groupByFingerprint && r.variant_count > 1 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({r.variant_count}v)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{fmtMs(r.mean_exec_ms)}</TableCell>
                        <TableCell className="text-right">
                          <span className={r.max_exec_ms > 200 ? 'text-destructive font-medium' : ''}>
                            {fmtMs(r.max_exec_ms)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtMs(r.total_exec_ms)}</TableCell>
                        <TableCell className="text-right text-xs">{pct.toFixed(1)}%</TableCell>
                        <TableCell className="max-w-md truncate font-mono text-xs">
                          {display}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/30">
                            <div className="space-y-2 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  min {fmtMs(r.min_exec_ms)} · stddev {fmtMs(r.stddev_exec_ms)} ·
                                  {' '}rows {fmtInt(r.rows_returned)} ·
                                  {' '}cache hit {fmtInt(r.shared_blks_hit)} / read {fmtInt(r.shared_blks_read)}
                                  {groupByFingerprint && <> · variantes: <strong>{r.variant_count}</strong></>}
                                </span>
                                <Button
                                  size="sm" variant="ghost" className="ml-auto h-7"
                                  onClick={(e) => { e.stopPropagation(); openExplain(r.query); }}
                                >
                                  <FileSearch className="h-3 w-3 mr-1" /> EXPLAIN
                                </Button>
                                <Button
                                  size="sm" variant="ghost" className="h-7"
                                  onClick={(e) => { e.stopPropagation(); void copyQuery(r.query); }}
                                >
                                  <Copy className="h-3 w-3 mr-1" /> Copiar query
                                </Button>
                              </div>
                              {groupByFingerprint && (
                                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap break-all">
                                  <span className="text-muted-foreground">fingerprint:</span> {r.fingerprint}
                                </pre>
                              )}
                              {groupByFingerprint ? (
                                <FingerprintDrilldown
                                  fingerprint={r.fingerprint}
                                  variants={rows
                                    .filter((x) => fingerprintQuery(x.query) === r.fingerprint)
                                    .map((x) => ({
                                      query: x.query,
                                      calls: x.calls,
                                      total_exec_ms: x.total_exec_ms,
                                      mean_exec_ms: x.mean_exec_ms,
                                      max_exec_ms: x.max_exec_ms,
                                    }))
                                    .sort((a, b) => b.total_exec_ms - a.total_exec_ms)}
                                  snapshots={snapshots}
                                />
                              ) : (
                                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap break-all">
                                  {r.query}
                                </pre>
                              )}
                            </div>

                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {displayed.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Mostrando {pageStart + 1}–{Math.min(pageEnd, displayed.length)} de {displayed.length}
              </span>
              <div className="flex items-center gap-1 ml-2">
                <Label htmlFor="page-size" className="text-xs">Por página</Label>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger id="page-size" className="h-7 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100, 200, 500].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Button size="sm" variant="outline" className="h-7 px-2"
                  disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="px-2">Página {page} / {totalPages}</span>
                <Button size="sm" variant="outline" className="h-7 px-2"
                  disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ExplainDialog open={explainOpen} onOpenChange={setExplainOpen} initialQuery={explainQuery} />
    </div>
  );
}

