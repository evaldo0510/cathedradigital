import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Icons } from '@/constants';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';

const NavigationErrorInspector: React.FC = () => {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedError, setSelectedError] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchErrors = async () => {
      // Buscando logs de segurança/telemetria filtrando por erros de navegação ou UI
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .or('event_type.eq.error,action.eq.type_error')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) setErrors(data);
      setLoading(false);
    };

    fetchErrors();
  }, []);

  const filteredErrors = errors.filter(err => 
    JSON.stringify(err).toLowerCase().includes(filter.toLowerCase())
  );

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
          <div className="flex items-center gap-spacing-md">
             <Input 
              placeholder="Buscar por request_id, rota..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs rounded-premium-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-lg">
        <CathedraCard className="lg:col-span-1 p-0 overflow-hidden h-[70vh] flex flex-col">
          <div className="p-spacing-md bg-muted/20 border-b border-border/10 font-bold text-premium-xs uppercase tracking-widest">
            Log de Eventos
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/10">
              {filteredErrors.map((err) => (
                <div 
                  key={err.id} 
                  onClick={() => setSelectedError(err)}
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
      </div>
    </div>
  );
};

export default NavigationErrorInspector;
