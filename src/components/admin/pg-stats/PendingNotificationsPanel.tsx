import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, Eye, RotateCw, AlertTriangle, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface QueueRow {
  id: string;
  channel: 'webhook' | 'slack';
  target_url: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'in_flight' | 'succeeded' | 'failed';
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  last_attempt_at: string | null;
  last_error: string | null;
  last_status_code: number | null;
  last_request_id: number | null;
  created_at: string;
  succeeded_at: string | null;
}

interface AttemptRow {
  id: string;
  attempt_no: number;
  event: 'dispatched' | 'succeeded' | 'retry_scheduled' | 'failed';
  status_code: number | null;
  error_msg: string | null;
  next_attempt_at: string | null;
  request_id: number | null;
  created_at: string;
}

interface Stats {
  pending?: number;
  in_flight?: number;
  succeeded?: number;
  failed?: number;
  total?: number;
}

const STATUS_LABEL: Record<QueueRow['status'], string> = {
  pending: 'Pendente',
  in_flight: 'Em voo',
  succeeded: 'Sucesso',
  failed: 'Falhou',
};

const EVENT_LABEL: Record<AttemptRow['event'], string> = {
  dispatched: 'Despachado',
  succeeded: 'Sucesso',
  retry_scheduled: 'Retry',
  failed: 'Falhou',
};

const EVENT_TONE: Record<AttemptRow['event'], string> = {
  dispatched: 'text-foreground',
  succeeded: 'text-emerald-600 dark:text-emerald-400',
  retry_scheduled: 'text-amber-600 dark:text-amber-400',
  failed: 'text-destructive',
};

const PAGE_SIZES = [25, 50, 100, 200];
const EXPORT_PERIODS = [
  { label: 'Últimas 24 h', hours: 24 },
  { label: 'Últimos 7 dias', hours: 168 },
  { label: 'Últimos 30 dias', hours: 720 },
  { label: 'Tudo', hours: 0 },
];

function statusVariant(s: QueueRow['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'failed': return 'destructive';
    case 'succeeded': return 'secondary';
    case 'in_flight': return 'default';
    default: return 'outline';
  }
}

function fmt(dt: string | null): string {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleString('pt-BR'); } catch { return dt; }
}

function truncateUrl(url: string, max = 42): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + '…';
}

