import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

const NavigationErrorInspector: React.FC = () => {
  const [errors, setErrors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedError, setSelectedError] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState('errors');
  const [auditFilterUser, setAuditFilterUser] = useState('');
  const navigate = useNavigate();

  const handleImportLegacy = (rawData: any) => {
    // Compatibilidade retroativa: se for array, migra para o formato v2.1
    if (Array.isArray(rawData)) {
      return {
        version: 'v2.0-legacy',
        exported_at: new Date().toISOString(),
        data: rawData
      };
    }
    return rawData;
  };

  const fetchErrors = async () => {
    let query = supabase
      .from('security_logs')
      .select('*')
      .or('event_type.eq.error,action.eq.type_error')
      .order('created_at', { ascending: false });

    if (dateRange.from) query = query.gte('created_at', dateRange.from);
    if (dateRange.to) query = query.lte('created_at', dateRange.to);

    const { data, error } = await query.limit(100);
    if (!error && data) setErrors(data);
  };


  const fetchAuditLogs = async () => {
    let query = supabase
      .from('telemetry_audit_logs')
      .select('*, profiles(name)')
      .order('inspected_at', { ascending: false });

    if (dateRange.from) query = query.gte('inspected_at', dateRange.from);
    if (dateRange.to) query = query.lte('inspected_at', dateRange.to);

    const { data, error } = await query;
    if (!error && data) setAuditLogs(data);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchErrors(), fetchAuditLogs()]);
      setLoading(false);
    };
    loadData();
  }, [dateRange]);

  const recordInspection = async (requestId: string) => {
    await supabase.from('telemetry_audit_logs').insert({ 
      request_id: requestId,
      masked_ip: '127.0.0.***' 
    });
    fetchAuditLogs();
  };

  const filteredErrors = errors.filter(err => 
    JSON.stringify(err).toLowerCase().includes(filter.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => {
    const userMatch = !auditFilterUser || (log.profiles?.name || 'Admin').toLowerCase().includes(auditFilterUser.toLowerCase());
    const generalMatch = !filter || JSON.stringify(log).toLowerCase().includes(filter.toLowerCase());
    return userMatch && generalMatch;
  });

  const downloadReport = (type: 'errors' | 'audit', formatExt: 'json' | 'csv') => {
    const dataToExport = type === 'errors' ? filteredErrors : filteredAuditLogs;
    const fileName = type === 'errors' ? 'ui-failures' : 'inspection-audit';
    const SCHEMA_VERSION = 'v2.1'; // Versionamento do formato de exportação
    
    let content = '';
    if (formatExt === 'json') {
      content = JSON.stringify({
        version: SCHEMA_VERSION,
        exported_at: new Date().toISOString(),
        data: dataToExport
      }, null, 2);
    } else {
      if (type === 'errors') {
        content = `FormatVersion,${SCHEMA_VERSION}\n` +
          "ID,RequestID,Data,Rota,Mensagem,Viewport,Dispositivo,EvidenciaURL\n" + dataToExport.map(e => 
          `${e.id},${e.metadata?.requestId || ''},${e.created_at},"${e.metadata?.route || ''}","${(e.metadata?.message || '').replace(/"/g, '""')}",${e.metadata?.viewport || ''},${e.metadata?.isMobile ? 'Mobile' : 'Desktop'},"${e.metadata?.screenshotUrl || ''}"`
        ).join("\n");
      } else {
        content = `FormatVersion,${SCHEMA_VERSION}\n` +
          "ID,Inspetor,RequestID,DataHora,IP\n" + dataToExport.map(a => 
          `${a.id},"${a.profiles?.name || 'Admin'}",${a.request_id},${a.inspected_at},${a.masked_ip}`
        ).join("\n");
      }
    }


    
    const blob = new Blob([content], { type: formatExt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cathedra-${fileName}-${new Date().toISOString()}.${formatExt}`;
    a.click();
    toast.success(`Relatório ${formatExt.toUpperCase()} exportado.`);
  };

  return (
    <div className="max-w-7xl mx-auto p-spacing-lg space-y-spacing-xl pb-spacing-4xl">
      <div className="flex flex-col gap-spacing-md">
        <CathedraButton variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
          <Icons.ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
        </CathedraButton>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-premium-2xl font-black tracking-tight flex items-center gap-spacing-sm">
              <Icons.ShieldAlert className="text-destructive" /> Inspetor de Falhas UI
            </h1>
            <p className="text-muted-foreground text-premium-sm">Diagnóstico de TypeErrors e falhas de navegação mobile.</p>
          </div>
          <div className="flex items-center gap-spacing-sm">
            {activeTab === 'audit' && (
              <Input 
                placeholder="Filtrar por Inspetor..." 
                value={auditFilterUser}
                onChange={(e) => setAuditFilterUser(e.target.value)}
                className="max-w-[150px] rounded-premium-full"
              />
            )}
            <div className="flex gap-1 items-center bg-muted/20 p-1 rounded-premium-full border border-border/10">
              <Input 
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="h-8 border-none bg-transparent text-[10px] w-[110px]"
              />
              <span className="text-[10px] opacity-30">até</span>
              <Input 
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="h-8 border-none bg-transparent text-[10px] w-[110px]"
              />
            </div>
            <CathedraButton 
              variant="outline" 
              size="sm" 
              onClick={() => downloadReport(activeTab === 'errors' ? 'errors' : 'audit', 'json')} 
              className="rounded-premium-full mr-2"
            >
              <Icons.Code className="w-4 h-4 mr-2" /> JSON
            </CathedraButton>
            <CathedraButton 
              variant="outline" 
              size="sm" 
              onClick={() => downloadReport(activeTab === 'errors' ? 'errors' : 'audit', 'csv')} 
              className="rounded-premium-full"
            >
              <Icons.Download className="w-4 h-4 mr-2" /> CSV
            </CathedraButton>

             <Input 
              placeholder="Buscar..." 

              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs rounded-premium-full"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-spacing-lg">
        <TabsList className="bg-muted/30 p-1 rounded-premium-full border border-border/10">
          <TabsTrigger value="errors" className="rounded-premium-full text-premium-xs font-black uppercase tracking-widest px-spacing-xl">
            <Icons.Activity className="w-3 h-3 mr-2" /> Falhas Detectadas
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-premium-full text-premium-xs font-black uppercase tracking-widest px-spacing-xl">
            <Icons.ShieldCheck className="w-3 h-3 mr-2" /> Trilha de Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-lg animate-in fade-in duration-500">
          <CathedraCard className="lg:col-span-1 p-0 overflow-hidden h-[70vh] flex flex-col">
            <div className="p-spacing-md bg-muted/20 border-b border-border/10 font-bold text-premium-xs uppercase tracking-widest">
              Log de Eventos
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/10">
                {filteredErrors.map((err) => (
                  <div 
                    key={err.id} 
                    onClick={() => {
                      setSelectedError(err);
                      recordInspection(err.metadata?.requestId || err.id);
                    }}
                    className={`p-spacing-md cursor-pointer transition-colors hover:bg-primary/5 ${selectedError?.id === err.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="destructive" className="text-[8px] uppercase">{err.metadata?.type || 'UI_ERROR'}</Badge>
                      <span className="text-[10px] font-mono opacity-40">{format(new Date(err.created_at), 'HH:mm:ss')}</span>
                    </div>
                    <div className="text-premium-sm font-bold truncate text-primary/80">{err.metadata?.route || '/'}</div>
                    <div className="text-[10px] font-mono opacity-60 truncate mt-1">ID: {err.metadata?.requestId || err.id.split('-')[0]}</div>
                  </div>
                ))}
                {filteredErrors.length === 0 && !loading && (
                  <div className="p-spacing-xl text-center opacity-40 italic text-premium-sm">Nenhuma falha encontrada.</div>
                )}
              </div>
            </ScrollArea>
          </CathedraCard>

          <CathedraCard className="lg:col-span-2 p-spacing-xl overflow-hidden min-h-[70vh]">
            {selectedError ? (
              <div className="space-y-spacing-xl animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-premium-xl font-bold text-primary">Detalhes da Ocorrência</h2>
                    <p className="text-muted-foreground text-premium-xs font-mono">{selectedError.metadata?.requestId}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="rounded-premium-full mb-1">{selectedError.metadata?.viewport || 'unknown'}</Badge>
                    <div className="text-[10px] opacity-40 uppercase font-black">{format(new Date(selectedError.created_at), 'PPPP p')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-spacing-md">
                  <div className="p-spacing-md bg-muted/20 rounded-premium-lg border border-border/10">
                    <span className="text-[9px] font-black uppercase opacity-40 block mb-1">Rota</span>
                    <span className="text-premium-sm font-bold">{selectedError.metadata?.route}</span>
                  </div>
                  <div className="p-spacing-md bg-muted/20 rounded-premium-lg border border-border/10">
                    <span className="text-[9px] font-black uppercase opacity-40 block mb-1">Dispositivo</span>
                    <span className="text-premium-sm font-bold">{selectedError.metadata?.isMobile ? 'Mobile' : 'Desktop'}</span>
                  </div>
                </div>

                <div className="space-y-spacing-sm">
                  <h3 className="text-premium-sm font-black uppercase tracking-widest opacity-60">Mensagem de Erro</h3>
                  <div className="p-spacing-md bg-destructive/5 text-destructive rounded-premium-lg border border-destructive/10 font-mono text-premium-sm">
                    {selectedError.metadata?.message || 'Erro sem mensagem descritiva.'}
                  </div>
                </div>

                <div className="space-y-spacing-sm">
                  <h3 className="text-premium-sm font-black uppercase tracking-widest opacity-60">Stack Trace</h3>
                  <ScrollArea className="h-48 rounded-premium-lg border border-border/10 bg-primary/[0.02]">
                    <pre className="p-spacing-md text-[10px] font-mono leading-relaxed opacity-70 whitespace-pre-wrap">
                      {selectedError.metadata?.stack || 'Nenhum stack trace disponível.'}
                    </pre>
                  </ScrollArea>
                </div>

                {selectedError.metadata?.screenshotUrl && (
                  <div className="space-y-spacing-sm">
                    <h3 className="text-premium-sm font-black uppercase tracking-widest opacity-60">Evidência Visual</h3>
                    <div className="rounded-premium-xl border border-border/20 overflow-hidden shadow-premium">
                      <img src={selectedError.metadata.screenshotUrl} alt="Erro de UI" className="w-full h-auto" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-spacing-md">
                <Icons.Search size={48} />
                <p className="font-serif italic text-premium-lg">Selecione uma falha ao lado para inspecionar os metadados técnicos.</p>
              </div>
            )}
          </CathedraCard>
        </TabsContent>

        <TabsContent value="audit" className="animate-in fade-in duration-500">
          <CathedraCard className="p-0 overflow-hidden">
            <ScrollArea className="h-[70vh]">
              <table className="w-full text-left text-premium-xs">
                <thead className="bg-muted/30 border-b border-border/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Data/Hora</th>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Inspetor</th>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Request ID</th>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50 text-right">IP Mascarado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-primary/[0.01] transition-colors">

                      <td className="p-spacing-md font-mono opacity-60">
                        {format(new Date(log.inspected_at), 'dd/MM/yy HH:mm:ss')}
                      </td>
                      <td className="p-spacing-md font-bold text-primary/80">
                        {log.profiles?.name || 'Admin'}
                      </td>
                      <td className="p-spacing-md font-mono text-primary/60">
                        {log.request_id}
                      </td>
                      <td className="p-spacing-md text-right font-mono opacity-40">
                        {log.masked_ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && !loading && (
                <div className="p-spacing-4xl text-center opacity-40 italic">Nenhum registro de auditoria.</div>
              )}
            </ScrollArea>
          </CathedraCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NavigationErrorInspector;
