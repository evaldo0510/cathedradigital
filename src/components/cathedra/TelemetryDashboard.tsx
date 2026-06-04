import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Icons } from '@/constants';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const TelemetryDashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      // Nota: Em um ambiente real, leríamos da tabela 'security_logs' ou similar filtrando por tipo
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const downloadTelemetry = (format: 'json' | 'csv') => {
    const data = format === 'json' 
      ? JSON.stringify(filteredLogs, null, 2)
      : "ID,Data,Rota,Tipo,Acao,Contexto\n" + filteredLogs.map(log => 
          `${log.id},${log.created_at},"${log.metadata?.route || ''}",${log.event_type},"${log.action || ''}","${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`
        ).join("\n");
    
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-mobile-${new Date().toISOString()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Telemetria exportada em ${format.toUpperCase()}`);
  };

  const filteredLogs = logs.filter(log => 
    JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())
  );


  return (
    <div className="max-w-6xl mx-auto p-spacing-lg space-y-spacing-xl">
      <div className="flex flex-col gap-spacing-md">
        <CathedraButton variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
          <Icons.ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
        </CathedraButton>
        <div className="flex items-center justify-between">
          <h1 className="text-premium-2xl font-black tracking-tight flex items-center gap-spacing-sm">
            <Icons.Activity className="text-primary" /> Telemetria Mobile
          </h1>
          <div className="flex items-center gap-spacing-md">
            <CathedraButton 
              variant="outline" 
              size="sm" 
              onClick={() => downloadTelemetry('csv')}
              className="rounded-premium-full h-spacing-xl"
            >
              <Icons.Download className="w-spacing-sm h-spacing-sm mr-spacing-xs" /> CSV
            </CathedraButton>
             <Input 

              placeholder="Buscar por ID, Rota..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs rounded-premium-full"
            />
          </div>
        </div>
      </div>

      <CathedraCard className="p-0 overflow-hidden">
        <ScrollArea className="h-[70vh]">
          <table className="w-full text-left text-premium-xs">
            <thead className="bg-muted/30 border-b border-border/50 sticky top-0 z-10">
              <tr>
                <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Data/Hora</th>
                <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Rota</th>
                <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Ação / Erro</th>
                <th className="p-spacing-md font-black uppercase tracking-widest opacity-50 text-right">Contexto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-primary/[0.01] transition-colors">
                  <td className="p-spacing-md font-mono opacity-60">
                    {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss')}
                  </td>
                  <td className="p-spacing-md font-bold text-primary/80">
                    {log.metadata?.route || '/'}
                  </td>
                  <td className="p-spacing-md">
                    <Badge variant={log.event_type === 'error' ? 'destructive' : 'outline'} className="rounded-premium-full">
                      {log.action || log.event_type}
                    </Badge>
                  </td>
                  <td className="p-spacing-md text-right">
                    <CathedraButton size="sm" variant="ghost" onClick={() => console.log(log.metadata)}>
                      Ver Detalhes
                    </CathedraButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && !loading && (
            <div className="p-spacing-4xl text-center opacity-40 italic">Nenhum evento encontrado.</div>
          )}
        </ScrollArea>
      </CathedraCard>
    </div>
  );
};

export default TelemetryDashboard;
