import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card as CathedraCard, CardHeader, CardTitle, CardContent } from '@/components/cathedra/CathedraCard';
import { CathedraButton } from '@/components/cathedra/CathedraButton';
import { Icons } from '@/constants';
import { CathedraIcon, IconSizePreset } from '@/components/cathedra/CathedraIcon';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string | null;
  event_type: string;
  path: string;
  metadata: any;
  created_at: string;
  profiles?: {
    name: string;
  } | null;
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pathFilter, setPathFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      if (pathFilter) {
        query = query.ilike('path', `%${pathFilter}%`);
      }

      if (dateFilter) {
        query = query.gte('created_at', `${dateFilter}T00:00:00Z`)
                     .lte('created_at', `${dateFilter}T23:59:59Z`);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setLogs(data as any[] || []);
    } catch (err: any) {
      toast.error('Erro ao buscar logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [pathFilter, dateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-premium-balance">Logs de Auditoria</h1>
          <p className="text-muted-foreground">Monitore tentativas de acesso e eventos de segurança.</p>
        </div>
        <CathedraButton onClick={fetchLogs} isLoading={loading} variant="outline" size="sm" icon={<Icons.RotateCcw className="w-4 h-4 mr-2" />}>
          Atualizar
        </CathedraButton>
      </div>

      <CathedraCard variant="glass" padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/60">Filtrar por Rota</label>
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Ex: /admin" 
                value={pathFilter} 
                onChange={(e) => setPathFilter(e.target.value)} 
                className="pl-10 bg-background/50 border-primary/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-primary/60">Filtrar por Data</label>
            <Input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="bg-background/50 border-primary/10"
            />
          </div>
        </div>
      </CathedraCard>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <CathedraCard className="py-20 text-center">
            <p className="text-muted-foreground italic">Nenhum log encontrado para os filtros selecionados.</p>
          </CathedraCard>
        ) : (
          logs.map((log) => (
            <CathedraCard key={log.id} variant="default" padding="none" className="overflow-hidden hover:border-primary/30 transition-all">
              <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                <div className="flex items-center gap-3 md:w-1/4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <CathedraIcon icon={Icons.ShieldAlert} size={IconSizePreset.TINY} variant="muted" containerClassName="bg-transparent border-none p-0 w-auto h-auto" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{log.event_type === 'unauthorized_access' ? 'Acesso Não Autorizado' : log.event_type}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>

                <div className="md:w-1/4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Rota Tentada</p>
                  <code className="text-xs bg-primary/5 px-2 py-1 rounded border border-primary/10">{log.path}</code>
                </div>

                <div className="md:w-1/4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Usuário</p>
                  <p className="text-sm">{log.profiles?.name || 'Anônimo'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{log.user_id || 'ID não disponível'}</p>
                </div>

                <div className="md:w-1/4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Dispositivo / Origem</p>
                  <p className="text-[10px] leading-relaxed line-clamp-2">
                    {log.metadata?.userAgent?.substring(0, 100)}...
                  </p>
                  <p className="text-[10px] text-primary/60 mt-1">Referrer: {log.metadata?.referrer}</p>
                </div>
              </div>
            </CathedraCard>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
