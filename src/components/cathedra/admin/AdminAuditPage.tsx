
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CathedraButton } from '../CathedraButton';

const AdminAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      const { data, error } = await supabase
        .from('telemetry_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (!error && data) {
        setAuditLogs(data);
      }
      setLoading(false);
    };

    fetchAuditLogs();
  }, []);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'alert':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase text-[9px]">Alerta</Badge>;
      case 'export':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 uppercase text-[9px]">Exportação</Badge>;
      case 'config_change':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase text-[9px]">Configuração</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[9px]">{type}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') return <Badge variant="destructive" className="text-[8px] uppercase">Crítico</Badge>;
    if (severity === 'warning') return <Badge className="bg-amber-500 text-white text-[8px] uppercase">Aviso</Badge>;
    return <Badge variant="secondary" className="text-[8px] uppercase">{severity}</Badge>;
  };

  return (
    <div className="space-y-spacing-xl p-spacing-lg animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-premium-2xl font-black uppercase tracking-tight flex items-center gap-spacing-xs">
            <Icons.History className="text-primary" />
            Auditoria de Telemetria
          </h1>
          <p className="text-muted-foreground font-serif italic text-premium-sm">
            Histórico completo de alertas, exportações e alterações de limites.
          </p>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-primary/10 shadow-premium overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 p-spacing-lg">
          <CardTitle className="text-premium-xs font-black uppercase tracking-widest">Registros de Auditoria</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="text-[9px] font-black uppercase py-4">Data/Hora</TableHead>
                <TableHead className="text-[9px] font-black uppercase">Evento</TableHead>
                <TableHead className="text-[9px] font-black uppercase">Severidade</TableHead>
                <TableHead className="text-[9px] font-black uppercase">Título</TableHead>
                <TableHead className="text-[9px] font-black uppercase">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/5"></TableCell>
                  </TableRow>
                ))
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-primary/[0.01]">
                    <TableCell className="font-mono text-[10px] opacity-60">
                      {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getEventBadge(log.event_type)}</TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell className="font-bold text-[11px]">{log.title}</TableCell>
                    <TableCell className="text-[10px] opacity-70 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-spacing-2xl opacity-40 italic">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-center pt-spacing-xl">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-20 italic">
          Audit Protocol — Cathedra Governance System
        </p>
      </div>
    </div>
  );
};

export default AdminAuditPage;