import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, RefreshCw, Clock } from 'lucide-react';

interface Config {
  enabled: boolean;
  interval_minutes: number;
  retention_days: number;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  consecutive_failures: number;
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

export function AutoSnapshotConfigCard({ onChange }: { onChange?: () => void }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
