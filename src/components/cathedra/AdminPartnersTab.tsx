import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

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

  const handleSaveEdit = async () => {
    if (!editingPartner) return;

    try {
      const { error } = await supabase
        .from('partners')
        .update({
          name: editingPartner.name,
          description: editingPartner.description,
          logo_url: editingPartner.logo_url,
          website_url: editingPartner.website_url,
          contact_email: editingPartner.contact_email,
          status: editingPartner.status
        })
        .eq('id', editingPartner.id);

      if (error) throw error;

      setPartners(prev => prev.map(p => p.id === editingPartner.id ? editingPartner : p));
      toast.success('Dados do parceiro atualizados.');
      setIsEditDialogOpen(false);
      setEditingPartner(null);
    } catch (error: any) {
      toast.error('Erro ao salvar alterações: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-spacing-2xs"><Icons.CheckCircle2 className="w-spacing-sm h-spacing-sm" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-spacing-2xs"><Icons.XCircle className="w-spacing-sm h-spacing-sm" /> Rejeitado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-spacing-2xs bg-amber-500/10 text-amber-500 border-amber-500/20"><Icons.Clock className="w-spacing-sm h-spacing-sm" /> Pendente</Badge>;
    }
  };

  const filteredPartners = partners.filter(p => 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (activeTab === 'all' || p.status === activeTab)
  );

  const pendingCount = partners.filter(p => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-spacing-4xl rounded-premium bg-muted/40 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-spacing-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-spacing-md">
        <div>
          <h2 className="text-premium-xl font-bold">Gestão de Parceiros</h2>
          <p className="text-premium-sm text-muted-foreground">Analise solicitações e gerencie instituições parceiras.</p>
        </div>
        <div className="flex items-center gap-spacing-xs">
          <div className="relative">
            <Icons.Search className="absolute left-spacing-xs top-spacing-xs h-spacing-md w-spacing-md text-muted-foreground" />
            <Input
              placeholder="Buscar parceiro..."
              className="pl-spacing-xl w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-spacing-lg">
        <TabsList>
          <TabsTrigger value="pending" className="gap-spacing-xs">
            Solicitações
            {pendingCount > 0 && (
              <span className="bg-primary text-primary-foreground px-spacing-2xs py-spacing-3xs rounded-premium-full text-premium-xs font-bold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-spacing-0">
          {filteredPartners.length === 0 ? (
            <Card className="border-dashed border-2 py-spacing-2xl">
              <CardContent className="flex flex-col items-center text-center space-y-spacing-md">
                <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-muted flex items-center justify-center">
                  <Icons.Building2 className="w-spacing-xl h-spacing-xl text-muted-foreground" />
                </div>
                <div className="space-y-spacing-2xs">
                  <p className="font-semibold">Nenhum parceiro nesta categoria</p>
                  <p className="text-premium-sm text-muted-foreground">Use a busca ou mude o filtro para encontrar parceiros.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-md">
              {filteredPartners.map((partner) => (
                <Card key={partner.id} className="group hover:border-primary/30 transition-all bg-card ">
                  <CardHeader className="flex flex-row items-start justify-between pb-spacing-sm">
                    <div className="flex items-center gap-spacing-md">
                      <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-white flex items-center justify-center overflow-hidden border p-spacing-2xs shadow-premium-md">
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-contain" />
                        ) : (
                          <Icons.Building2 className="w-spacing-lg h-spacing-lg text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-premium-lg flex items-center gap-spacing-xs">
                          {partner.name}
                          {getStatusBadge(partner.status)}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-premium-sm text-muted-foreground mt-spacing-2xs">
                          <span className="flex items-center gap-spacing-2xs"><Icons.Mail className="w-spacing-sm h-spacing-sm" /> {partner.contact_email}</span>
                          <span className="flex items-center gap-spacing-2xs"><Icons.Clock className="w-spacing-sm h-spacing-sm" /> {new Date(partner.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-spacing-xl w-spacing-xl">
                          <Icons.MoreHorizontal className="w-spacing-md h-spacing-md" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingPartner({...partner});
                          setIsEditDialogOpen(true);
                        }}>
                          <Icons.Edit className="w-spacing-md h-spacing-md mr-spacing-xs" /> Editar Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateStatus(partner.id, 'approved')} className="text-emerald-500">
                          <Icons.CheckCircle2 className="w-spacing-md h-spacing-md mr-spacing-xs" /> Aprovar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(partner.id, 'rejected')} className="text-destructive">
                          <Icons.XCircle className="w-spacing-md h-spacing-md mr-spacing-xs" /> Rejeitar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(partner.id)} className="text-destructive">
                          <Icons.Trash2 className="w-spacing-md h-spacing-md mr-spacing-xs" /> Excluir permanentemente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  
                  <CardContent className="pb-spacing-md">
                    <p className="text-premium-sm text-muted-foreground line-clamp-spacing-xs italic">
                      "{partner.description || "Nenhuma descrição fornecida."}"
                    </p>
                  </CardContent>
                  
                  <CardFooter className="pt-spacing-0 flex items-center justify-between border-t border-border/50 mt-spacing-xs py-spacing-sm bg-muted/5">
                    <div className="flex items-center gap-spacing-xs">
                      {partner.website_url && (
                        <Button variant="ghost" size="sm" className="h-spacing-xl gap-spacing-2xs text-premium-xs text-primary hover:text-primary hover:bg-primary/10" asChild>
                          <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                            Site <Icons.ExternalLink className="w-spacing-sm h-spacing-sm" />
                          </a>
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-spacing-xs">
                      {partner.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-spacing-xl text-destructive hover:bg-destructive/10 hover:text-destructive gap-spacing-2xs" 
                            onClick={() => handleUpdateStatus(partner.id, 'rejected')}
                          >
                            <Icons.X className="w-spacing-md h-spacing-md" /> Rejeitar
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-spacing-xl bg-emerald-500 hover:bg-emerald-600 text-white gap-spacing-2xs" 
                            onClick={() => handleUpdateStatus(partner.id, 'approved')}
                          >
                            <Icons.Check className="w-spacing-md h-spacing-md" /> Aprovar
                          </Button>
                        </>
                      )}
                      {partner.status !== 'pending' && (
                         <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-spacing-xl gap-spacing-2xs"
                          onClick={() => {
                            setEditingPartner({...partner});
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Icons.Edit className="w-spacing-md h-spacing-md" /> Editar
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Parceiro</DialogTitle>
            <DialogDescription>
              Atualize as informações do parceiro ou modifique seu status manualmente.
            </DialogDescription>
          </DialogHeader>

          {editingPartner && (
            <div className="space-y-spacing-md py-spacing-md">
              <div className="grid grid-cols-2 gap-spacing-md">
                <div className="space-y-spacing-xs">
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input 
                    id="edit-name" 
                    value={editingPartner.name} 
                    onChange={(e) => setEditingPartner({...editingPartner, name: e.target.value})}
                  />
                </div>
                <div className="space-y-spacing-xs">
                  <Label htmlFor="edit-email">Email de Contato</Label>
                  <Input 
                    id="edit-email" 
                    type="email"
                    value={editingPartner.contact_email || ''} 
                    onChange={(e) => setEditingPartner({...editingPartner, contact_email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-spacing-xs">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea 
                  id="edit-description" 
                  value={editingPartner.description || ''} 
                  onChange={(e) => setEditingPartner({...editingPartner, description: e.target.value})}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-spacing-md">
                <div className="space-y-spacing-xs">
                  <Label htmlFor="edit-website">Site (URL)</Label>
                  <Input 
                    id="edit-website" 
                    value={editingPartner.website_url || ''} 
                    onChange={(e) => setEditingPartner({...editingPartner, website_url: e.target.value})}
                  />
                </div>
                <div className="space-y-spacing-xs">
                  <Label htmlFor="edit-logo">Logo (URL)</Label>
                  <Input 
                    id="edit-logo" 
                    value={editingPartner.logo_url || ''} 
                    onChange={(e) => setEditingPartner({...editingPartner, logo_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-spacing-xs">
                <Label>Status Atual</Label>
                <div className="flex gap-spacing-xs">
                  <Button 
                    variant={editingPartner.status === 'pending' ? 'secondary' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setEditingPartner({...editingPartner, status: 'pending'})}
                  >
                    Pendente
                  </Button>
                  <Button 
                    variant={editingPartner.status === 'approved' ? 'default' : 'outline'} 
                    size="sm" 
                    className={`flex-1 ${editingPartner.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setEditingPartner({...editingPartner, status: 'approved'})}
                  >
                    Aprovado
                  </Button>
                  <Button 
                    variant={editingPartner.status === 'rejected' ? 'destructive' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setEditingPartner({...editingPartner, status: 'rejected'})}
                  >
                    Rejeitado
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartnersTab;

