
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

const AdminAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    adminId: 'all',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin');
      if (data) setAdmins(data);
    };
    fetchAdmins();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('telemetry_audit')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });
    
    if (filters.adminId !== 'all') {
      query = query.eq('user_id', filters.adminId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.limit(100);
    
    if (!error && data) {
      setAuditLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

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

  const exportData = (formatExt: 'csv' | 'json') => {
    let content = '';
    const fileName = `telemetry-audit-${format(new Date(), 'yyyy-MM-dd-HHmm')}`;

    if (formatExt === 'json') {
      content = JSON.stringify(auditLogs, null, 2);
    } else {
      const headers = ['Data/Hora', 'Evento', 'Severidade', 'Título', 'Admin', 'Detalhes'];
      const rows = auditLogs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.event_type,
        log.severity,
        log.title,
        log.profiles?.name || 'Sistema',
        JSON.stringify(log.details).replace(/"/g, '""')
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const blob = new Blob([content], { type: formatExt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${formatExt}`;
    a.click();
    toast.success(`Relatório ${formatExt.toUpperCase()} exportado.`);
  };

  return (
    <div className="space-y-spacing-xl p-spacing-lg animate-in fade-in duration-500">
      <div className="flex flex-col gap-spacing-md lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-premium-2xl font-black uppercase tracking-tight flex items-center gap-spacing-xs">
            <Icons.History className="text-primary" />
            Auditoria de Telemetria
          </h1>
          <p className="text-muted-foreground font-serif italic text-premium-sm">
            Histórico completo de alertas, exportações e alterações de limites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-spacing-sm bg-muted/20 p-spacing-sm rounded-premium-full border border-border/10">
          <Select value={filters.adminId} onValueChange={(v) => setFilters(f => ({ ...f, adminId: v }))}>
            <SelectTrigger className="w-[150px] h-8 text-[10px] rounded-full border-none bg-background/50">
              <SelectValue placeholder="Admin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Admins</SelectItem>
              {admins.map(admin => (
                <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input 
            type="date" 
            className="w-[130px] h-8 text-[10px] rounded-full bg-background/50 border-none" 
            value={filters.startDate}
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
          />
          <span className="text-[10px] opacity-30">até</span>
          <Input 
            type="date" 
            className="w-[130px] h-8 text-[10px] rounded-full bg-background/50 border-none" 
            value={filters.endDate}
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
          />

          <div className="h-4 w-[1px] bg-border mx-1" />

          <CathedraButton variant="ghost" size="sm" onClick={() => exportData('csv')} className="h-8 px-3 text-[10px] font-bold uppercase hover:bg-primary/5">
            CSV
          </CathedraButton>
          <CathedraButton variant="ghost" size="sm" onClick={() => exportData('json')} className="h-8 px-3 text-[10px] font-bold uppercase hover:bg-primary/5">
            JSON
          </CathedraButton>
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
                <TableHead className="text-[9px] font-black uppercase">Admin</TableHead>
                <TableHead className="text-[9px] font-black uppercase">Título</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-right pr-spacing-lg">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/5"></TableCell>
                  </TableRow>
                ))
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-primary/[0.01] cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <TableCell className="font-mono text-[10px] opacity-60">
                      {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getEventBadge(log.event_type)}</TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell className="text-[10px] font-bold">{log.profiles?.name || 'Sistema'}</TableCell>
                    <TableCell className="font-bold text-[11px]">{log.title}</TableCell>
                    <TableCell className="text-right pr-spacing-lg">
                      {log.event_type === 'config_change' && (
                        <Icons.ArrowUpDown className="w-3 h-3 text-primary ml-auto opacity-40" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-spacing-2xl opacity-40 italic">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl rounded-[2.5rem] border-primary/20 p-0 overflow-hidden">
          <DialogHeader className="p-spacing-lg bg-muted/30 border-b border-border/40">
            <div className="flex items-center gap-2 mb-2">
              {selectedLog && getEventBadge(selectedLog.event_type)}
              {selectedLog && getSeverityBadge(selectedLog.severity)}
            </div>
            <DialogTitle className="text-premium-xl font-black uppercase">{selectedLog?.title}</DialogTitle>
            <DialogDescription className="font-mono text-[10px]">
              {selectedLog && format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')} por {selectedLog?.profiles?.name || 'Sistema'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-spacing-lg space-y-spacing-lg">
            {selectedLog?.event_type === 'config_change' ? (
              <div className="grid grid-cols-2 gap-spacing-lg">
                <div className="space-y-spacing-sm">
                  <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest flex items-center gap-1">
                    <Icons.History className="w-3 h-3" /> Antes
                  </h4>
                  <div className="bg-muted/30 p-spacing-md rounded-2xl border border-border/40 space-y-2">
                    {Object.entries(selectedLog.details.old || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-[11px]">
                        <span className="opacity-60">{key}:</span>
                        <span className="font-bold">{value as any}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-spacing-sm">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                    <Icons.CheckCircle2 className="w-3 h-3" /> Depois
                  </h4>
                  <div className="bg-primary/5 p-spacing-md rounded-2xl border border-primary/10 space-y-2">
                    {Object.entries(selectedLog.details.new || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-[11px]">
                        <span className="opacity-60">{key}:</span>
                        <span className="font-bold text-primary">{value as any}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-spacing-sm">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Detalhes do Evento</h4>
                <pre className="bg-muted/30 p-spacing-md rounded-2xl border border-border/40 text-[10px] overflow-auto max-h-[200px] font-mono">
                  {JSON.stringify(selectedLog?.details, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex justify-end">
              <CathedraButton onClick={() => setSelectedLog(null)} className="rounded-full px-8">
                Fechar
              </CathedraButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-center pt-spacing-xl">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-20 italic">
          Audit Protocol — Cathedra Governance System
        </p>
      </div>
    </div>
  );
};

export default AdminAuditPage;
