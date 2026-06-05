import { Icons } from '@/constants';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const PAGE_SIZE = 20;

const SecurityDashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Selection
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, typeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('security_audit_logs' as any)
        .select(`
          *,
          profiles:metadata->>'userId'
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (typeFilter !== 'all') {
        query = query.eq('event_type', typeFilter);
      }
      
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        toast.error('Erro ao carregar logs de segurança');
      } else {
        setLogs(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesUser = !userFilter || 
        log.metadata?.userId?.toLowerCase().includes(userFilter.toLowerCase()) ||
        log.description?.toLowerCase().includes(userFilter.toLowerCase());
      
      const matchesResource = !resourceFilter || 
        log.event_type?.toLowerCase().includes(resourceFilter.toLowerCase());

      const matchesAction = !actionFilter ||
        log.severity?.toLowerCase().includes(actionFilter.toLowerCase());
      
      const logDate = new Date(log.created_at).getTime();
      const matchesStart = !startDate || logDate >= new Date(startDate).getTime();
      const matchesEnd = !endDate || logDate <= new Date(endDate).getTime();
      
      return matchesUser && matchesResource && matchesAction && matchesStart && matchesEnd;
    });
  }, [logs, userFilter, resourceFilter, actionFilter, startDate, endDate]);

  const exportData = (format: 'json' | 'csv') => {
    if (filteredLogs.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    let content = '';
    let fileName = `security-audit-logs-${new Date().toISOString()}`;

    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
      fileName += '.json';
    } else {
      const headers = ['Data', 'Evento', 'Severidade', 'Descrição', 'Metadata'];
      const rows = filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.event_type,
        log.severity,
        log.description,
        JSON.stringify(log.metadata)
      ]);
      content = [headers, ...rows].map(e => e.join(',')).join('\n');
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Logs exportados como ${format.toUpperCase()}`);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="font-bold uppercase tracking-tighter">Crítico</Badge>;
      case 'warning': return <Badge variant="outline" className="border-amber-500 text-amber-600 font-bold uppercase tracking-tighter">Aviso</Badge>;
      default: return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="p-spacing-md sm:p-spacing-xl space-y-spacing-xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-spacing-md">
        <div>
          <h1 className="text-premium-3xl font-black uppercase tracking-tight flex items-center gap-spacing-xs text-primary">
            <Icons.ShieldAlert className="w-spacing-xl h-spacing-xl" />
            Auditoria de Segurança
          </h1>
          <p className="text-muted-foreground font-serif italic">Monitoramento de acessos e operações críticas.</p>
        </div>
        <div className="flex gap-spacing-xs">
          <Button onClick={() => exportData('csv')} variant="outline" size="sm" className="rounded-premium-full gap-spacing-xs">
            <Icons.Download className="w-spacing-sm h-spacing-sm" /> CSV
          </Button>
          <Button onClick={() => exportData('json')} variant="outline" size="sm" className="rounded-premium-full gap-spacing-xs">
            <Icons.FileText className="w-spacing-sm h-spacing-sm" /> JSON
          </Button>
          <Button onClick={fetchLogs} variant="outline" size="sm" className="rounded-premium-full gap-spacing-xs">
            <Icons.RefreshCw className={`w-spacing-sm h-spacing-sm ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <CardTitle className="text-premium-lg font-black uppercase tracking-widest">Filtros Avançados</CardTitle>
          <CardDescription>Busca e refinamento temporal</CardDescription>
        </CardHeader>
        <CardContent className="p-spacing-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-spacing-md">
            <div className="space-y-spacing-xs">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Usuário</label>
              <Input 
                placeholder="Nome ou ID" 
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="rounded-premium"
              />
            </div>
            <div className="space-y-spacing-xs">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tipo de Evento</label>
              <Input 
                placeholder="Ex: invalid_signature" 
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="rounded-premium"
              />
            </div>
            <div className="space-y-spacing-xs">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Severidade</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="rounded-premium">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-spacing-xs">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Data Início</label>
              <Input 
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-premium"
              />
            </div>
            <div className="space-y-spacing-xs">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Data Fim</label>
              <Input 
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-premium"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="text-premium-xs font-black uppercase tracking-widest py-spacing-lg px-spacing-lg">Data/Hora</TableHead>
                  <TableHead className="text-premium-xs font-black uppercase tracking-widest">Evento</TableHead>
                  <TableHead className="text-premium-xs font-black uppercase tracking-widest">Severidade</TableHead>
                  <TableHead className="text-premium-xs font-black uppercase tracking-widest">Descrição</TableHead>
                  <TableHead className="text-premium-xs font-black uppercase tracking-widest text-right px-spacing-lg">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="p-spacing-lg">
                        <Skeleton className="h-spacing-lg w-full rounded-premium" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/10 transition-colors border-border/40">
                      <TableCell className="px-spacing-lg py-spacing-md font-mono text-[10px]">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell className="font-medium text-premium-sm max-w-[300px] truncate">
                        {log.description}
                      </TableCell>
                      <TableCell className="text-right px-spacing-lg">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-spacing-xl w-spacing-xl p-0 rounded-premium-full hover:bg-primary/5 text-primary"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Icons.Info className="w-spacing-md h-spacing-md" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-spacing-3xl text-muted-foreground font-serif italic">
                      Nenhum log encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-spacing-lg bg-muted/20 border-t border-border/40 flex items-center justify-between">
            <p className="text-premium-xs text-muted-foreground">
              Mostrando {filteredLogs.length} de {totalCount} registros
            </p>
            <div className="flex gap-spacing-xs">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 0} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="rounded-premium-full"
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage >= totalPages - 1} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="rounded-premium-full"
              >
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-spacing-4xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-premium-xl font-black uppercase tracking-tight flex items-center gap-spacing-xs">
              <Icons.ShieldAlert className="text-primary" />
              Detalhes do Evento
            </DialogTitle>
            <DialogDescription className="font-serif italic">
              Investigação técnica do log ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg py-spacing-md">
            <div className="space-y-spacing-md">
              <div className="space-y-spacing-2xs">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Informações de Contexto</h4>
                <div className="bg-muted/30 p-spacing-md rounded-premium space-y-spacing-xs border border-border/20">
                  <div className="flex justify-between text-premium-xs">
                    <span className="font-bold">Evento:</span>
                    <span>{selectedLog?.event_type}</span>
                  </div>
                  <div className="flex justify-between text-premium-xs">
                    <span className="font-bold">Usuário (Metadata):</span>
                    <span className="font-mono">{selectedLog?.metadata?.userId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-premium-xs">
                    <span className="font-bold">Severidade:</span>
                    {getSeverityBadge(selectedLog?.severity)}
                  </div>
                </div>
              </div>

              <div className="space-y-spacing-2xs">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Descrição</h4>
                <div className="bg-muted/30 p-spacing-md rounded-premium text-premium-sm border border-border/20 italic font-serif">
                  {selectedLog?.description}
                </div>
              </div>
            </div>

            <div className="space-y-spacing-2xs">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Payload / Metadata</h4>
              <pre className="bg-zinc-950 text-zinc-50 p-spacing-md rounded-premium text-[11px] font-mono overflow-auto max-h-[300px] border border-white/5">
                {JSON.stringify(selectedLog?.metadata, null, 2)}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSelectedLog(null)} className="rounded-premium-full font-bold uppercase tracking-widest text-[10px]">
              Fechar Detalhes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="text-center pt-spacing-xl opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          AD MAIOREM DEI GLORIAM — Security Audit Module
        </p>
      </footer>
    </div>
  );
};

export default SecurityDashboard;