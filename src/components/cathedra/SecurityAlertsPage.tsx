import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const SecurityAlertsPage = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_alerts' as any)
        .select(`
          *,
          security_findings (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        toast.error('Erro ao carregar alertas de segurança');
      } else {
        setAlerts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('security_alerts' as any)
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao marcar como lido');
    } else {
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRÍTICO':
      case 'HIGH':
        return <Badge variant="destructive" className="font-bold uppercase tracking-widest text-[10px]">Crítico</Badge>;
      case 'MEDIUM':
      case 'AVISO':
      case 'WARNING':
        return <Badge variant="outline" className="border-amber-500 text-amber-600 font-bold uppercase tracking-widest text-[10px]">Aviso</Badge>;
      default:
        return <Badge variant="secondary" className="uppercase tracking-widest text-[10px]">{severity}</Badge>;
    }
  };

  return (
    <div className="p-spacing-md sm:p-spacing-xl space-y-spacing-xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-spacing-md">
        <div>
          <h1 className="text-premium-3xl font-black uppercase tracking-tight flex items-center gap-spacing-xs text-primary">
            <Icons.Bell className="w-spacing-xl h-spacing-xl" />
            Alertas de Segurança
          </h1>
          <p className="text-muted-foreground font-serif italic">Notificações de vulnerabilidades e novos achados.</p>
        </div>
        <Button onClick={fetchAlerts} variant="outline" size="sm" className="rounded-premium-full gap-spacing-xs">
          <Icons.RefreshCw className={`w-spacing-sm h-spacing-sm ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40">
                <TableHead className="text-premium-xs font-black uppercase tracking-widest py-spacing-lg px-spacing-lg w-spacing-4xl">Data</TableHead>
                <TableHead className="text-premium-xs font-black uppercase tracking-widest">Achado / Título</TableHead>
                <TableHead className="text-premium-xs font-black uppercase tracking-widest">Severidade</TableHead>
                <TableHead className="text-premium-xs font-black uppercase tracking-widest">Impacto</TableHead>
                <TableHead className="text-premium-xs font-black uppercase tracking-widest text-right px-spacing-lg">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="p-spacing-lg">
                      <Skeleton className="h-spacing-lg w-full rounded-premium" />
                    </TableCell>
                  </TableRow>
                ))
              ) : alerts.length > 0 ? (
                alerts.map((alert) => (
                  <TableRow key={alert.id} className={`hover:bg-muted/10 transition-colors border-border/40 ${!alert.is_read ? 'bg-primary/[0.02]' : ''}`}>
                    <TableCell className="px-spacing-lg py-spacing-md font-mono text-[10px]">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="flex flex-col gap-spacing-3xs">
                        <span className="font-bold text-premium-sm">{alert.title}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          {alert.security_findings?.category || 'General'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="font-medium text-premium-sm italic font-serif text-muted-foreground max-w-[400px]">
                      {alert.message.split('\n')[0]}
                    </TableCell>
                    <TableCell className="text-right px-spacing-lg">
                      <div className="flex justify-end gap-spacing-xs">
                        {!alert.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-spacing-xl px-spacing-sm rounded-premium-full hover:bg-primary/5 text-primary text-[10px] font-bold uppercase"
                            onClick={() => markAsRead(alert.id)}
                          >
                            Lido
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-spacing-xl px-spacing-sm rounded-premium-full hover:bg-primary/5 text-primary text-[10px] font-bold uppercase"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Expandir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-spacing-3xl text-muted-foreground font-serif italic">
                    Nenhum alerta encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-spacing-4xl rounded-[2.5rem] border-primary/10 shadow-2xl p-0 overflow-hidden bg-background">
          <div className="bg-primary/5 p-spacing-xl border-b border-primary/10">
            <DialogHeader>
              <div className="flex items-center gap-spacing-sm mb-spacing-xs">
                {getSeverityBadge(selectedAlert?.severity)}
                <Badge variant="outline" className="bg-background/50 border-primary/20 text-[10px] uppercase font-bold tracking-widest">
                  {selectedAlert?.security_findings?.category}
                </Badge>
              </div>
              <DialogTitle className="text-premium-2xl font-black uppercase tracking-tight text-primary">
                {selectedAlert?.title}
              </DialogTitle>
              <DialogDescription className="font-serif italic text-premium-md text-muted-foreground">
                Detectado em {selectedAlert && new Date(selectedAlert.created_at).toLocaleString('pt-BR')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-spacing-xl space-y-spacing-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-xl">
              <div className="space-y-spacing-md">
                <div className="space-y-spacing-xs">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Descrição & Impacto</h4>
                  <div className="bg-muted/30 p-spacing-lg rounded-premium text-premium-sm border border-border/20 italic font-serif leading-relaxed text-foreground/80">
                    {selectedAlert?.message}
                  </div>
                </div>

                <div className="space-y-spacing-xs">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Recomendação</h4>
                  <div className="bg-emerald-500/5 p-spacing-lg rounded-premium border border-emerald-500/20">
                    <p className="text-premium-sm text-emerald-900 dark:text-emerald-100 font-medium">
                      {selectedAlert?.security_findings?.recommendation || 'Nenhuma recomendação disponível.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-spacing-xs">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Evidências Técnicas</h4>
                <div className="relative">
                  <pre className="bg-zinc-950 text-emerald-400 p-spacing-lg rounded-premium text-[11px] font-mono overflow-auto max-h-[400px] border border-white/10 shadow-inner custom-scrollbar">
                    {selectedAlert?.security_findings?.evidence 
                      ? JSON.stringify(selectedAlert.security_findings.evidence, null, 2)
                      : 'Nenhuma evidência capturada.'}
                  </pre>
                  <div className="absolute top-spacing-xs right-spacing-xs">
                    <Icons.Code className="w-spacing-md h-spacing-md opacity-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-spacing-lg bg-muted/20 border-t border-border/40 flex items-center justify-between sm:justify-between px-spacing-xl">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">
              AD MAIOREM DEI GLORIAM — Security Alert Protocol
            </p>
            <Button onClick={() => setSelectedAlert(null)} className="rounded-premium-full font-bold uppercase tracking-widest text-[10px] h-spacing-xl px-spacing-xl shadow-premium">
              Fechar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityAlertsPage;
