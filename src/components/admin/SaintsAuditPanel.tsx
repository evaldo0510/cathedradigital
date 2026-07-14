import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/constants';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Diff simples por linhas: LCS
function diffLines(a: string, b: string): Array<{ type: 'eq' | 'add' | 'del'; text: string }> {
  const A = (a || '').split(/\r?\n/);
  const B = (b || '').split(/\r?\n/);
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: Array<{ type: 'eq' | 'add' | 'del'; text: string }> = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: 'eq', text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i] }); i++; }
    else { out.push({ type: 'add', text: B[j] }); j++; }
  }
  while (i < n) { out.push({ type: 'del', text: A[i++] }); }
  while (j < m) { out.push({ type: 'add', text: B[j++] }); }
  return out;
}

const DiffView: React.FC<{ label: string; oldVal: string | null; newVal: string | null }> = ({ label, oldVal, newVal }) => {
  if ((oldVal || '') === (newVal || '')) return null;
  const lines = useMemo(() => diffLines(oldVal || '', newVal || ''), [oldVal, newVal]);
  const adds = lines.filter(l => l.type === 'add').length;
  const dels = lines.filter(l => l.type === 'del').length;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300">+{adds}</Badge>
        <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-700 dark:text-red-300">−{dels}</Badge>
      </div>
      <div className="rounded border bg-muted/30 font-mono text-[12px] leading-relaxed max-h-80 overflow-auto">
        {lines.map((l, idx) => (
          <div
            key={idx}
            className={
              l.type === 'add' ? 'bg-emerald-500/10 border-l-2 border-emerald-500 pl-2 pr-2 py-0.5 text-emerald-900 dark:text-emerald-100' :
              l.type === 'del' ? 'bg-red-500/10 border-l-2 border-red-500 pl-2 pr-2 py-0.5 text-red-900 dark:text-red-100 line-through' :
              'pl-3 pr-2 py-0.5 text-muted-foreground'
            }
          >
            <span className="select-none mr-2 opacity-60">
              {l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}
            </span>
            {l.text || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
};

const csvEscape = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
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
      .limit(500);
    setLoading(false);
    if (!error) setRows((data || []) as unknown as AuditRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) => r.saint_id.toLowerCase().includes(q) || r.action.includes(q));
  }, [rows, filter]);

  const exportCsv = () => {
    const header = ['id','saint_id','action','changed_at','changed_by','old_full_bio','new_full_bio','old_prayer','new_prayer','old_last_scraped_at','new_last_scraped_at','old_source_url','new_source_url'];
    const lines = [header.join(',')];
    for (const r of filtered) {
      lines.push([r.id, r.saint_id, r.action, r.changed_at, r.changed_by, r.old_full_bio, r.new_full_bio, r.old_prayer, r.new_prayer, r.old_last_scraped_at, r.new_last_scraped_at, r.old_source_url, r.new_source_url].map(csvEscape).join(','));
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saints-audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exportado (${filtered.length} linhas)`);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Auditoria de Santos', 40, 40);
    doc.setFontSize(10);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · ${filtered.length} registros`, 40, 58);
    const truncate = (s: string | null, n = 180) => (s ? (s.length > n ? s.slice(0, n) + '…' : s) : '—');
    autoTable(doc, {
      startY: 78,
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [11, 31, 58] },
      head: [['Data', 'Santo', 'Ação', 'full_bio (antes → depois)', 'oração (antes → depois)', 'scraped_at']],
      body: filtered.map((r) => [
        fmt(r.changed_at),
        r.saint_id,
        r.action,
        `${truncate(r.old_full_bio, 120)}\n→\n${truncate(r.new_full_bio, 120)}`,
        `${truncate(r.old_prayer, 120)}\n→\n${truncate(r.new_prayer, 120)}`,
        fmt(r.new_last_scraped_at),
      ]),
      columnStyles: {
        0: { cellWidth: 90 }, 1: { cellWidth: 100 }, 2: { cellWidth: 45 },
        3: { cellWidth: 220 }, 4: { cellWidth: 220 }, 5: { cellWidth: 90 },
      },
    });
    doc.save(`saints-audit-${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success(`PDF exportado (${filtered.length} linhas)`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icons.History className="w-4 h-4" /> Auditoria de alterações
          <Badge variant="outline" className="ml-2 text-[10px]">últimas {rows.length}</Badge>
        </CardTitle>
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            placeholder="Filtrar por id ou ação…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-52"
          />
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Icons.Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={filtered.length === 0}>
            <Icons.Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={load}>
            <Icons.RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
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
                  <Badge className={`${ACTION_COLORS[r.action]} border text-[10px] uppercase`} variant="outline">{r.action}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {r.saint_id}
                      {changed.length > 0 && <span className="ml-2 text-xs text-muted-foreground">· {changed.join(', ')}</span>}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Badge className={`${selected ? ACTION_COLORS[selected.action] : ''} border text-[10px] uppercase`} variant="outline">
                {selected?.action}
              </Badge>
              {selected?.saint_id}
              <span className="text-xs font-normal text-muted-foreground ml-2">{selected && fmt(selected.changed_at)}</span>
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
              <DiffView label="full_bio" oldVal={selected.old_full_bio} newVal={selected.new_full_bio} />
              <DiffView label="Oração" oldVal={selected.old_prayer} newVal={selected.new_prayer} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SaintsAuditPanel;
