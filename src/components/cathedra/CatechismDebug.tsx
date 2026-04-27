import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CacheEntry {
  id: string;
  paragraph: number;
  content: string;
  status: 'generated' | 'error_402' | 'error' | 'official' | 'static';
  last_error: string | null;
  retry_count: number;
  created_at: string;
}

interface ExecutionLog {
  id: string;
  paragraph: number;
  status: string;
  duration_ms: number;
  error_message: string | null;
  admin_id: string | null;
  created_at: string;
}

const CatechismDebug: React.FC = () => {
  const { profile } = useAuth();
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'generated' | 'error' | 'incomplete'>('all');
  const [view, setView] = useState<'cache' | 'logs' | 'integrity'>('cache');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [integrityData, setIntegrityData] = useState<any[]>([]);


  const isAdmin = profile?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    const [cacheRes, logsRes] = await Promise.all([
      supabase
        .from('catechism_cache')
        .select('*')
        .order('paragraph', { ascending: true }),
      supabase
        .from('catechism_execution_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    if (cacheRes.error) toast.error('Erro ao carregar cache');
    else setCache(cacheRes.data as CacheEntry[]);

    if (logsRes.error) console.error('Erro ao carregar logs:', logsRes.error);
    else setLogs(logsRes.data as ExecutionLog[]);
    
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const reprocessAllErrors = async () => {
    if (!isAdmin) return;
    const pending = cache.filter(c => c.status === 'error_402' || c.status === 'error');
    if (pending.length === 0) {
      toast.info('Nenhum parágrafo com erro para reprocessar');
      return;
    }

    setIsReprocessing(true);
    let successCount = 0;
    let failCount = 0;

    toast.loading(`Reprocessando ${pending.length} parágrafos...`, { id: 'reprocess' });

    // Process in chunks to respect concurrency limit
    const CHUNK_SIZE = 5;
    for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
      const chunk = pending.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (item) => {
        if (item.retry_count >= 5) return;
        try {
          const { data, error } = await supabase.functions.invoke('catechism-text', {
            body: { paragraph: item.paragraph, action: 'reprocess' }
          });
          if (!error && (data?.status === 'generated' || data?.status === 'official')) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }));
    }

    toast.dismiss('reprocess');
    toast.success(`Concluído: ${successCount} reprocessados, ${failCount} falharam.`);
    setIsReprocessing(false);
    loadData();
  };

  const reprocessIncomplete = async () => {
    if (!isAdmin) return;
    const incomplete = cache.filter(c => {
      const isActuallyIncomplete = !c.content || c.content.length < 50; // Basic check, will be refined in backend
      // In a real scenario, we'd check all fields, but frontend CacheEntry only has basic fields
      // The backend 'fix_incomplete' will do the deep check.
      return isActuallyIncomplete || c.status === 'error' || c.status === 'error_402';
    });

    if (incomplete.length === 0) {
      toast.info('Nenhum parágrafo incompleto para reprocessar');
      return;
    }

    setIsReprocessing(true);
    let successCount = 0;
    let failCount = 0;

    toast.loading(`Reparando ${incomplete.length} parágrafos...`, { id: 'reprocess-inc' });

    const CHUNK_SIZE = 5;
    for (let i = 0; i < incomplete.length; i += CHUNK_SIZE) {
      const chunk = incomplete.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (item) => {
        try {
          const { data, error } = await supabase.functions.invoke('catechism-text', {
            body: { paragraph: item.paragraph, action: 'fix_incomplete' }
          });
          if (!error && data?.status === 'generated') successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }));
    }

    toast.dismiss('reprocess-inc');
    toast.success(`Integridade: ${successCount} corrigidos, ${failCount} falharam.`);
    setIsReprocessing(false);
    loadData();
  };

  const exportLogsToPDF = () => {
    if (logs.length === 0) return;
    
    let filtered = logs;
    if (dateRange.start) filtered = filtered.filter(l => new Date(l.created_at) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(l => new Date(l.created_at) <= new Date(dateRange.end));

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Catechism Execution Logs', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Exportado em: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = filtered.map(l => [
      l.paragraph,
      l.status,
      `${l.duration_ms}ms`,
      l.error_message || '-',
      new Date(l.created_at).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Parágrafo', 'Status', 'Duração', 'Erro', 'Data']],
      body: tableData,
    });

    doc.save(`catechism_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const clearInvalidCache = async () => {
    if (!isAdmin) return;
    const invalid = cache.filter(c => c.content.length < 50);
    if (invalid.length === 0) {
      toast.info('Nenhum cache inválido detectado');
      return;
    }

    const { error } = await supabase
      .from('catechism_cache')
      .delete()
      .in('id', invalid.map(c => c.id));

    if (!error) {
      toast.success(`${invalid.length} registros removidos`);
      loadData();
    }
  };

  const exportLogsToCSV = () => {
    if (logs.length === 0) return;
    
    let filtered = logs;
    if (dateRange.start) filtered = filtered.filter(l => new Date(l.created_at) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(l => new Date(l.created_at) <= new Date(dateRange.end));

    const headers = ['ID', 'Parágrafo', 'Status', 'Duração(ms)', 'Erro', 'AdminID', 'Data'];
    const rows = filtered.map(l => [
      l.id,
      l.paragraph,
      l.status,
      l.duration_ms,
      `"${(l.error_message || '').replace(/"/g, '""')}"`,
      l.admin_id || '',
      new Date(l.created_at).toISOString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `catechism_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCache = cache.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'generated') return item.status === 'generated';
    if (filter === 'error') return item.status === 'error_402' || item.status === 'error';
    return true;
  });

  const stats = {
    total: cache.length,
    generated: cache.filter(c => c.status === 'generated' || c.status === 'official' || c.status === 'static').length,
    pending: cache.filter(c => c.status === 'error_402' || c.status === 'error').length,
    invalid: cache.filter(c => c.content.length < 50).length
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Icons.Lock className="w-16 h-16 text-destructive mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta área é exclusiva para administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Depuração do Catecismo</h1>
          <p className="text-sm text-muted-foreground">Monitore o estado da geração automática via IA</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all disabled:opacity-50"
            title="Atualizar"
          >
            <Icons.RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={reprocessAllErrors}
            disabled={isReprocessing || stats.pending === 0}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Icons.Zap className="w-3 h-3" /> Reprocessar Erros
          </button>
          <button 
            onClick={reprocessIncomplete}
            disabled={isReprocessing}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <Icons.Wrench className="w-3 h-3" /> Reparar Incompletos
          </button>
          <button 
            onClick={clearInvalidCache}
            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-black uppercase tracking-widest hover:bg-destructive/20 transition-all flex items-center gap-2"
          >
            <Icons.Trash2 className="w-3 h-3" /> Limpar Inválidos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total no Banco</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-success text-green-500">Gerados OK</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.generated}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Pendentes (402)</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.pending}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Inválidos/Curtos</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.invalid}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg p-1">
              <button 
                onClick={() => setView('cache')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${view === 'cache' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Cache
              </button>
              <button 
                onClick={() => setView('logs')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${view === 'logs' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Logs
              </button>
            </div>
            {view === 'cache' && (
              <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg p-1">
                <button onClick={() => setFilter('all')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Todos</button>
                <button onClick={() => setFilter('generated')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'generated' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Sucesso</button>
                <button onClick={() => setFilter('error')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'error' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Erros</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {view === 'logs' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-background border border-border rounded px-2 py-1 text-[10px]"
                />
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-background border border-border rounded px-2 py-1 text-[10px]"
                />
                <button 
                  onClick={exportLogsToCSV}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  title="Exportar CSV"
                >
                  <Icons.Download className="w-3 h-3" />
                </button>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground uppercase font-black">
              {view === 'cache' ? `Mostrando ${filteredCache.length} registros` : `Últimas 100 execuções`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {view === 'cache' ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-4">§</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Retentativas</th>
                  <th className="px-6 py-4">Prévia / Erro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCache.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Nenhum registro encontrado com este filtro</td>
                  </tr>
                ) : (
                  filteredCache.map(item => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary font-serif">§{item.paragraph}</td>
                      <td className="px-6 py-4">
                        {item.status === 'generated' ? (
                          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-bold">
                            <Icons.CheckCircle className="w-3 h-3" /> Gerado
                          </span>
                        ) : item.status === 'official' ? (
                          <span className="flex items-center gap-1.5 text-xs text-blue-500 font-bold">
                            <Icons.CheckCircle className="w-3 h-3" /> Oficial
                          </span>
                        ) : item.status === 'error_402' ? (
                          <span className="flex items-center gap-1.5 text-xs text-orange-500 font-bold">
                            <Icons.AlertTriangle className="w-3 h-3" /> Créditos (402)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-destructive font-bold">
                            <Icons.XCircle className="w-3 h-3" /> Falha
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{item.retry_count} / 3</td>
                      <td className="px-6 py-4 max-w-xs md:max-w-sm">
                        <p className="text-xs truncate text-muted-foreground">
                          {item.status === 'generated' || item.status === 'official' ? item.content : (item.last_error || 'Erro desconhecido')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          disabled={isReprocessing}
                          onClick={async () => {
                            const { data } = await supabase.functions.invoke('catechism-text', {
                              body: { paragraph: item.paragraph, action: 'reprocess' }
                            });
                            if (data?.status === 'generated' || data?.status === 'official') {
                              toast.success(`§${item.paragraph} reprocessado`);
                              loadData();
                            } else {
                              toast.error(`Falha ao reprocessar §${item.paragraph}`);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all disabled:opacity-30"
                        >
                          <Icons.RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-4">§</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Duração</th>
                  <th className="px-6 py-4">Mensagem</th>
                  <th className="px-6 py-4 text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Nenhum log de execução encontrado</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary font-serif">§{log.paragraph}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          log.status === 'generated' || log.status === 'official' || log.status === 'static' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          log.status === 'error_402' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{log.duration_ms}ms</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground truncate max-w-xs">{log.error_message || '-'}</td>
                      <td className="px-6 py-4 text-right text-[10px] text-muted-foreground font-medium">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatechismDebug;