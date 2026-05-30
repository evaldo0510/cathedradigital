import { Button } from '@/components/ui/button';
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
  texto_base?: string;
  explicacao?: string;
  interpretacao_profunda?: string;
  aplicacao_pratica?: string;
  reflexao_final?: string;
  exercicio?: string;
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

  const exportIntegrityToCSV = () => {
    const headers = ['§', 'Texto', 'Explicação', 'Profundo', 'Aplicação', 'Exercício'];
    const rows = cache.map(item => [
      item.paragraph,
      item.content?.length > 50 ? 'OK' : 'Incompleto',
      item.explicacao?.length > 10 ? 'OK' : 'Incompleto',
      item.interpretacao_profunda?.length > 10 ? 'OK' : 'Incompleto',
      item.aplicacao_pratica?.length > 10 ? 'OK' : 'Incompleto',
      item.exercicio?.length > 10 ? 'OK' : 'Incompleto'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `catechism_integrity_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportIntegrityToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Integridade do Catecismo', 14, 22);
    
    const tableData = cache.slice(0, 100).map(item => [
      item.paragraph,
      item.content?.length > 50 ? 'OK' : 'X',
      item.explicacao?.length > 10 ? 'OK' : 'X',
      item.interpretacao_profunda?.length > 10 ? 'OK' : 'X',
      item.aplicacao_pratica?.length > 10 ? 'OK' : 'X',
      item.exercicio?.length > 10 ? 'OK' : 'X'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['§', 'Texto', 'Explicação', 'Profundo', 'Aplicação', 'Exercício']],
      body: tableData,
    });

    doc.save(`catechism_integrity_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-xl">
        <Icons.Lock className="w-3xl h-3xl text-destructive mb-md opacity-20" />
        <h2 className="text-xl font-bold mb-xs">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta área é exclusiva para administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-lg space-y-xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Depuração do Catecismo</h1>
          <p className="text-sm text-muted-foreground">Monitore o estado da geração automática via IA</p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Button 
            onClick={loadData}
            disabled={loading}
            className="p-xs rounded-full bg-card border border-border hover:bg-primary/10 transition-all disabled:opacity-50"
            title="Atualizar"
          >
            <Icons.RotateCcw className={`w-md h-md ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={reprocessAllErrors}
            disabled={isReprocessing || stats.pending === 0}
            className="px-md py-xs rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-xs"
          >
            <Icons.Zap className="w-sm h-sm" /> Reprocessar Erros
          </Button>
          <Button 
            onClick={reprocessIncomplete}
            disabled={isReprocessing}
            className="px-md py-xs rounded-full bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
          >
            <Icons.PenTool className="w-sm h-sm" /> Reparar Incompletos
          </Button>
          <Button 
            onClick={() => window.location.href = '/catechism/integrity'}
            className="px-md py-xs rounded-full bg-blue-500 text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-xs shadow-md"
          >
            <Icons.Activity className="w-sm h-sm" /> Painel de Integridade
          </Button>
          <Button 
            onClick={clearInvalidCache}
            className="px-md py-xs rounded-full bg-destructive/10 text-destructive text-xs font-black uppercase tracking-widest hover:bg-destructive/20 transition-all flex items-center gap-xs"
          >
            <Icons.Trash2 className="w-sm h-sm" /> Limpar Inválidos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total no Banco</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-success text-green-500">Gerados OK</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.generated}</div>
        </div>
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Pendentes (402)</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.pending}</div>
        </div>
        <div className="bg-card border border-border rounded-premium p-md">
          <span className="text-xs font-black uppercase tracking-widest text-destructive">Inválidos/Curtos</span>
          <div className="text-2xl font-serif font-bold text-foreground">{stats.invalid}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-premium overflow-hidden shadow-md">
        <div className="p-md border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-xs bg-background/50 border border-border rounded-premium p-2xs">
              <Button 
                onClick={() => setView('cache')}
                className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${view === 'cache' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Cache
              </Button>
              <Button 
                onClick={() => setView('logs')}
                className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${view === 'logs' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Logs
              </Button>
              <Button 
                onClick={() => setView('integrity')}
                className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${view === 'integrity' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Integridade
              </Button>
            </div>
            {view === 'cache' && (
              <div className="flex items-center gap-xs bg-background/50 border border-border rounded-premium p-2xs">
                <Button onClick={() => setFilter('all')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Todos</Button>
                <Button onClick={() => setFilter('generated')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'generated' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Sucesso</Button>
                <Button onClick={() => setFilter('error')} className={`px-sm py-2xs text-xs font-black uppercase tracking-widest rounded-full transition-all ${filter === 'error' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Erros</Button>
              </div>
            )}
            {view === 'integrity' && (
              <div className="flex items-center gap-xs">
                <Button 
                  onClick={exportIntegrityToCSV}
                  className="p-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  title="Exportar CSV"
                >
                  <Icons.FileText className="w-sm h-sm" />
                </Button>
                <Button 
                  onClick={exportIntegrityToPDF}
                  className="p-xs rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all"
                  title="Exportar PDF"
                >
                  <Icons.Download className="w-sm h-sm" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-md">
            {view === 'logs' && (
              <div className="flex items-center gap-xs">
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-background border border-border rounded px-xs py-2xs text-xs"
                />
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-background border border-border rounded px-xs py-2xs text-xs"
                />
                <Button 
                  onClick={exportLogsToCSV}
                  className="p-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  title="Exportar CSV"
                >
                  <Icons.FileText className="w-sm h-sm" />
                </Button>
                <Button 
                  onClick={exportLogsToPDF}
                  className="p-xs rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all"
                  title="Exportar PDF"
                >
                  <Icons.Download className="w-sm h-sm" />
                </Button>
              </div>
            )}
            <span className="text-xs text-muted-foreground uppercase font-black">
              {view === 'cache' ? `Mostrando ${filteredCache.length} registros` : `Últimas 100 execuções`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {view === 'cache' ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-lg py-md">§</th>
                  <th className="px-lg py-md">Status</th>
                  <th className="px-lg py-md">Retentativas</th>
                  <th className="px-lg py-md">Prévia / Erro</th>
                  <th className="px-lg py-md text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCache.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-2xl text-center text-muted-foreground italic">Nenhum registro encontrado com este filtro</td>
                  </tr>
                ) : (
                  filteredCache.map(item => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-lg py-md font-bold text-primary font-serif">§{item.paragraph}</td>
                      <td className="px-lg py-md">
                        {item.status === 'generated' ? (
                          <span className="flex items-center gap-2xs text-xs text-green-600 dark:text-green-400 font-bold">
                            <Icons.CheckCircle className="w-sm h-sm" /> Gerado
                          </span>
                        ) : item.status === 'official' ? (
                          <span className="flex items-center gap-2xs text-xs text-blue-500 font-bold">
                            <Icons.CheckCircle className="w-sm h-sm" /> Oficial
                          </span>
                        ) : item.status === 'error_402' ? (
                          <span className="flex items-center gap-2xs text-xs text-orange-500 font-bold">
                            <Icons.AlertTriangle className="w-sm h-sm" /> Créditos (402)
                          </span>
                        ) : (
                          <span className="flex items-center gap-2xs text-xs text-destructive font-bold">
                            <Icons.XCircle className="w-sm h-sm" /> Falha
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-md font-mono text-xs">{item.retry_count} / 3</td>
                      <td className="px-lg py-md max-w-xs md:max-w-sm">
                        <p className="text-xs truncate text-muted-foreground">
                          {item.status === 'generated' || item.status === 'official' ? item.content : (item.last_error || 'Erro desconhecido')}
                        </p>
                      </td>
                      <td className="px-lg py-md text-right">
                        <Button 
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
                          className="p-xs rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all disabled:opacity-30"
                        >
                          <Icons.RotateCcw className="w-sm h-sm" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : view === 'logs' ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-lg py-md">§</th>
                  <th className="px-lg py-md">Status</th>
                  <th className="px-lg py-md">Duração</th>
                  <th className="px-lg py-md">Mensagem</th>
                  <th className="px-lg py-md text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-2xl text-center text-muted-foreground italic">Nenhum log de execução encontrado</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-lg py-md font-bold text-primary font-serif">§{log.paragraph}</td>
                      <td className="px-lg py-md">
                        <span className={`text-xs font-black uppercase tracking-widest px-xs py-3xs rounded-full ${
                          log.status === 'generated' || log.status === 'official' || log.status === 'static' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          log.status === 'error_402' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-lg py-md font-mono text-xs text-muted-foreground">{log.duration_ms}ms</td>
                      <td className="px-lg py-md text-xs text-muted-foreground truncate max-w-xs">{log.error_message || '-'}</td>
                      <td className="px-lg py-md text-right text-xs text-muted-foreground font-medium">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-xl space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {[
                  { label: 'Texto Oficial', field: 'content' },
                  { label: 'Explicação', field: 'explicacao' },
                  { label: 'Prática', field: 'aplicacao_pratica' }
                ].map(item => {
                  const filled = cache.filter(c => c[item.field as keyof CacheEntry] && (c[item.field as keyof CacheEntry] as string).length > 20).length;
                  const percent = Math.round((filled / 2865) * 100);
                  return (
                    <div key={item.field} className="space-y-xs">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>{item.label}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-xs bg-muted rounded-premium overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border border-border rounded-premium overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <th className="px-md py-sm">Parágrafo</th>
                      <th className="px-md py-sm">Texto</th>
                      <th className="px-md py-sm">Explicação</th>
                      <th className="px-md py-sm">Profundo</th>
                      <th className="px-md py-sm">Aplicação</th>
                      <th className="px-md py-sm">Exercício</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cache.slice(0, 50).map(item => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="px-md py-sm font-bold">§{item.paragraph}</td>
                        <td className="px-md py-sm text-center">{item.content?.length > 50 ? '✅' : '❌'}</td>
                        <td className="px-md py-sm text-center">{item.explicacao?.length > 10 ? '✅' : '❌'}</td>
                        <td className="px-md py-sm text-center">{item.interpretacao_profunda?.length > 10 ? '✅' : '❌'}</td>
                        <td className="px-md py-sm text-center">{item.aplicacao_pratica?.length > 10 ? '✅' : '❌'}</td>
                        <td className="px-md py-sm text-center">{item.exercicio?.length > 10 ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatechismDebug;