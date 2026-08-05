
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
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'realtime'>('admin');
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const table = activeTab === 'admin' ? 'admin_audit_logs' : 'realtime_events_audit';
    
    let query = supabase
      .from(table)
      .select('*, profiles:user_id(name)')
      .order('created_at', { ascending: false });
    
    if (filters.type !== 'all') {
      if (activeTab === 'admin') {
        query = query.filter('action', 'eq', filters.type);
      } else {
        query = query.filter('event_type', 'eq', filters.type);
      }
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.limit(100);
    
    if (!error && data) {
      setLogs(data);
    } else if (error) {
      toast.error(`Erro ao carregar logs: ${error.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, filters]);

  const exportData = (formatExt: 'csv' | 'json') => {
    let content = '';
    const fileName = `audit-${activeTab}-${format(new Date(), 'yyyy-MM-dd-HHmm')}`;

    if (formatExt === 'json') {
      content = JSON.stringify(logs, null, 2);
    } else {
      const headers = activeTab === 'admin' 
        ? ['"Data"', '"Ação"', '"Entidade"', '"ID"', '"Admin"', '"Novo Valor"']
        : ['"Data"', '"Evento"', '"Admin"', '"Payload"'];
      
      const rows = logs.map(log => activeTab === 'admin' ? [
        `"${format(new Date(log.created_at), 'dd/MM/yy HH:mm')}"`,
        `"${log.action}"`,
        `"${log.entity_type}"`,
        `"${log.entity_id || ''}"`,
        `"${log.profiles?.name || 'Sistema'}"`,
        `"${JSON.stringify(log.new_data || {}).replace(/"/g, '""')}"`
      ] : [
        `"${format(new Date(log.created_at), 'dd/MM/yy HH:mm')}"`,
        `"${log.event_type}"`,
        `"${log.profiles?.name || 'Sistema'}"`,
        `"${JSON.stringify(log.payload || {}).replace(/"/g, '""')}"`
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const blob = new Blob([content], { type: formatExt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${formatExt}`;
    a.click();
    toast.success(`Relatório exportado.`);
  };

  return (
    <div className="space-y-spacing-lg p-spacing-lg animate-in fade-in duration-500">
      <div className="flex flex-col gap-spacing-md lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-premium-2xl font-black uppercase tracking-tight flex items-center gap-spacing-xs">
            <Icons.ShieldAlert className="text-primary" />
            Auditoria de Segurança
          </h1>
          <p className="text-muted-foreground font-serif italic text-premium-sm">
            Trilha de auditoria administrativa e eventos críticos de tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-spacing-sm bg-muted/20 p-spacing-sm rounded-premium-full border border-border/10">
          <Select value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <SelectTrigger className="w-[150px] h-8 text-[10px] rounded-full border-none bg-background/50 font-bold uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin Logs</SelectItem>
              <SelectItem value="realtime">Realtime Events</SelectItem>
            </SelectContent>
          </Select>

          <Input 
            type="date" 
            className="w-[130px] h-8 text-[10px] rounded-full bg-background/50 border-none" 
            value={filters.startDate}
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
          />
          
          <CathedraButton variant="ghost" size="sm" onClick={() => exportData('csv')} className="h-8 px-3 text-[10px] font-bold uppercase hover:bg-primary/5">
            Exportar CSV
          </CathedraButton>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-primary/10 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="text-[9px] font-black uppercase py-4">Data</TableHead>
                <TableHead className="text-[9px] font-black uppercase">
                  {activeTab === 'admin' ? 'Ação' : 'Evento'}
                </TableHead>
                <TableHead className="text-[9px] font-black uppercase">
                  {activeTab === 'admin' ? 'Entidade' : 'Admin'}
                </TableHead>
                <TableHead className="text-[9px] font-black uppercase text-right pr-spacing-lg">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4} className="h-16 animate-pulse bg-muted/5"></TableCell></TableRow>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-primary/[0.01] cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <TableCell className="font-mono text-[10px] opacity-60">
                      {format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase">
                        {activeTab === 'admin' ? log.action : log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold">
                      {activeTab === 'admin' ? log.entity_type : (log.profiles?.name || 'Sistema')}
                    </TableCell>
                    <TableCell className="text-right pr-spacing-lg">
                      <Icons.ChevronRight className="w-3 h-3 ml-auto opacity-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center py-spacing-2xl opacity-40 italic">Nenhum registro encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl rounded-[2.5rem] border-primary/20 p-0 overflow-hidden">
          <DialogHeader className="p-spacing-lg bg-muted/30 border-b border-border/40">
            <DialogTitle className="text-premium-xl font-black uppercase">Detalhes da Auditoria</DialogTitle>
            <DialogDescription className="font-mono text-[10px]">
              {selectedLog && format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')} por {selectedLog?.profiles?.name || 'Sistema'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-spacing-lg space-y-spacing-lg">
            <div className="space-y-spacing-sm">
              <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Payload do Evento</h4>
              <pre className="bg-muted/30 p-spacing-md rounded-2xl border border-border/40 text-[10px] overflow-auto max-h-[300px] font-mono">
                {JSON.stringify(activeTab === 'admin' ? { old: selectedLog?.old_data, new: selectedLog?.new_data } : selectedLog?.payload, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end">
              <CathedraButton onClick={() => setSelectedLog(null)} className="rounded-full px-8">Fechar</CathedraButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditPage;
