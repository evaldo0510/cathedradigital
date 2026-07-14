import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/constants';
import { toast } from 'sonner';

interface RunRow {
  id: string;
  created_at: string;
  source: 'cron' | 'manual';
  status: 'pending_approval' | 'applied' | 'rejected' | 'failed';
  ttl_days: number;
  summary: { considered?: number; would_update?: number; unchanged?: number; failed?: number };
  preview: Array<{ id: string; name: string | null; source_url: string; reason: string; old_hash: string | null; new_hash: string | null }>;
  approved_at: string | null;
  applied_summary: { targets?: number; applied?: number; failed?: number } | null;
}

const STATUS_COLORS: Record<RunRow['status'], string> = {
  pending_approval: 'border-amber-500/40 text-amber-700 dark:text-amber-300',
  applied: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-muted-foreground/30 text-muted-foreground',
  failed: 'border-red-500/40 text-red-700 dark:text-red-300',
};

const REASON_LABEL: Record<string, string> = {
  would_fill_full_bio: 'preenche full_bio',
  would_update: 'hash mudou',
  fetch_failed: 'fetch falhou',
  unchanged: 'sem mudança',
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');

const SaintsReimportRunsPanel: React.FC<{ onApplied?: () => void }> = ({ onApplied }) => {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saints_reimport_runs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setLoading(false);
    if (!error) setRows((data || []) as unknown as RunRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (runId: string, action: 'apply' | 'reject') => {
    if (action === 'apply' && !confirm('Aplicar este run e reimportar os santos listados?')) return;
    setBusy(runId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-apply-saints-reimport-run', {
        body: { run_id: runId, action },
      });
      if (error) throw error;
      if (action === 'apply') {
        toast.success('Run aplicado', { description: `Atualizados: ${data?.applied ?? 0} · Falhas: ${data?.failed ?? 0}` });
        onApplied?.();
      } else {
        toast.info('Run rejeitado');
      }
      load();
    } catch (e: any) {
      toast.error('Falha na ação', { description: e?.message ?? String(e) });
    } finally {
      setBusy(null);
    }
  };

  const pending = rows.filter(r => r.status === 'pending_approval');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icons.Clock className="w-4 h-4" /> Runs agendados de reimport
          {pending.length > 0 && (
            <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
              {pending.length} aguardando aprovação
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">Cron diário 03:00 UTC · dry-run</span>
          <Button variant="ghost" size="sm" onClick={load}>
            <Icons.RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há runs registrados. O cron diário criará um dry-run automaticamente às 03:00 UTC.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const open = expanded === r.id;
              return (
                <div key={r.id} className="border rounded-md">
                  <div className="flex items-center gap-3 p-3 flex-wrap">
                    <Badge variant="outline" className={`${STATUS_COLORS[r.status]} text-[10px] uppercase`}>
                      {r.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">{r.source}</Badge>
                    <div className="text-xs text-muted-foreground">{fmt(r.created_at)}</div>
                    <div className="text-xs ml-auto">
                      considerados: <b>{r.summary?.considered ?? 0}</b> ·
                      atualizariam: <b className="text-blue-600 dark:text-blue-400">{r.summary?.would_update ?? 0}</b> ·
                      inalterados: {r.summary?.unchanged ?? 0} ·
                      falhas: {r.summary?.failed ?? 0}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(open ? null : r.id)}>
                      {open ? 'Recolher' : 'Ver prévia'}
                    </Button>
                    {r.status === 'pending_approval' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => act(r.id, 'apply')}
                          disabled={busy === r.id || (r.summary?.would_update ?? 0) === 0}
                        >
                          {busy === r.id ? 'Aplicando…' : `Aplicar (${r.summary?.would_update ?? 0})`}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(r.id, 'reject')}
                          disabled={busy === r.id}
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {r.applied_summary && (
                      <span className="text-[11px] text-muted-foreground">
                        aplicado {fmt(r.approved_at)} · {r.applied_summary.applied}/{r.applied_summary.targets} ok · {r.applied_summary.failed} falhas
                      </span>
                    )}
                  </div>
                  {open && (
                    <div className="border-t divide-y max-h-72 overflow-y-auto text-sm">
                      {(r.preview || []).length === 0 && (
                        <p className="p-3 text-muted-foreground text-sm">Prévia vazia.</p>
                      )}
                      {(r.preview || []).map((p) => (
                        <div key={p.id} className="py-2 px-3 flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={
                              p.reason === 'would_fill_full_bio' ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' :
                              p.reason === 'would_update' ? 'border-blue-500/40 text-blue-700 dark:text-blue-300' :
                              p.reason === 'fetch_failed' ? 'border-red-500/40 text-red-700 dark:text-red-300' :
                              'border-border text-muted-foreground'
                            }
                          >
                            {REASON_LABEL[p.reason] || p.reason}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{p.name || p.id}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{p.source_url}</p>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            {(p.old_hash || '—').slice(0, 8)} → {(p.new_hash || '—').slice(0, 8)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SaintsReimportRunsPanel;
