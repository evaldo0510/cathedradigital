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
import { AlertTriangle, RefreshCcw, RotateCcw, FileText, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
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
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const EditorialClosureRuns: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<LogRow[]>([]);
  const [openRunId, setOpenRunId] = React.useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = React.useState<RunSummary | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = React.useState('');
  const [rollingBack, setRollingBack] = React.useState(false);

  const [sortKey, setSortKey] = React.useState<SortKey>('started_at');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(25);

  const load = React.useCallback(async () => {
    setLoading(true);
    // Últimas 2000 linhas — suficiente para o painel; agrupamento é feito no cliente.
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

  const sortedRuns = React.useMemo(() => {
    const arr = [...runs];
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
  }, [runs, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRuns.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  React.useEffect(() => { setPage(1); }, [sortKey, sortDir, pageSize, runs.length]);

  const pagedRuns = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRuns.slice(start, start + pageSize);
  }, [sortedRuns, currentPage, pageSize]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'started_at' ? 'desc' : 'desc');
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="inline h-3 w-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="inline h-3 w-3" />
      : <ArrowDown className="inline h-3 w-3" />;
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead className="text-right">Linhas</TableHead>
                  <TableHead>Entidades</TableHead>
                  <TableHead className="text-right">Warnings</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
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
