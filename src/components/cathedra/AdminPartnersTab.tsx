import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink, 
  Clock, 
  ShieldCheck,
  Building2,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  contact_email: string | null;
  created_at: string;
}

const AdminPartnersTab: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data as Partner[] || []);
    } catch (error: any) {
      toast.error('Erro ao buscar parceiros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.success(`Parceiro ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso.`);
    } catch (error: any) {
      toast.error('Erro ao atualizar parceiro: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPartners(prev => prev.filter(p => p.id !== id));
      toast.success('Parceiro excluído com sucesso.');
    } catch (error: any) {
      toast.error('Erro ao excluir parceiro: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20 gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1.5"><XCircle className="w-3.5 h-3.5" /> Rejeitado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1.5 bg-warning/10 text-warning border-warning/20"><Clock className="w-3.5 h-3.5" /> Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-2xl bg-muted/40 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Gestão de Parceiros</h2>
          <p className="text-sm text-muted-foreground">Aprovação e gerenciamento de instituições parceiras.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {partners.filter(p => p.status === 'pending').length} solicitações pendentes
          </Badge>
        </div>
      </div>

      {partners.length === 0 ? (
        <Card className="border-dashed border-2 py-12">
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Nenhum parceiro encontrado</p>
              <p className="text-sm text-muted-foreground">Novas solicitações aparecerão aqui.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {partners.map((partner) => (
            <Card key={partner.id} className="group hover:border-primary/30 transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                    {partner.logo_url ? (
                      <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {partner.name}
                      {getStatusBadge(partner.status)}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {partner.contact_email}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(partner.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUpdateStatus(partner.id, 'approved')} className="text-success">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(partner.id, 'rejected')} className="text-destructive">
                      <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(partner.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir permanentemente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {partner.description || "Nenhuma descrição fornecida."}
                </p>
              </CardContent>
              
              <CardFooter className="pt-0 flex items-center justify-between border-t border-border/50 mt-2 py-3 bg-muted/5">
                <div className="flex items-center gap-2">
                  {partner.website_url && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                      <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                        Site <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {partner.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" className="h-8 border-destructive/30 text-destructive hover:bg-destructive/5" onClick={() => handleUpdateStatus(partner.id, 'rejected')}>
                        Rejeitar
                      </Button>
                      <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleUpdateStatus(partner.id, 'approved')}>
                        Aprovar
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPartnersTab;
