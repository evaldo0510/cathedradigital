/**
 * WorkAuditHistory — Painel de histórico editorial de uma obra.
 * Usado no diálogo de edição em /admin/biblioteca-patristica.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listWorkAudit, type SaintWorksAuditEntry } from '@/services/saintWorksService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History, Download } from 'lucide-react';

const ACTION_LABEL: Record<SaintWorksAuditEntry['action'], string> = {
  created: 'Obra criada',
  updated: 'Metadados atualizados',
  status_changed: 'Status alterado',
  chapter_created: 'Capítulo adicionado',
  chapter_updated: 'Capítulo editado',
  chapter_deleted: 'Capítulo removido',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export interface WorkAuditHistoryProps {
  workId: string;
}

/** Escape CSV cell: wrap in quotes, double-up embedded quotes. */
function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function exportCsv(entries: SaintWorksAuditEntry[], workId: string) {
  const header = [
    'data_iso',
    'acao',
    'de_status',
    'para_status',
    'campos_alterados',
    'capitulo_id',
    'ator_email',
    'ator_id',
    'notas',
  ];
  const rows = entries.map((e) => [
    e.created_at,
    ACTION_LABEL[e.action] ?? e.action,
    e.from_status ?? '',
    e.to_status ?? '',
    (e.changed_fields ?? []).join('|'),
    e.chapter_id ?? '',
    e.actor_email ?? '',
    e.actor_id ?? '',
    (e.notes ?? '').replace(/\s+/g, ' ').trim(),
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  // BOM para Excel reconhecer UTF-8.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_obra_${workId}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const WorkAuditHistory: React.FC<WorkAuditHistoryProps> = ({ workId }) => {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['saint_works_audit', workId],
    queryFn: () => listWorkAudit(workId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando histórico…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 flex items-center gap-2">
        <History className="w-4 h-4" /> Nenhuma alteração registrada.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'evento registrado' : 'eventos registrados'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => exportCsv(entries, workId)}
          className="h-7 gap-1.5 text-xs"
        >
          <Download className="w-3.5 h-3.5" aria-hidden /> Exportar CSV
        </Button>
      </div>
      <ol className="space-y-2 max-h-[320px] overflow-y-auto pr-1">

      {entries.map((e) => (
        <li
          key={e.id}
          className="text-sm border border-border/60 rounded-md p-3 bg-muted/20 space-y-1"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{ACTION_LABEL[e.action] ?? e.action}</span>
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {formatDate(e.created_at)}
            </span>
          </div>

          {e.action === 'status_changed' && (
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="outline">{STATUS_LABEL[e.from_status ?? ''] ?? e.from_status ?? '—'}</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="default">{STATUS_LABEL[e.to_status ?? ''] ?? e.to_status ?? '—'}</Badge>
            </div>
          )}

          {e.changed_fields.length > 0 && e.changed_fields[0] !== '*' && (
            <div className="flex flex-wrap gap-1 pt-1">
              {e.changed_fields.map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px]">
                  {f}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            por <span className="font-mono">{e.actor_email ?? e.actor_id ?? 'sistema'}</span>
          </p>
        </li>
      ))}
      </ol>
    </div>
  );
};

export default WorkAuditHistory;
