import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, Eye, RotateCw, AlertTriangle } from 'lucide-react';

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

export function PendingNotificationsPanel() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<QueueRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        supabase.rpc('admin_list_pending_notifications' as never, {
          p_limit: 200,
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

  const retry = useCallback(async (id: string) => {
    setRetryingId(id);
    try {
      const { error } = await supabase.rpc('admin_retry_pending_notification' as never, {
        p_id: id,
      } as never);
      if (error) throw error;
      toast.success('Notificação reenfileirada');
      await load();
    } catch (e) {
      toast.error('Falha ao reprocessar', { description: (e as Error).message });
    } finally {
      setRetryingId(null);
    }
  }, [load]);

  const empty = !loading && rows.length === 0;

  const hasFailures = (stats.failed ?? 0) > 0;

  const summary = useMemo(() => ([
    { key: 'failed', label: 'Falhas', v: stats.failed ?? 0, tone: 'text-destructive' },
    { key: 'pending', label: 'Pendentes', v: stats.pending ?? 0, tone: 'text-foreground' },
    { key: 'in_flight', label: 'Em voo', v: stats.in_flight ?? 0, tone: 'text-foreground' },
    { key: 'succeeded', label: 'Sucesso', v: stats.succeeded ?? 0, tone: 'text-muted-foreground' },
  ]), [stats]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
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
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="failed">Falhas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_flight">Em voo</SelectItem>
              <SelectItem value="succeeded">Sucesso</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma notificação nesta visão.
          </div>
        ) : (
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
                  <TableHead>Último erro</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
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
                    <TableCell className="max-w-[240px] truncate text-xs text-destructive" title={r.last_error ?? ''}>
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
                          onClick={() => setDetail(r)}
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
        )}
      </CardContent>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">
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
