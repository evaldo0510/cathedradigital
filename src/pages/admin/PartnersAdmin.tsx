import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '@/constants';
import { toast } from 'sonner';

type PartnerRow = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  partner_type: 'institution' | 'company' | 'individual';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const TYPE_LABEL: Record<PartnerRow['partner_type'], string> = {
  institution: 'Instituição',
  company: 'Empresa',
  individual: 'Indivíduo',
};

const STATUS_LABEL: Record<PartnerRow['status'], string> = {
  pending: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Recusado',
};

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Carregando">
    <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
  </div>
);

const PartnersAdmin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | PartnerRow['status']>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | PartnerRow['partner_type']>('all');
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, description, logo_url, website_url, contact_email, partner_type, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data as PartnerRow[]) ?? [];
      // Resolve preview signed URLs para logos ainda em bucket privado.
      const withPreview = await Promise.all(rows.map(async r => {
        if (!r.logo_url || r.logo_url.startsWith('http')) return r;
        const { data: signed } = await supabase.storage
          .from('partner-logos')
          .createSignedUrl(r.logo_url, 60 * 30);
        return { ...r, _preview: signed?.signedUrl ?? null } as PartnerRow & { _preview?: string | null };
      }));
      return withPreview;
    },
  });

  const filtered = useMemo(
    () =>
      partners.filter(
        p =>
          (statusFilter === 'all' || p.status === statusFilter) &&
          (typeFilter === 'all' || p.partner_type === typeFilter),
      ),
    [partners, statusFilter, typeFilter],
  );

  if (authLoading || adminLoading) return <Spinner />;
  if (!user) return <Navigate to="/auth?next=/admin/parceiros" replace />;
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center space-y-3">
        <h1 className="text-2xl font-semibold">Sem permissão</h1>
        <p className="text-muted-foreground">Este painel é restrito a administradores do Cathedra.</p>
      </div>
    );
  }

  const decide = async (partner: PartnerRow, next: 'approved' | 'rejected') => {
    setActingId(partner.id);
    try {
      let publicLogoUrl: string | null = partner.logo_url;

      // Se logo_url ainda é um path do bucket privado, gera signed URL de 10 anos na aprovação.
      if (next === 'approved' && partner.logo_url && !partner.logo_url.startsWith('http')) {
        const { data, error } = await supabase.storage
          .from('partner-logos')
          .createSignedUrl(partner.logo_url, 60 * 60 * 24 * 365 * 10);
        if (error) throw error;
        publicLogoUrl = data.signedUrl;
      }

      const { error: updErr } = await supabase
        .from('partners')
        .update({ status: next, logo_url: publicLogoUrl })
        .eq('id', partner.id);
      if (updErr) throw updErr;

      // Notificação (best-effort — não bloqueia)
      supabase.functions
        .invoke('partner-notify', { body: { partner_id: partner.id, action: next } })
        .catch(() => {});

      toast.success(next === 'approved' ? 'Parceiro aprovado.' : 'Candidatura recusada.');
      qc.invalidateQueries({ queryKey: ['admin-partners'] });
      qc.invalidateQueries({ queryKey: ['public-partners'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar.');
    } finally {
      setActingId(null);
    }
  };

  const revert = async (partner: PartnerRow) => {
    setActingId(partner.id);
    try {
      const { error } = await supabase.from('partners').update({ status: 'pending' }).eq('id', partner.id);
      if (error) throw error;
      toast.success('Voltou para análise.');
      qc.invalidateQueries({ queryKey: ['admin-partners'] });
      qc.invalidateQueries({ queryKey: ['public-partners'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao reverter.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-spacing-xl px-spacing-md space-y-spacing-xl">
      <header className="space-y-spacing-xs">
        <p className="text-premium-xs uppercase tracking-widest text-secondary">Cathedra · Curadoria</p>
        <h1 className="text-premium-3xl font-semibold">Parceiros & Patrocinadores</h1>
        <p className="text-muted-foreground">
          Revise e aprove candidaturas antes que apareçam publicamente em /partners.
        </p>
      </header>

      <div className="flex flex-wrap gap-spacing-md items-end">
        <div className="space-y-spacing-xs">
          <label className="text-premium-xs text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Em análise</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-spacing-xs">
          <label className="text-premium-xs text-muted-foreground">Tipo</label>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="institution">Instituições</SelectItem>
              <SelectItem value="company">Empresas</SelectItem>
              <SelectItem value="individual">Indivíduos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-premium-sm text-muted-foreground">
          {filtered.length} de {partners.length}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-spacing-3xl text-muted-foreground border border-dashed rounded-premium">
          Nada para exibir com os filtros atuais.
        </div>
      ) : (
        <div className="space-y-spacing-md">
          {filtered.map(p => (
            <PartnerAdminRow
              key={p.id}
              partner={p}
              busy={actingId === p.id}
              onApprove={() => decide(p, 'approved')}
              onReject={() => decide(p, 'rejected')}
              onRevert={() => revert(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PartnerAdminRow: React.FC<{
  partner: PartnerRow;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
}> = ({ partner, busy, onApprove, onReject, onRevert }) => (
  <Card className="overflow-hidden">
    <CardHeader className="flex flex-row items-start justify-between gap-spacing-md">
      <div className="space-y-spacing-2xs">
        <CardTitle className="text-premium-xl">{partner.name}</CardTitle>
        <div className="flex flex-wrap gap-spacing-xs">
          <Badge variant="secondary">{TYPE_LABEL[partner.partner_type]}</Badge>
          <Badge
            variant={
              partner.status === 'approved' ? 'default'
              : partner.status === 'rejected' ? 'destructive'
              : 'outline'
            }
          >
            {STATUS_LABEL[partner.status]}
          </Badge>
        </div>
      </div>
      <div className="flex gap-spacing-xs">
        {partner.status !== 'approved' && (
          <Button size="sm" onClick={onApprove} disabled={busy}>
            <Icons.Check className="w-spacing-md h-spacing-md mr-spacing-2xs" /> Aprovar
          </Button>
        )}
        {partner.status !== 'rejected' && (
          <Button size="sm" variant="destructive" onClick={onReject} disabled={busy}>
            Recusar
          </Button>
        )}
        {partner.status !== 'pending' && (
          <Button size="sm" variant="outline" onClick={onRevert} disabled={busy}>
            Voltar para análise
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-spacing-md">
      <div className="h-[120px] rounded-premium bg-muted/40 flex items-center justify-center overflow-hidden">
        {partner.logo_url ? (
          <img
            src={(partner as PartnerRow & { _preview?: string | null })._preview ?? (partner.logo_url.startsWith('http') ? partner.logo_url : '')}
            alt={partner.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <Icons.Image className="w-spacing-lg h-spacing-lg text-muted-foreground/60" />
        )}
      </div>
      <div className="space-y-spacing-xs text-premium-sm">
        {partner.description && <p className="leading-relaxed">{partner.description}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-xs text-muted-foreground">
          <div>Contato: <span className="text-foreground">{partner.contact_email ?? '—'}</span></div>
          <div>Site: {partner.website_url
            ? <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{partner.website_url}</a>
            : <span className="text-foreground">—</span>}
          </div>
          <div>Recebido em: <span className="text-foreground">{new Date(partner.created_at).toLocaleString('pt-BR')}</span></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

function resolveLogoPreview(logo: string): string {
  if (logo.startsWith('http')) return logo;
  const { data } = supabase.storage.from('partner-logos').getPublicUrl(logo);
  return data.publicUrl;
}

export default PartnersAdmin;
