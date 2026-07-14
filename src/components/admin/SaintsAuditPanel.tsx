import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/constants';

interface AuditRow {
  id: number;
  saint_id: string;
  action: 'insert' | 'update' | 'delete';
  changed_by: string | null;
  changed_at: string;
  old_full_bio: string | null;
  new_full_bio: string | null;
  old_prayer: string | null;
  new_prayer: string | null;
  old_last_scraped_at: string | null;
  new_last_scraped_at: string | null;
  old_content_hash: string | null;
  new_content_hash: string | null;
  old_source_url: string | null;
  new_source_url: string | null;
}

const ACTION_COLORS: Record<AuditRow['action'], string> = {
  insert: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  update: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  delete: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
const preview = (s: string | null, n = 140) => {
  if (!s) return <span className="text-muted-foreground italic">(vazio)</span>;
  const t = s.trim().replace(/\s+/g, ' ');
  return <span>{t.length > n ? `${t.slice(0, n)}…` : t}</span>;
};

const DiffField: React.FC<{ label: string; oldVal: string | null; newVal: string | null }> = ({ label, oldVal, newVal }) => {
  if (oldVal === newVal) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 mb-1">Antes</p>
          <p className="text-sm whitespace-pre-wrap">{preview(oldVal, 800)}</p>
        </div>
        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">Depois</p>
          <p className="text-sm whitespace-pre-wrap">{preview(newVal, 800)}</p>
        </div>
      </div>
    </div>
  );
};

const SaintsAuditPanel: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saints_audit' as any)
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(200);
    setLoading(false);
    if (!error) setRows((data || []) as unknown as AuditRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) => r.saint_id.toLowerCase().includes(q) || r.action.includes(q));
  }, [rows, filter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icons.History className="w-4 h-4" /> Auditoria de alterações
          <Badge variant="outline" className="ml-2 text-[10px]">últimas {rows.length}</Badge>
        </CardTitle>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Filtrar por id ou ação…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-56"
          />
          <Button variant="ghost" size="sm" onClick={load}>
            <Icons.RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma alteração registrada ainda. As próximas edições e reimports aparecerão aqui.
          </p>
        ) : (
          <div className="divide-y max-h-[420px] overflow-y-auto -mx-2">
            {filtered.map((r) => {
              const changed: string[] = [];
              if (r.old_full_bio !== r.new_full_bio) changed.push('full_bio');
              if (r.old_prayer !== r.new_prayer) changed.push('oração');
              if (r.old_source_url !== r.new_source_url) changed.push('fonte');
              if (r.old_content_hash !== r.new_content_hash) changed.push('hash');
              if (r.old_last_scraped_at !== r.new_last_scraped_at) changed.push('scraped_at');
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full text-left px-2 py-2 hover:bg-muted/50 flex items-center gap-3"
                >
                  <Badge className={`${ACTION_COLORS[r.action]} border text-[10px] uppercase`} variant="outline">
                    {r.action}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {r.saint_id}
                      {changed.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {changed.join(', ')}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmt(r.changed_at)}
                      {r.new_last_scraped_at && ` · scraped: ${fmt(r.new_last_scraped_at)}`}
                    </p>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={`${selected ? ACTION_COLORS[selected.action] : ''} border text-[10px] uppercase`} variant="outline">
                {selected?.action}
              </Badge>
              {selected?.saint_id}
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {selected && fmt(selected.changed_at)}
              </span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-black uppercase tracking-widest text-muted-foreground">last_scraped_at</p>
                  <p>{fmt(selected.old_last_scraped_at)} → <span className="font-bold">{fmt(selected.new_last_scraped_at)}</span></p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-muted-foreground">content_hash</p>
                  <p className="font-mono text-[10px] break-all">
                    {selected.old_content_hash?.slice(0, 12) || '—'} → <span className="font-bold">{selected.new_content_hash?.slice(0, 12) || '—'}</span>
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-black uppercase tracking-widest text-muted-foreground">source_url</p>
                  <p className="break-all">
                    {selected.old_source_url || '—'} → <span className="font-bold">{selected.new_source_url || '—'}</span>
                  </p>
                </div>
              </div>
              <DiffField label="full_bio" oldVal={selected.old_full_bio} newVal={selected.new_full_bio} />
              <DiffField label="Oração" oldVal={selected.old_prayer} newVal={selected.new_prayer} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SaintsAuditPanel;
