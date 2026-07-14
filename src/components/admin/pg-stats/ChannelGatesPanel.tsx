import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ChannelMetrics {
  succeeded: number;
  failed: number;
  total: number;
  fail_rate: number;
  earliest_failed_at: string | null;
  last_failed_at: string | null;
}

interface ChannelGate {
  channel: string;
  enabled: boolean;
  blocked: boolean;
  max_fail_rate: number;
  window_minutes: number;
  min_samples: number;
  max_attempts_default: number;
  metrics: ChannelMetrics;
  eta_unblock_at: string | null;
  reason: string | null;
}

interface Overview {
  generated_at: string;
  channels: ChannelGate[];
}

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtDateTime = (v: string | null) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return v;
  }
};

function etaRelative(iso: string | null): string {
  if (!iso) return '—';
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'a qualquer momento';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `em ~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `em ~${h}h${m ? ` ${m}min` : ''}`;
}

export function ChannelGatesPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc('admin_notif_channel_gates_overview');
      if (error) throw error;
      setData(res as unknown as Overview);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao carregar gates: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const channels = data?.channels ?? [];
  const blockedCount = channels.filter((c) => c.blocked).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            {blockedCount > 0 ? (
              <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
            ) : (
              <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden />
            )}
            Gates de canais de notificação
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {blockedCount > 0
              ? `${blockedCount} canal(is) bloqueado(s) por excesso de falhas na janela.`
              : 'Todos os canais operacionais.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} aria-label="Recarregar gates">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? 'Carregando…' : 'Nenhum canal configurado.'}
          </p>
        ) : (
          <div className="space-y-3">
            {channels.map((c) => (
              <div
                key={c.channel}
                className={`rounded-md border p-3 ${
                  c.blocked ? 'border-destructive/40 bg-destructive/5' : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{c.channel}</span>
                    {c.blocked ? (
                      <Badge variant="destructive">bloqueado</Badge>
                    ) : (
                      <Badge variant="secondary">operacional</Badge>
                    )}
                    {!c.enabled && <Badge variant="outline">desabilitado</Badge>}
                  </div>
                  {c.blocked && c.eta_unblock_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden />
                      Libera {etaRelative(c.eta_unblock_at)} ({fmtDateTime(c.eta_unblock_at)})
                    </div>
                  )}
                </div>

                {c.reason && (
                  <p className="mt-2 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded px-2 py-1">
                    {c.reason}
                  </p>
                )}

                <dl className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Fail rate atual</dt>
                    <dd className={c.blocked ? 'font-semibold text-destructive' : 'font-medium'}>
                      {fmtPct(c.metrics.fail_rate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Limite</dt>
                    <dd className="font-medium">{fmtPct(c.max_fail_rate)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Amostras (janela)</dt>
                    <dd className="font-medium">
                      {c.metrics.total} <span className="text-muted-foreground">/ min {c.min_samples}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Janela</dt>
                    <dd className="font-medium">{c.window_minutes} min</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sucessos</dt>
                    <dd className="font-medium">{c.metrics.succeeded}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Falhas</dt>
                    <dd className="font-medium">{c.metrics.failed}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Última falha</dt>
                    <dd className="font-medium">{fmtDateTime(c.metrics.last_failed_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">max_attempts padrão</dt>
                    <dd className="font-medium">{c.max_attempts_default}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
        {data?.generated_at && (
          <p className="mt-3 text-[10px] text-muted-foreground">
            Gerado em {fmtDateTime(data.generated_at)} · atualiza a cada 30s
          </p>
        )}
      </CardContent>
    </Card>
  );
}
