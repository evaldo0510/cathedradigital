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
import { RefreshCw, RotateCcw, Copy, FileSearch, Download } from 'lucide-react';
import { SavedViewsBar, type PgStatViewConfig } from '@/components/admin/pg-stats/SavedViewsBar';
import { SnapshotsPanel } from '@/components/admin/pg-stats/SnapshotsPanel';
import { ExplainDialog } from '@/components/admin/pg-stats/ExplainDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [rows, setRows] = useState<StatRow[]>([]);
  const [orderBy, setOrderBy] = useState<OrderBy>('total_exec_time');
  const [limit, setLimit] = useState<number>(25);
  const [minCalls, setMinCalls] = useState<number>(1);
  const [tableFilter, setTableFilter] = useState<string>('');
  const [opFilter, setOpFilter] = useState<'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainQuery, setExplainQuery] = useState('');

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

            {statsSince && (
              <div className="text-xs text-muted-foreground ml-auto">
                Janela desde <strong>{new Date(statsSince).toLocaleString('pt-BR')}</strong>
                {windowSeconds != null && (
                  <> ({(windowSeconds / 3600).toFixed(1)} h)</>
                )}
                {' · '}
                Tempo acumulado (top {filtered.length}): <strong>{fmtMs(totalMsAll)}</strong>
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
          <CardTitle className="text-base">Resultado ({filtered.length})</CardTitle>
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
                  <TableHead>Query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma consulta encontrada com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r, i) => {
                  const op = inferOp(r.query);
                  const table = inferTable(r.query);
                  const pct = totalMsAll > 0 ? (r.total_exec_ms / totalMsAll) * 100 : 0;
                  const isOpen = expanded.has(i);
                  return (
                    <React.Fragment key={i}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(i)}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <Badge variant={OP_VARIANT[op]} className="text-xs">{op}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{table}</TableCell>
                        <TableCell className="text-right">{fmtInt(r.calls)}</TableCell>
                        <TableCell className="text-right">{fmtMs(r.mean_exec_ms)}</TableCell>
                        <TableCell className="text-right">
                          <span className={r.max_exec_ms > 200 ? 'text-destructive font-medium' : ''}>
                            {fmtMs(r.max_exec_ms)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtMs(r.total_exec_ms)}</TableCell>
                        <TableCell className="text-right text-xs">{pct.toFixed(1)}%</TableCell>
                        <TableCell className="max-w-md truncate font-mono text-xs">
                          {firstLine(r.query, 100)}
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
                                </span>
                                <Button
                                  size="sm" variant="ghost" className="ml-auto h-7"
                                  onClick={(e) => { e.stopPropagation(); void copyQuery(r.query); }}
                                >
                                  <Copy className="h-3 w-3 mr-1" /> Copiar query
                                </Button>
                              </div>
                              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap break-all">
                                {r.query}
                              </pre>
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
        </CardContent>
      </Card>
    </div>
  );
}