function downloadBlob(name: string, data: string, mime = 'application/json') {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PendingNotificationsPanel() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<QueueRow | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [exportPeriodH, setExportPeriodH] = useState<number>(168);
  const [exportChannel, setExportChannel] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        supabase.rpc('admin_list_pending_notifications' as never, {
          p_limit: 500,
          p_status: statusFilter === 'all' ? null : statusFilter,
        } as never),
        supabase.rpc('admin_notif_queue_stats' as never),
      ]);
      if (listRes.error) throw listRes.error;
      if (statsRes.error) throw statsRes.error;
      setRows((listRes.data as unknown as QueueRow[]) ?? []);
      setStats((statsRes.data as unknown as Stats) ?? {});
    } catch (e) {
      toast.error('Falha ao carregar fila de notificações', {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [statusFilter, query, pageSize]);

  const loadAttempts = useCallback(async (id: string) => {
    setAttemptsLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        'admin_list_notification_attempts' as never,
        { p_id: id } as never,
      );
      if (error) throw error;
      setAttempts((data as unknown as AttemptRow[]) ?? []);
    } catch (e) {
      toast.error('Falha ao carregar trilha', { description: (e as Error).message });
      setAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  }, []);

  const openDetail = useCallback((r: QueueRow) => {
    setDetail(r);
    setAttempts([]);
    loadAttempts(r.id);
  }, [loadAttempts]);

  const retry = useCallback(async (id: string) => {
    setRetryingId(id);
    try {
      const { error } = await supabase.rpc('admin_retry_pending_notification' as never, {
        p_id: id,
      } as never);
      if (error) throw error;
      toast.success('Notificação reenfileirada');
      await load();
      if (detail?.id === id) await loadAttempts(id);
    } catch (e) {
      toast.error('Falha ao reprocessar', { description: (e as Error).message });
    } finally {
      setRetryingId(null);
    }
  }, [load, detail?.id, loadAttempts]);

  // client-side filtering (search across channel, target_url, status, request_id, error)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      return (
        r.channel.toLowerCase().includes(q) ||
        r.target_url.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        STATUS_LABEL[r.status].toLowerCase().includes(q) ||
        (r.last_error ?? '').toLowerCase().includes(q) ||
        (r.last_request_id != null && String(r.last_request_id).includes(q)) ||
        (r.last_status_code != null && String(r.last_status_code).includes(q))
      );
    });
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);

  const empty = !loading && filtered.length === 0;
  const hasFailures = (stats.failed ?? 0) > 0;

  const summary = useMemo(() => ([
    { key: 'failed', label: 'Falhas', v: stats.failed ?? 0, tone: 'text-destructive' },
    { key: 'pending', label: 'Pendentes', v: stats.pending ?? 0, tone: 'text-foreground' },
    { key: 'in_flight', label: 'Em voo', v: stats.in_flight ?? 0, tone: 'text-foreground' },
    { key: 'succeeded', label: 'Sucesso', v: stats.succeeded ?? 0, tone: 'text-muted-foreground' },
  ]), [stats]);

  const doExportFailures = useCallback(async () => {
    setExporting(true);
    try {
      // fetch full failure set from server (independent of current statusFilter/page)
      const { data, error } = await supabase.rpc(
        'admin_list_pending_notifications' as never,
        { p_limit: 500, p_status: 'failed' } as never,
      );
      if (error) throw error;
      let items = ((data as unknown as QueueRow[]) ?? []);
      if (exportChannel !== 'all') {
        items = items.filter(r => r.channel === exportChannel);
      }
      if (exportPeriodH > 0) {
        const cutoff = Date.now() - exportPeriodH * 3600 * 1000;
        items = items.filter(r => {
          const ref = new Date(r.last_attempt_at ?? r.created_at).getTime();
          return !Number.isNaN(ref) && ref >= cutoff;
        });
      }

      // enrich with attempts trail per row (parallel, capped)
      const enriched = await Promise.all(items.map(async (r) => {
        const { data: at } = await supabase.rpc(
          'admin_list_notification_attempts' as never,
          { p_id: r.id } as never,
        );
        return {
          id: r.id,
          channel: r.channel,
          target_url: r.target_url,
          status: r.status,
          attempts: r.attempts,
          max_attempts: r.max_attempts,
          created_at: r.created_at,
          last_attempt_at: r.last_attempt_at,
          last_status_code: r.last_status_code,
          last_error: r.last_error,
          last_request_id: r.last_request_id,
          payload: r.payload,
          trail: (at as unknown as AttemptRow[]) ?? [],
        };
      }));

      const payload = {
        exported_at: new Date().toISOString(),
        filters: {
          status: 'failed',
          channel: exportChannel,
          period_hours: exportPeriodH || null,
        },
        count: enriched.length,
        items: enriched,
      };
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(`pg-stat-notif-failures-${ts}.json`, JSON.stringify(payload, null, 2));
      toast.success(`Exportadas ${enriched.length} notificações`);
    } catch (e) {
      toast.error('Falha na exportação', { description: (e as Error).message });
    } finally {
      setExporting(false);
    }
  }, [exportChannel, exportPeriodH]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Fila de notificações
              {hasFailures && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.failed} falhas
                </Badge>
              )}
            </CardTitle>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {summary.map(s => (
                <div key={s.key} className="flex items-baseline gap-1">
                  <span className="text-muted-foreground">{s.label}:</span>
                  <span className={`font-medium ${s.tone}`}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por canal, destino, status, request_id ou erro…"
              className="h-8 pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="failed">Falhas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_flight">Em voo</SelectItem>
              <SelectItem value="succeeded">Sucesso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-[110px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map(n => (
                <SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground">Exportar falhas em JSON:</span>
          <Select value={exportChannel} onValueChange={setExportChannel}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(exportPeriodH)} onValueChange={(v) => setExportPeriodH(Number(v))}>
            <SelectTrigger className="w-[170px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_PERIODS.map(p => (
                <SelectItem key={p.hours} value={String(p.hours)}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" onClick={doExportFailures} disabled={exporting}>
            <Download className={`h-4 w-4 mr-1 ${exporting ? 'animate-pulse' : ''}`} />
            Exportar
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {empty ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {query ? 'Nenhum resultado para a busca atual.' : 'Nenhuma notificação nesta visão.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tent.</TableHead>
                    <TableHead>Próx. tentativa</TableHead>
                    <TableHead>Última tentativa</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>req_id</TableHead>
                    <TableHead>Último erro</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="capitalize">{r.channel}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{STATUS_LABEL[r.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.attempts}/{r.max_attempts}
                      </TableCell>
                      <TableCell className="text-xs">{fmt(r.next_attempt_at)}</TableCell>
                      <TableCell className="text-xs">{fmt(r.last_attempt_at)}</TableCell>
                      <TableCell className="tabular-nums text-xs">
                        {r.last_status_code ?? '—'}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs text-muted-foreground">
                        {r.last_request_id ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-destructive" title={r.last_error ?? ''}>
                        {r.last_error ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground" title={r.target_url}>
                        {truncateUrl(r.target_url)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(r)}
                            aria-label="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retryingId === r.id || r.status === 'succeeded'}
                            onClick={() => retry(r.id)}
                          >
                            <RotateCw className={`h-4 w-4 mr-1 ${retryingId === r.id ? 'animate-spin' : ''}`} />
                            Reprocessar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
              <div>
                {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
                {rows.length !== filtered.length && <> (de {rows.length})</>}
                {' · '}página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Notificação {detail?.channel} — {detail ? STATUS_LABEL[detail.status] : ''}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Destino</div>
                  <div className="break-all font-mono text-xs">{detail.target_url}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tentativas</div>
                  <div className="tabular-nums">{detail.attempts} / {detail.max_attempts}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Próxima tentativa</div>
                  <div>{fmt(detail.next_attempt_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Última tentativa</div>
                  <div>{fmt(detail.last_attempt_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Último status HTTP</div>
                  <div className="tabular-nums">{detail.last_status_code ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">request_id (pg_net)</div>
                  <div className="tabular-nums">{detail.last_request_id ?? '—'}</div>
                </div>
              </div>

              {detail.last_error && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Último erro</div>
                  <pre className="bg-destructive/10 text-destructive text-xs p-3 rounded whitespace-pre-wrap break-all max-h-40 overflow-auto">
{detail.last_error}
                  </pre>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">Trilha de auditoria</div>
                  {attemptsLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                {attempts.length === 0 && !attemptsLoading ? (
                  <div className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded">
                    Nenhuma tentativa registrada ainda.
                  </div>
                ) : (
                  <div className="border rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Quando</TableHead>
                          <TableHead className="text-xs text-right">#</TableHead>
                          <TableHead className="text-xs">Evento</TableHead>
                          <TableHead className="text-xs">HTTP</TableHead>
                          <TableHead className="text-xs">req_id</TableHead>
                          <TableHead className="text-xs">Próx.</TableHead>
                          <TableHead className="text-xs">Erro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attempts.map(a => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs whitespace-nowrap">{fmt(a.created_at)}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{a.attempt_no}</TableCell>
                            <TableCell className={`text-xs font-medium ${EVENT_TONE[a.event]}`}>
                              {EVENT_LABEL[a.event]}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">{a.status_code ?? '—'}</TableCell>
                            <TableCell className="text-xs tabular-nums text-muted-foreground">
                              {a.request_id ?? '—'}
                            </TableCell>
                            <TableCell className="text-xs">{fmt(a.next_attempt_at)}</TableCell>
                            <TableCell className="text-xs text-destructive max-w-[220px] truncate" title={a.error_msg ?? ''}>
                              {a.error_msg ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Payload enviado</div>
                <pre className="bg-muted text-xs p-3 rounded max-h-72 overflow-auto whitespace-pre-wrap break-all">
{JSON.stringify(detail.payload, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>
                <Button
                  disabled={retryingId === detail.id || detail.status === 'succeeded'}
                  onClick={() => retry(detail.id)}
                >
                  <RotateCw className={`h-4 w-4 mr-1 ${retryingId === detail.id ? 'animate-spin' : ''}`} />
                  Reprocessar agora
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
