/**
 * /admin/editorial-closure-runs
 *
 * Painel admin: lista runs de `migrate_editorial_closure_legacy`
 * (agrupadas por run_id em editorial_closure_migration_log),
 * abre diff antes/depois por linha e permite disparar rollback
 * via RPC `rollback_editorial_closure_migration` com confirmação.
 *
 * Cross-refs auditoria em governance_audit_log via correlation_id = run_id.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, RefreshCcw, RotateCcw, FileText, ArrowUp, ArrowDown, ChevronsUpDown, Download, Search, X } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type LogRow = {
  id: string;
  run_id: string | null;
  entity_table: string;
  entity_id: string;
  strategy: string;
  before_value: unknown;
  after_value: unknown;
  warnings: string[];
  dry_run: boolean;
  actor: string | null;
  created_at: string;
};

type RunSummary = {
  run_id: string;
  started_at: string;
  ended_at: string;
  dry_run: boolean;
  actor: string | null;
  total_rows: number;
  entities: Record<string, number>;
  warnings: number;
  strategies: Record<string, number>;
};

function groupRuns(rows: LogRow[]): RunSummary[] {
  const map = new Map<string, RunSummary>();
  for (const r of rows) {
    if (!r.run_id) continue;
    const cur = map.get(r.run_id) ?? {
      run_id: r.run_id,
      started_at: r.created_at,
      ended_at: r.created_at,
      dry_run: r.dry_run,
      actor: r.actor,
      total_rows: 0,
      entities: {},
      warnings: 0,
      strategies: {},
    };
    cur.total_rows += 1;
    cur.entities[r.entity_table] = (cur.entities[r.entity_table] ?? 0) + 1;
    cur.strategies[r.strategy] = (cur.strategies[r.strategy] ?? 0) + 1;
    cur.warnings += Array.isArray(r.warnings) ? r.warnings.length : 0;
    if (r.created_at < cur.started_at) cur.started_at = r.created_at;
    if (r.created_at > cur.ended_at) cur.ended_at = r.created_at;
    map.set(r.run_id, cur);
  }
  return Array.from(map.values()).sort((a, b) =>
    b.started_at.localeCompare(a.started_at),
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short', timeStyle: 'medium',
    });
  } catch { return iso; }
}

function prettyJSON(v: unknown): string {
  if (v == null) return '—';
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

type SortKey = 'started_at' | 'total_rows' | 'warnings' | 'dry_run';
type SortDir = 'asc' | 'desc';
type ModeFilter = 'all' | 'dry_run' | 'applied';
type WarnFilter = 'all' | 'none' | 'any' | 'high';
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const SORT_KEYS: SortKey[] = ['started_at', 'total_rows', 'warnings', 'dry_run'];

function downloadFile(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function runsToCSV(list: RunSummary[]): string {
  const header = ['run_id', 'started_at', 'ended_at', 'mode', 'actor', 'total_rows', 'entities', 'strategies', 'warnings'];
  const lines = list.map((r) => [
    r.run_id,
    r.started_at,
    r.ended_at,
    r.dry_run ? 'dry_run' : 'applied',
    r.actor ?? '',
    r.total_rows,
    Object.entries(r.entities).map(([k, v]) => `${k}:${v}`).join('|'),
    Object.entries(r.strategies).map(([k, v]) => `${k}:${v}`).join('|'),
    r.warnings,
  ].map(csvEscape).join(','));
  return [header.join(','), ...lines].join('\n');
}

const EditorialClosureRuns: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<LogRow[]>([]);
  const [openRunId, setOpenRunId] = React.useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = React.useState<RunSummary | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = React.useState('');
  const [rollingBack, setRollingBack] = React.useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const sortKey: SortKey = (SORT_KEYS as string[]).includes(searchParams.get('sort') ?? '')
    ? (searchParams.get('sort') as SortKey)
    : 'started_at';
  const sortDir: SortDir = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(
    Number(searchParams.get('size')),
  ) ? Number(searchParams.get('size')) : 25;
  const modeFilter: ModeFilter = (['all', 'dry_run', 'applied'] as const).includes(
    (searchParams.get('mode') as ModeFilter) ?? 'all',
  ) ? (searchParams.get('mode') as ModeFilter) : 'all';
  const strategyFilter = searchParams.get('strategy') ?? 'all';
  const warnFilter: WarnFilter = (['all', 'none', 'any', 'high'] as const).includes(
    (searchParams.get('warn') as WarnFilter) ?? 'all',
  ) ? (searchParams.get('warn') as WarnFilter) : 'all';
  const query = searchParams.get('q') ?? '';

  const updateParams = React.useCallback((patch: Record<string, string | number | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '' || v === 'all') next.delete(k);
        else next.set(k, String(v));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('editorial_closure_migration_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) {
      toast({ title: 'Falha ao carregar logs', description: error.message, variant: 'destructive' });
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as LogRow[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const runs = React.useMemo(() => groupRuns(rows), [rows]);

  const allStrategies = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of runs) for (const k of Object.keys(r.strategies)) set.add(k);
    return Array.from(set).sort();
  }, [runs]);

  const filteredRuns = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      if (modeFilter === 'dry_run' && !r.dry_run) return false;
      if (modeFilter === 'applied' && r.dry_run) return false;
      if (strategyFilter !== 'all' && !r.strategies[strategyFilter]) return false;
      if (warnFilter === 'none' && r.warnings !== 0) return false;
      if (warnFilter === 'any' && r.warnings === 0) return false;
      if (warnFilter === 'high' && r.warnings < 5) return false;
      if (q && !r.run_id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [runs, modeFilter, strategyFilter, warnFilter, query]);

  const sortedRuns = React.useMemo(() => {
    const arr = [...filteredRuns];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'started_at': cmp = a.started_at.localeCompare(b.started_at); break;
        case 'total_rows': cmp = a.total_rows - b.total_rows; break;
        case 'warnings': cmp = a.warnings - b.warnings; break;
        case 'dry_run': cmp = Number(a.dry_run) - Number(b.dry_run); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filteredRuns, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRuns.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedRuns = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRuns.slice(start, start + pageSize);
  }, [sortedRuns, currentPage, pageSize]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      updateParams({ order: sortDir === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      updateParams({ sort: key, order: 'desc', page: 1 });
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="inline h-3 w-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="inline h-3 w-3" />
      : <ArrowDown className="inline h-3 w-3" />;
  }

  function exportRuns(format: 'csv' | 'json') {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = `editorial-closure-runs-p${currentPage}-${stamp}`;
    if (format === 'csv') {
      downloadFile(`${base}.csv`, 'text/csv;charset=utf-8', runsToCSV(pagedRuns));
    } else {
      downloadFile(`${base}.json`, 'application/json', JSON.stringify(pagedRuns, null, 2));
    }
  }

  const activeFilterCount =
    (modeFilter !== 'all' ? 1 : 0) +
    (strategyFilter !== 'all' ? 1 : 0) +
    (warnFilter !== 'all' ? 1 : 0) +
    (query ? 1 : 0);

  function clearFilters() {
    updateParams({ mode: null, strategy: null, warn: null, q: null, page: 1 });
  }

  const openRun = React.useMemo(
    () => (openRunId ? rows.filter((r) => r.run_id === openRunId) : []),
    [rows, openRunId],
  );


  async function doRollback() {
    if (!rollbackTarget) return;
    if (rollbackConfirm.trim().toUpperCase() !== 'REVERTER') {
      toast({ title: 'Digite REVERTER para confirmar', variant: 'destructive' });
      return;
    }
    setRollingBack(true);
    const { data, error } = await supabase.rpc(
      'rollback_editorial_closure_migration',
      { _run_id: rollbackTarget.run_id },
    );
    setRollingBack(false);
    if (error) {
      toast({ title: 'Rollback falhou', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Rollback executado',
      description: `Run ${rollbackTarget.run_id.slice(0, 8)}… revertida. ${prettyJSON(data)}`,
    });
    setRollbackTarget(null);
    setRollbackConfirm('');
    await load();
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet>
        <title>Runs de Migração Editorial · Cathedra Admin</title>
      </Helmet>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif">Runs de Migração Editorial</h1>
          <p className="text-muted-foreground mt-1">
            Histórico de execuções de <code>migrate_editorial_closure_legacy</code>,
            diff antes/depois e rollback por <code>run_id</code>.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {loading ? 'Carregando…' : `${runs.length} run(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma run registrada. Execute o CLI{' '}
              <code>bun scripts/migrate-editorial-closure.ts</code> para popular este painel.
            </p>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort('started_at')}
                    >
                      Início <SortIcon k="started_at" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort('dry_run')}
                    >
                      Modo <SortIcon k="dry_run" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort('total_rows')}
                    >
                      Linhas <SortIcon k="total_rows" />
                    </button>
                  </TableHead>
                  <TableHead>Entidades</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort('warnings')}
                    >
                      Warnings <SortIcon k="warnings" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRuns.map((r) => (
                  <TableRow key={r.run_id}>
                    <TableCell className="font-mono text-xs">
                      {r.run_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(r.started_at)}</TableCell>
                    <TableCell>
                      <Badge variant={r.dry_run ? 'secondary' : 'default'}>
                        {r.dry_run ? 'dry-run' : 'aplicada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.total_rows}</TableCell>
                    <TableCell className="text-xs">
                      {Object.entries(r.entities).map(([k, v]) => (
                        <span key={k} className="mr-2">
                          <span className="text-muted-foreground">{k}:</span> {v}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.warnings > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {r.warnings}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenRunId(r.run_id)}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        Diff
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={r.dry_run}
                        title={r.dry_run ? 'Dry-run não altera dados' : 'Reverter mudanças'}
                        onClick={() => setRollbackTarget(r)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Rollback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Linhas por página</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => updateParams({ size: Number(v), page: 1 })}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>
                  {sortedRuns.length === 0
                    ? '0 de 0'
                    : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sortedRuns.length)} de ${sortedRuns.length}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm" variant="outline"
                  onClick={() => setPage(1)}
                  disabled={currentPage <= 1}
                >« Primeira</Button>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >‹ Anterior</Button>
                <span className="tabular-nums text-muted-foreground px-2">
                  Página {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >Próxima ›</Button>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >Última »</Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diff detail */}
      <Dialog open={openRunId !== null} onOpenChange={(o) => !o && setOpenRunId(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              Run {openRunId?.slice(0, 8)}… — {openRun.length} linha(s)
            </DialogTitle>
            <DialogDescription>
              Diff antes/depois por entidade. Warnings destacados em vermelho.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {openRun.map((r) => (
              <div key={r.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{r.entity_table}</Badge>
                    <span className="font-mono">{r.entity_id}</span>
                    <Badge variant="secondary">{r.strategy}</Badge>
                  </div>
                  <span className="text-muted-foreground">{fmtDate(r.created_at)}</span>
                </div>
                {Array.isArray(r.warnings) && r.warnings.length > 0 && (
                  <ul className="text-xs text-destructive list-disc list-inside">
                    {r.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Antes</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-64">
{prettyJSON(r.before_value)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Depois</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-64">
{prettyJSON(r.after_value)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rollback confirmation */}
      <Dialog
        open={rollbackTarget !== null}
        onOpenChange={(o) => { if (!o) { setRollbackTarget(null); setRollbackConfirm(''); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reverter run {rollbackTarget?.run_id.slice(0, 8)}…?
            </DialogTitle>
            <DialogDescription>
              Restaura o <code>editorial_closure</code> anterior de{' '}
              <strong>{rollbackTarget?.total_rows}</strong> linha(s) em{' '}
              {Object.keys(rollbackTarget?.entities ?? {}).length} entidade(s).
              Conflitos (registros já modificados após a run) são registrados na auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">
              Digite <strong>REVERTER</strong> para confirmar:
            </label>
            <Input
              value={rollbackConfirm}
              onChange={(e) => setRollbackConfirm(e.target.value)}
              placeholder="REVERTER"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRollbackTarget(null); setRollbackConfirm(''); }}
              disabled={rollingBack}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={doRollback} disabled={rollingBack}>
              {rollingBack ? 'Revertendo…' : 'Confirmar rollback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditorialClosureRuns;
