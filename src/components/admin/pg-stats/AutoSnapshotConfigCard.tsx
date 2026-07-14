import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, RefreshCw, Clock, AlertTriangle, CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Config {
  enabled: boolean;
  interval_minutes: number;
  retention_days: number;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  consecutive_failures: number;
  notify_webhook_url: string | null;
  notify_slack_webhook_url: string | null;
  last_notified_at: string | null;
  last_notification_error: string | null;
}

const PRESETS = [
  { label: '15 min', v: 15 },
  { label: '30 min', v: 30 },
  { label: '1 h', v: 60 },
  { label: '3 h', v: 180 },
  { label: '6 h', v: 360 },
  { label: '12 h', v: 720 },
  { label: '24 h', v: 1440 },
];

type ChannelKey = 'webhook' | 'slack';

export function AutoSnapshotConfigCard({ onChange }: { onChange?: () => void }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [channelBusy, setChannelBusy] = useState<Record<ChannelKey, 'validate' | 'send' | null>>({ webhook: null, slack: null });
  const [channelFeedback, setChannelFeedback] = useState<Record<ChannelKey, { kind: 'ok' | 'error'; msg: string } | null>>({ webhook: null, slack: null });

  const validateChannel = async (channel: ChannelKey) => {
    if (!cfg) return;
    const url = channel === 'webhook' ? cfg.notify_webhook_url : cfg.notify_slack_webhook_url;
    setChannelBusy((s) => ({ ...s, [channel]: 'validate' }));
    setChannelFeedback((s) => ({ ...s, [channel]: null }));
    try {
      const { data, error } = await supabase.rpc('admin_notif_validate_channel' as never, {
        p_channel: channel, p_url: url ?? '',
      } as never);
      if (error) throw error;
      const res = data as unknown as { valid: boolean; reason: string };
      setChannelFeedback((s) => ({ ...s, [channel]: { kind: res.valid ? 'ok' : 'error', msg: res.reason } }));
      if (res.valid) toast.success(`URL ${channel} válida`);
      else toast.error(`URL ${channel}: ${res.reason}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setChannelFeedback((s) => ({ ...s, [channel]: { kind: 'error', msg } }));
      toast.error(`Validação falhou: ${msg}`);
    } finally {
      setChannelBusy((s) => ({ ...s, [channel]: null }));
    }
  };

  const sendTest = async (channel: ChannelKey) => {
    setChannelBusy((s) => ({ ...s, [channel]: 'send' }));
    try {
      const { data, error } = await supabase.rpc('admin_notif_send_test' as never, { p_channel: channel } as never);
      if (error) throw error;
      const res = data as unknown as { notification_id: string };
      toast.success(`Notificação de teste enfileirada (id ${res.notification_id.slice(0, 8)}). Veja o resultado no painel de notificações abaixo.`);
      onChange?.();
    } catch (e) {
      toast.error(`Envio de teste falhou: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setChannelBusy((s) => ({ ...s, [channel]: null }));
    }
  };


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_pg_stat_snapshot_config' as never);
      if (error) throw error;
      const row = data as unknown as Config | null;
      if (row) setCfg({
        enabled: !!row.enabled,
        interval_minutes: row.interval_minutes ?? 60,
        retention_days: row.retention_days ?? 30,
        last_run_at: row.last_run_at ?? null,
        last_success_at: row.last_success_at ?? null,
        last_error_at: row.last_error_at ?? null,
        last_error_message: row.last_error_message ?? null,
        consecutive_failures: row.consecutive_failures ?? 0,
        notify_webhook_url: row.notify_webhook_url ?? null,
        notify_slack_webhook_url: row.notify_slack_webhook_url ?? null,
        last_notified_at: row.last_notified_at ?? null,
        last_notification_error: row.last_notification_error ?? null,
      });
    } catch (e) {
      toast.error(`Falha ao carregar config: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!cfg) return;
    if (cfg.interval_minutes < 5 || cfg.interval_minutes > 1440) {
      toast.error('Intervalo deve ficar entre 5 e 1440 min.'); return;
    }
    if (cfg.retention_days < 1 || cfg.retention_days > 365) {
      toast.error('Retenção deve ficar entre 1 e 365 dias.'); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_pg_stat_snapshot_config' as never, {
        p_enabled: cfg.enabled,
        p_interval_minutes: cfg.interval_minutes,
        p_retention_days: cfg.retention_days,
        p_notify_webhook_url: cfg.notify_webhook_url,
        p_notify_slack_webhook_url: cfg.notify_slack_webhook_url,
      } as never);
      if (error) throw error;
      toast.success('Configuração salva');
      await load();
      onChange?.();
    } catch (e) {
      toast.error(`Falha ao salvar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Captura automática de snapshots
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!cfg ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            {cfg.last_error_at && (!cfg.last_success_at
                || new Date(cfg.last_error_at).getTime() > new Date(cfg.last_success_at).getTime()) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Captura automática falhou
                  {cfg.consecutive_failures > 1 && <> ({cfg.consecutive_failures}× consecutivas)</>}
                </AlertTitle>
                <AlertDescription className="space-y-1">
                  <div className="text-xs">
                    Última falha em <strong>{new Date(cfg.last_error_at).toLocaleString('pt-BR')}</strong>
                    {cfg.last_success_at && (
                      <> · último sucesso: <strong>{new Date(cfg.last_success_at).toLocaleString('pt-BR')}</strong></>
                    )}
                  </div>
                  {cfg.last_error_message && (
                    <pre className="text-[11px] whitespace-pre-wrap break-all bg-background/40 border rounded p-2 mt-1">
                      {cfg.last_error_message}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {cfg.enabled && cfg.last_success_at
              && (!cfg.last_error_at
                  || new Date(cfg.last_success_at).getTime() >= new Date(cfg.last_error_at).getTime()) && (
              <div className="flex items-center gap-2 text-xs text-primary rounded-md border border-primary/20 bg-primary/5 p-2">
                <CheckCircle2 className="h-4 w-4" />
                Última captura bem-sucedida em{' '}
                <strong>{new Date(cfg.last_success_at).toLocaleString('pt-BR')}</strong>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Ativa</p>
                <p className="text-xs text-muted-foreground">
                  Um snapshot é capturado automaticamente sempre que o intervalo é atingido.
                </p>
              </div>
              <Switch
                checked={cfg.enabled}
                onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="interval">Intervalo (minutos)</Label>
                <Input
                  id="interval" type="number" min={5} max={1440}
                  value={cfg.interval_minutes}
                  onChange={(e) => setCfg({ ...cfg, interval_minutes: Number(e.target.value) || 0 })}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.v} size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => setCfg({ ...cfg, interval_minutes: p.v })}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="retention">Retenção (dias)</Label>
                <Input
                  id="retention" type="number" min={1} max={365}
                  value={cfg.retention_days}
                  onChange={(e) => setCfg({ ...cfg, retention_days: Number(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Snapshots mais antigos são removidos automaticamente.
                </p>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div>
                <p className="text-sm font-medium">Notificações de falha</p>
                <p className="text-xs text-muted-foreground">
                  Ao falhar, um POST JSON é enviado para as URLs configuradas (além do alerta no admin).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['webhook','slack'] as ChannelKey[]).map((ch) => {
                  const value = ch === 'webhook' ? cfg.notify_webhook_url : cfg.notify_slack_webhook_url;
                  const label = ch === 'webhook' ? 'Webhook genérico (POST JSON)' : 'Slack Incoming Webhook';
                  const placeholder = ch === 'webhook' ? 'https://exemplo.com/hook' : 'https://hooks.slack.com/services/…';
                  const fb = channelFeedback[ch];
                  const busy = channelBusy[ch];
                  const hasUrl = !!(value && value.trim());
                  return (
                    <div key={ch} className="space-y-2">
                      <Label htmlFor={`notify-${ch}`} className="text-xs">{label}</Label>
                      <Input
                        id={`notify-${ch}`} type="url" placeholder={placeholder}
                        value={value ?? ''}
                        onChange={(e) => setCfg({
                          ...cfg,
                          ...(ch === 'webhook' ? { notify_webhook_url: e.target.value } : { notify_slack_webhook_url: e.target.value }),
                        })}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => validateChannel(ch)}
                          disabled={!hasUrl || busy !== null}
                        >
                          <ShieldCheck className={`h-3 w-3 mr-1 ${busy === 'validate' ? 'animate-spin' : ''}`} />
                          Validar
                        </Button>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => sendTest(ch)}
                          disabled={!hasUrl || busy !== null}
                          title="Enfileira uma notificação de teste neste canal"
                        >
                          <Send className={`h-3 w-3 mr-1 ${busy === 'send' ? 'animate-spin' : ''}`} />
                          Enviar teste
                        </Button>
                      </div>
                      {fb && (
                        <p className={`text-[11px] ${fb.kind === 'ok' ? 'text-primary' : 'text-destructive'}`}>
                          {fb.msg}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {cfg.last_notification_error && (
                <p className="text-[11px] text-destructive">
                  Última notificação falhou: {cfg.last_notification_error}
                </p>
              )}
              {cfg.last_notified_at && !cfg.last_notification_error && (
                <p className="text-[11px] text-muted-foreground">
                  Última notificação enviada: {new Date(cfg.last_notified_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="ml-auto text-xs text-muted-foreground">
                {cfg.last_run_at
                  ? <>Última execução: <strong>{new Date(cfg.last_run_at).toLocaleString('pt-BR')}</strong></>
                  : 'Ainda não executou.'}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              O agendador roda a cada 5 min e captura sempre que o intervalo configurado é atingido.
              Mínimo prático: 5 min.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
