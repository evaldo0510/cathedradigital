import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';

interface AuditEntry {
  id: string;
  partner_id: string;
  actor_id: string | null;
  action: 'created' | 'status_changed' | 'updated';
  from_status: string | null;
  to_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Recusado',
};

const ACTION_LABEL: Record<AuditEntry['action'], string> = {
  created: 'Candidatura criada',
  status_changed: 'Status alterado',
  updated: 'Dados alterados',
};

const ACTION_ICON: Record<AuditEntry['action'], React.ComponentType<{ className?: string }>> = {
  created: Icons.Plus,
  status_changed: Icons.RefreshCw,
  updated: Icons.Edit,
};

const PartnerAuditTimeline: React.FC<{ partnerId: string }> = ({ partnerId }) => {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['partner-audit', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_audit_log')
        .select('id, partner_id, actor_id, action, from_status, to_status, metadata, created_at')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as AuditEntry[]) ?? [];
    },
  });

  if (isLoading) {
    return <div className="text-premium-sm text-muted-foreground py-spacing-md">Carregando histórico…</div>;
  }
  if (entries.length === 0) {
    return <div className="text-premium-sm text-muted-foreground py-spacing-md">Sem registros ainda.</div>;
  }

  return (
    <ol className="relative border-l border-border ml-spacing-xs space-y-spacing-md py-spacing-xs">
      {entries.map(entry => {
        const Icon = ACTION_ICON[entry.action];
        const changedFields = entry.action === 'updated'
          ? ((entry.metadata as { changed_fields?: string[] } | null)?.changed_fields ?? [])
          : [];
        return (
          <li key={entry.id} className="ml-spacing-md relative">
            <span className="absolute -left-[calc(theme(spacing.6)/2+1px)] top-1 flex items-center justify-center w-spacing-md h-spacing-md rounded-full bg-primary/10 text-primary ring-4 ring-background">
              <Icon className="w-3 h-3" />
            </span>
            <div className="flex flex-wrap items-baseline gap-spacing-xs">
              <span className="text-premium-sm font-medium">{ACTION_LABEL[entry.action]}</span>
              <time className="text-premium-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString('pt-BR')}
              </time>
            </div>
            {entry.action === 'status_changed' && (
              <div className="flex items-center gap-spacing-xs mt-spacing-2xs text-premium-xs">
                <Badge variant="outline">{STATUS_LABEL[entry.from_status ?? ''] ?? entry.from_status ?? '—'}</Badge>
                <Icons.ArrowRight className="w-3 h-3 text-muted-foreground" />
                <Badge
                  variant={entry.to_status === 'approved' ? 'default'
                    : entry.to_status === 'rejected' ? 'destructive'
                    : 'secondary'}
                >
                  {STATUS_LABEL[entry.to_status ?? ''] ?? entry.to_status ?? '—'}
                </Badge>
              </div>
            )}
            {entry.action === 'updated' && changedFields.length > 0 && (
              <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">
                Campos: {changedFields.join(', ')}
              </p>
            )}
            {entry.actor_id && (
              <p className="text-premium-xs text-muted-foreground/70 mt-spacing-2xs font-mono">
                por {entry.actor_id.slice(0, 8)}…
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default PartnerAuditTimeline;
