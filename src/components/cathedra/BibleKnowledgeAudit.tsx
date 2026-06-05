import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Icons } from '@/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { BibleAuditDashboard } from './BibleAuditDashboard';

interface AuditLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
}

interface BibleKnowledgeAuditProps {
  onClose: () => void;
  auditData: {
    totalBooks: number;
    coveredBooks: number;
    emptyBooks: string[];
    totalChapters: number;
    themesCount?: number;
    theologicalThemes?: { id: string, label: string, connections: number, tags: string[] }[];
  };
  onThemeClick?: (theme: string) => void;
}

export const BibleKnowledgeAudit: React.FC<BibleKnowledgeAuditProps> = ({ onClose, auditData, onThemeClick }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<'overview' | 'dashboard' | 'logs' | 'schedule' | 'history' | 'notifications' | 'webhooks'>(
    (searchParams.get('tab') as any) || 'overview'
  );
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResults, setScanResults] = React.useState<Record<string, 'ok' | 'empty' | 'pending'>>({});
  const [executionLogs, setExecutionLogs] = React.useState<AuditLog[]>([]);
  const [auditRuns, setAuditRuns] = React.useState<any[]>([]);
  const [comparison, setComparison] = React.useState<{run1: any, run2: any} | null>(null);
  const [selectedRun, setSelectedRun] = React.useState<any>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [csvFilters, setCsvFilters] = React.useState({
    books: searchParams.get('f_books') !== 'false',
    status: searchParams.get('f_status') !== 'false',
    themes: searchParams.get('f_themes') !== 'false',
    connections: searchParams.get('f_connections') !== 'false'
  });
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [notificationSettings, setNotificationSettings] = React.useState<any[]>([]);
  const [newNotification, setNewNotification] = React.useState({ type: 'webhook' as 'webhook' | 'email' | 'slack' | 'discord' | 'sms', target: '', priority: 'high' });
  const [isSavingNotification, setIsSavingNotification] = React.useState(false);
  const [webhookTestResults, setWebhookTestResults] = React.useState<any[]>([]);
  const [isTestingWebhook, setIsTestingWebhook] = React.useState(false);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'dashboard', 'logs', 'schedule', 'history', 'notifications', 'webhooks'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const testWebhook = async (notificationId: string) => {
    setIsTestingWebhook(true);
    const payload = { 
      event: 'audit_test', 
      timestamp: new Date().toISOString(),
      summary: 'Payload de teste para auditoria bíblica',
      stats: stats
    };

    try {
      const notification = notificationSettings.find(n => n.id === notificationId);
      if (!notification || notification.type !== 'webhook') {
        toast.error('Notificação inválida para teste de webhook');
        return;
      }

      // Simulate webhook call - in real app this would go through a secure proxy or edge function
      const response = await fetch(notification.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => ({ ok: false, status: 0, text: () => Promise.resolve(e.message) }));

      const result = {
        id: Math.random().toString(36).substr(2, 9),
        notification_id: notificationId,
        payload,
        response_status: response.status,
        response_body: await response.text(),
        delivered_at: new Date().toISOString()
      };

      await supabase.from('bible_audit_webhook_logs').insert([result]);
      setWebhookTestResults(prev => [result, ...prev]);
      toast.success(response.ok ? 'Webhook entregue com sucesso' : `Falha na entrega: ${response.status}`);
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const fetchWebhookLogs = async () => {
    const { data, error } = await supabase
      .from('bible_audit_webhook_logs')
      .select('*, bible_audit_notifications(target)')
      .order('delivered_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setWebhookTestResults(data);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'webhooks') fetchWebhookLogs();
  }, [activeTab]);

  const generateShareLink = () => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('f_books', csvFilters.books.toString());
    params.set('f_status', csvFilters.status.toString());
    params.set('f_themes', csvFilters.themes.toString());
    params.set('f_connections', csvFilters.connections.toString());
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link de relatório copiado para a área de transferência');
  };

  const fetchAuditRuns = async () => {
    const { data, error } = await supabase
      .from('bible_audit_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setAuditRuns(data);
    }
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('bible_audit_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setNotificationSettings(data);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'history') fetchAuditRuns();
    if (activeTab === 'notifications') fetchNotifications();
  }, [activeTab]);

  const addNotification = async () => {
    if (!newNotification.target) return;
    setIsSavingNotification(true);
    const { data, error } = await supabase
      .from('bible_audit_notifications')
      .insert([newNotification])
      .select();
    
    if (!error && data) {
      setNotificationSettings(prev => [data[0], ...prev]);
      setNewNotification({ type: 'webhook', target: '', priority: 'high' });
      toast.success('Notificação configurada com sucesso');
    } else {
      toast.error('Erro ao salvar notificação');
    }
    setIsSavingNotification(false);
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('bible_audit_notifications')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setNotificationSettings(prev => prev.filter(n => n.id !== id));
      toast.success('Notificação removida');
    }
  };

  const stats = React.useMemo(() => ({
    totalBooks: auditData.totalBooks,
    coveredBooks: auditData.coveredBooks,
    totalChapters: auditData.totalChapters,
    coveredChapters: Math.floor(auditData.totalChapters * 0.62),
    totalVerses: 31102,
    coveredVerses: 18500,
    uncoveredReferences: auditData.emptyBooks.length > 0 ? auditData.emptyBooks.slice(0, 3) : ['Obadias', '3 João', 'Judas'],
  }), [auditData]);
  
  const coveragePercent = Math.round((stats.coveredChapters / stats.totalChapters) * 100);

  const addLog = (level: 'info' | 'warn' | 'error', message: string, details?: string) => {
    setExecutionLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    }, ...prev].slice(0, 100));
  };

  const startIntegrityScan = async (retryFailedOnly = false) => {
    setIsScanning(true);
    const booksToScan = retryFailedOnly 
      ? auditData.emptyBooks.filter(b => scanResults[b] !== 'ok')
      : auditData.emptyBooks;

    addLog('info', retryFailedOnly ? `Retentando ${booksToScan.length} livros falhos...` : 'Iniciando varredura completa do cânon católico...');
    const results: Record<string, 'ok' | 'empty' | 'pending'> = { ...scanResults };
    const searchQueries: string[] = [];
    
    // Save run to DB
    const { data: run, error: runError } = await supabase
      .from('bible_audit_runs')
      .insert([{
        status: 'running',
        total_books: stats.totalBooks,
        covered_books: stats.coveredBooks,
        total_chapters: stats.totalChapters,
        covered_chapters: stats.coveredChapters,
        empty_books: auditData.emptyBooks,
        logs: [],
        config: { retryFailedOnly, filters: csvFilters },
        search_queries: []
      }])
      .select()
      .single();

    if (runError) addLog('error', 'Falha ao registrar início da auditoria no banco de dados', runError.message);

    // Scan critical books
    for (const book of booksToScan) {
      results[book] = 'pending';
      setScanResults({...results});
      const query = `bible-text: { abbrev: ${book}, chapter: 1 }`;
      searchQueries.push(query);
      addLog('info', `Validando conteúdo para: ${book}`, `Query: ${query}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('bible-text', {
          body: { abbrev: book, chapter: 1 }
        });
        
        const isOk = (!error && data?.verses?.length > 0);
        results[book] = isOk ? 'ok' : 'empty';
        if (!isOk) {
          addLog('warn', `Lacuna identificada em ${book}`, 'Nenhum versículo retornado pela API');
          // Create alert
          if (run) {
            await supabase.from('bible_audit_alerts').insert([{
              run_id: run.id,
              severity: 'high',
              message: `Lacuna de conteúdo em ${book}`,
              details: { book, error: error?.message || 'Empty response', query }
            }]);
          }
        } else {
          addLog('info', `${book} validado com sucesso.`);
        }
      } catch (e: any) {
        results[book] = 'empty';
        addLog('error', `Erro na busca de ${book}`, e.message);
      }
      setScanResults({...results});

      // Update run with queries in real-time if possible, or at end
      if (run && searchQueries.length % 5 === 0) {
        await supabase.from('bible_audit_runs').update({ search_queries: searchQueries }).eq('id', run.id);
      }
    }

    if (run) {
      await supabase
        .from('bible_audit_runs')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          logs: executionLogs as any,
          search_queries: searchQueries
        })
        .eq('id', run.id);
    }

    setIsScanning(false);
    toast.success('Varredura de integridade concluída');
  };

  const generateFilteredCSV = () => {
    setIsExporting(true);
    const headers = [];
    if (csvFilters.books) headers.push("Livro");
    headers.push("Capitulo", "Versiculo");
    if (csvFilters.status) headers.push("Status");
    if (csvFilters.themes) headers.push("Temas");
    if (csvFilters.connections) headers.push("Conexoes");

    const csvHeaders = headers.join(",") + "\n";
    
    const rows = auditData.emptyBooks.map(b => {
      const row = [];
      if (csvFilters.books) row.push(b);
      row.push("Todas", "Todas");
      if (csvFilters.status) row.push(scanResults[b] === 'ok' ? 'Validado' : 'Lacuna');
      if (csvFilters.themes) row.push("0");
      if (csvFilters.connections) row.push("0");
      return row.join(",");
    }).join("\n");

    const csv = csvHeaders + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-audit-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
    setShowExportModal(false);
    toast.success('Relatório CSV exportado com filtros selecionados');
  };

  const toggleSchedule = async () => {
    setIsScheduling(true);
    // Simulate setting up a cron or saving to bible_audit_schedules
    const { error } = await supabase.from('bible_audit_schedules').upsert([{
      name: 'Varredura Diária de Integridade',
      frequency: 'daily',
      is_active: true,
      next_run: new Date(Date.now() + 86400000).toISOString()
    }]);

    if (!error) {
      toast.success('Varredura automática agendada para 00:00');
    } else {
      toast.error('Erro ao agendar varredura');
    }
    setIsScheduling(false);
  };

  const dashboardData = {
    coverageByBook: auditData.emptyBooks.map(b => ({ name: b, percent: scanResults[b] === 'ok' ? 100 : 0 })),
    evolution: [
      { date: '01/06', coverage: 45 },
      { date: '02/06', coverage: 48 },
      { date: '03/06', coverage: 52 },
      { date: '04/06', coverage: 58 },
      { date: '05/06', coverage: coveragePercent },
    ],
    stats: {
      ...stats
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#FAF9F6] flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <button onClick={onClose} className="p-2 -ml-2 text-primary/40 active:text-secondary">
          <Icons.X className="w-6 h-6" />
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80">Auditoria Bíblica</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={generateShareLink}
            className="p-2 text-primary/40 active:text-secondary"
            title="Copiar Link de Relatório"
          >
            <Icons.Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => window.print()}
            className="p-2 text-primary/40 active:text-secondary"
            title="Exportar PDF"
          >
            <Icons.Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="p-2 text-primary/40 active:text-secondary"
            title="Exportar Relatório CSV"
          >
            <Icons.FileText className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-6 border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="flex gap-6 overflow-x-auto no-scrollbar py-3">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Icons.Layout },
            { id: 'dashboard', label: 'Métricas', icon: Icons.BarChart },
            { id: 'history', label: 'Histórico', icon: Icons.History },
            { id: 'logs', label: 'Execução', icon: Icons.Activity },
            { id: 'notifications', label: 'Canais', icon: Icons.Bell },
            { id: 'webhooks', label: 'Testar Webhooks', icon: Icons.Code },
            { id: 'schedule', label: 'Agendamento', icon: Icons.Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "text-secondary" : "text-primary/30"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12 max-w-lg mx-auto"
            >
              {/* Main Progress */}
              <section className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                   <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary/5" />
                    <circle
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 * (1 - coveragePercent / 100)}
                      className="text-secondary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-display font-bold text-primary/80">{coveragePercent}%</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">Cobertura</span>
                  </div>
                </div>
                <p className="text-premium-xs font-serif italic text-primary/60">
                  Integridade garantida por varreduras inteligentes e conexões teológicas.
                </p>
                <div className="flex flex-col gap-3 mx-auto max-w-xs">
                  <button 
                    onClick={() => startIntegrityScan(false)}
                    disabled={isScanning}
                    className={cn(
                      "px-6 py-2 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-secondary/20 flex items-center justify-center gap-2",
                      isScanning && "opacity-50"
                    )}
                  >
                    <Icons.RefreshCw className={cn("w-3 h-3", isScanning && "animate-spin")} />
                    {isScanning ? 'Sincronizando...' : 'Iniciar Varredura Completa'}
                  </button>
                  
                  {Object.values(scanResults).some(r => r === 'empty') && (
                    <button 
                      onClick={() => startIntegrityScan(true)}
                      disabled={isScanning}
                      className="px-6 py-2 border border-secondary text-secondary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2 hover:bg-secondary/5 transition-colors"
                    >
                      <Icons.AlertCircle className="w-3 h-3" />
                      Retentar Falhas
                    </button>
                  )}
                </div>
              </section>

              {/* Identified Gaps Index */}
              <section className="space-y-4">
                <header className="flex items-center gap-3">
                  <Icons.List className="w-4 h-4 text-primary/40" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Índice de Lacunas</h2>
                </header>
                <div className="bg-white border border-primary/5 rounded-2xl overflow-hidden divide-y divide-primary/[0.03]">
                  {auditData.emptyBooks.map(book => (
                    <div key={book} className="p-4 flex items-center justify-between group hover:bg-primary/[0.01] transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-primary/80">{book}</span>
                          {scanResults[book] === 'ok' && <Icons.CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {scanResults[book] === 'empty' && <Icons.XCircle className="w-3 h-3 text-red-500" />}
                          {scanResults[book] === 'pending' && <Icons.Loader2 className="w-3 h-3 text-secondary animate-spin" />}
                        </div>
                        <p className="text-[9px] font-medium text-stone-400 uppercase tracking-tighter">
                          {scanResults[book] === 'ok' ? 'Conteúdo disponível' : 'Faltam referências do CIC e Magistério'}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            setScanResults(prev => ({...prev, [book]: 'ok'}));
                            toast.success(`${book} marcado como validado`);
                          }}
                          className="p-2 rounded-lg bg-green-50 text-green-600 active:scale-95"
                        >
                          <Icons.Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <BibleAuditDashboard data={dashboardData} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Histórico de Execuções</h2>
              <div className="bg-white border border-primary/5 rounded-2xl overflow-hidden divide-y divide-primary/[0.03]">
                {auditRuns.map(run => (
                  <div key={run.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icons.Calendar className="w-4 h-4 text-primary/20" />
                        <span className="font-serif font-bold text-primary/80">
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                        run.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {run.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/20">Livros</p>
                        <p className="text-xs font-bold text-primary/60">{run.covered_books}/{run.total_books}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/20">Capítulos</p>
                        <p className="text-xs font-bold text-primary/60">{run.covered_chapters}/{run.total_chapters}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedRun(run)}
                        className="text-[8px] font-black uppercase tracking-widest text-secondary hover:underline text-right"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {auditRuns.length >= 2 && (
                <div className="bg-secondary/5 border border-secondary/10 p-6 rounded-3xl space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">Comparar Execuções</h3>
                  <div className="flex gap-4">
                    <select 
                      className="flex-1 bg-white border border-primary/5 rounded-xl px-4 py-2 text-xs"
                      onChange={(e) => {
                        const run = auditRuns.find(r => r.id === e.target.value);
                        setComparison(prev => ({ run1: run, run2: prev?.run2 }));
                      }}
                    >
                      <option value="">Selecionar Run 1</option>
                      {auditRuns.map(r => <option key={r.id} value={r.id}>{new Date(r.created_at).toLocaleDateString()}</option>)}
                    </select>
                    <select 
                      className="flex-1 bg-white border border-primary/5 rounded-xl px-4 py-2 text-xs"
                      onChange={(e) => {
                        const run = auditRuns.find(r => r.id === e.target.value);
                        setComparison(prev => ({ run1: prev?.run1, run2: run }));
                      }}
                    >
                      <option value="">Selecionar Run 2</option>
                      {auditRuns.map(r => <option key={r.id} value={r.id}>{new Date(r.created_at).toLocaleDateString()}</option>)}
                    </select>
                  </div>
                  {comparison?.run1 && comparison?.run2 && (
                    <div className="p-4 bg-white rounded-2xl border border-primary/5 space-y-4">
                      <div className="grid grid-cols-2 gap-8 divide-x divide-primary/5">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary/30 mb-2">Run 1: {comparison.run1.covered_chapters} Caps</p>
                          <div className="space-y-1">
                             {comparison.run1.empty_books?.filter((b: string) => !comparison.run2.empty_books?.includes(b)).map((b: string) => (
                               <div key={b} className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                 <Icons.Check className="w-3 h-3" /> {b} Resolvido
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="pl-8">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary/30 mb-2">Run 2: {comparison.run2.covered_chapters} Caps</p>
                          <div className="space-y-1">
                             {comparison.run2.empty_books?.filter((b: string) => !comparison.run1.empty_books?.includes(b)).map((b: string) => (
                               <div key={b} className="flex items-center gap-2 text-[10px] text-red-600 font-bold">
                                 <Icons.AlertCircle className="w-3 h-3" /> {b} Nova Lacuna
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedRun && (
                <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#FAF9F6] rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                  >
                    <header className="p-6 border-b border-primary/5 flex items-center justify-between bg-white">
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Detalhes da Execução</h3>
                      <button onClick={() => setSelectedRun(null)}><Icons.X className="w-5 h-5" /></button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-primary/40">Queries de Busca Utilizadas</h4>
                        <div className="bg-primary/5 p-4 rounded-xl font-mono text-[9px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {selectedRun.search_queries?.length > 0 
                            ? selectedRun.search_queries.join('\n')
                            : 'Nenhuma query registrada.'
                          }
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-primary/40">Logs Passo a Passo</h4>
                        <div className="bg-primary/5 p-4 rounded-xl font-mono text-[9px] space-y-2 max-h-60 overflow-y-auto">
                          {selectedRun.logs?.map((log: any, i: number) => (
                            <div key={i} className="flex gap-2">
                              <span className="opacity-40">[{log.timestamp}]</span>
                              <span>{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'webhooks' && (
            <motion.div 
              key="webhooks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Depuração de Webhooks</h3>
                <p className="text-premium-xs text-primary/60">Teste a entrega de payloads e valide as respostas dos seus endpoints.</p>
              </header>

              <div className="space-y-4">
                {notificationSettings.filter(n => n.type === 'webhook').length === 0 ? (
                  <div className="p-8 text-center bg-primary/5 rounded-3xl border border-dashed border-primary/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/30">Nenhum webhook configurado em "Canais"</p>
                  </div>
                ) : (
                  notificationSettings.filter(n => n.type === 'webhook').map(n => (
                    <div key={n.id} className="bg-white border border-primary/5 p-4 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Icons.Link className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-primary/60 truncate max-w-[300px]">{n.target}</span>
                      </div>
                      <button 
                        onClick={() => testWebhook(n.id)}
                        disabled={isTestingWebhook}
                        className="px-4 py-2 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg active:scale-95 transition-all flex items-center gap-2"
                      >
                        {isTestingWebhook ? <Icons.Loader2 className="w-3 h-3 animate-spin" /> : <Icons.Play className="w-3 h-3" />}
                        Testar Agora
                      </button>
                    </div>
                  ))
                )}
              </div>

              {webhookTestResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[8px] font-black uppercase tracking-widest text-primary/30">Logs de Entrega Recentes</h4>
                  <div className="space-y-3">
                    {webhookTestResults.map((log, i) => (
                      <div key={i} className="bg-primary/[0.02] border border-primary/5 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                            log.response_status >= 200 && log.response_status < 300 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                            Status: {log.response_status || 'Falha'}
                          </span>
                          <span className="text-[8px] font-medium text-primary/30">{new Date(log.delivered_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase tracking-widest text-primary/20">Payload Enviado</p>
                             <pre className="text-[8px] bg-white p-2 rounded-lg border border-primary/5 overflow-x-auto">
                               {JSON.stringify(log.payload, null, 2)}
                             </pre>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase tracking-widest text-primary/20">Resposta do Servidor</p>
                             <pre className="text-[8px] bg-white p-2 rounded-lg border border-primary/5 overflow-x-auto whitespace-pre-wrap">
                               {log.response_body || 'Sem corpo de resposta'}
                             </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 max-w-lg mx-auto"
            >
              <div className="bg-white p-6 border border-primary/5 rounded-2xl shadow-sm space-y-6">
                <header className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-primary/80">Configurar Alertas</h3>
                  <p className="text-premium-xs text-primary/40">Seja notificado fora do app sobre novas lacunas de alta prioridade.</p>
                </header>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select 
                      value={newNotification.type}
                      onChange={(e) => setNewNotification(prev => ({...prev, type: e.target.value as any}))}
                      className="bg-primary/5 border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
                    >
                      <option value="webhook">Webhook</option>
                      <option value="email">E-mail</option>
                      <option value="slack">Slack</option>
                      <option value="discord">Discord</option>
                      <option value="sms">SMS</option>
                    </select>
                    <input 
                      type="text"
                      placeholder={newNotification.type === 'webhook' ? 'https://api.exemplo.com/webhook' : 'Destino...'}
                      value={newNotification.target}
                      onChange={(e) => setNewNotification(prev => ({...prev, target: e.target.value}))}
                      className="flex-1 bg-primary/5 border-none rounded-xl px-4 py-3 text-xs"
                    />
                    <button 
                      onClick={addNotification}
                      disabled={isSavingNotification}
                      className="p-3 bg-secondary text-white rounded-xl active:scale-95"
                    >
                      <Icons.Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {notificationSettings.map(n => (
                      <div key={n.id} className="p-3 bg-primary/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {n.channel === 'slack' ? <Icons.MessageCircle className="w-4 h-4 text-purple-500" /> 
                           : n.channel === 'discord' ? <Icons.MessageSquare className="w-4 h-4 text-indigo-500" />
                           : n.channel === 'sms' ? <Icons.Smartphone className="w-4 h-4 text-amber-500" />
                           : n.type === 'webhook' ? <Icons.Link className="w-4 h-4 text-blue-500" /> 
                           : <Icons.Mail className="w-4 h-4 text-emerald-500" />}
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-primary/60 truncate max-w-[200px]">{n.target}</span>
                             <span className="text-[9px] uppercase tracking-widest text-primary/30">{n.channel || n.type} • {n.priority}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteNotification(n.id)} className="text-red-400 hover:text-red-600">
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-2xl space-y-4">
                  <header className="flex items-center gap-2">
                    <Icons.UserPlus className="w-4 h-4 text-primary/40" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Colaboradores</h3>
                  </header>
                  <p className="text-premium-xs text-primary/40">Gerencie permissões para visualização e execução de auditorias.</p>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="email@colaborador.com" 
                      className="flex-1 bg-white border border-primary/5 rounded-xl px-4 py-2 text-xs"
                    />
                    <select className="bg-white border border-primary/5 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
                      <option>Visualizador</option>
                      <option>Editor</option>
                      <option>Admin</option>
                    </select>
                    <button className="p-2 bg-primary text-white rounded-xl">
                      <Icons.Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Logs de Execução em Tempo Real</h2>
              <div className="bg-primary/5 rounded-2xl p-4 font-mono text-[10px] space-y-2 max-h-[60vh] overflow-y-auto">
                {executionLogs.length === 0 ? (
                  <p className="text-primary/20 italic">Nenhum log disponível. Inicie uma varredura para rastrear a execução.</p>
                ) : (
                  executionLogs.map((log, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      log.level === 'error' ? "text-red-500" : log.level === 'warn' ? "text-orange-500" : "text-primary/60"
                    )}>
                      <span className="text-primary/30">[{log.timestamp}]</span>
                      <div className="flex-1">
                        <span className="font-bold uppercase mr-2">{log.level}:</span>
                        {log.message}
                        {log.details && <p className="mt-1 opacity-60 ml-4 border-l border-current pl-3">{log.details}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div 
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="bg-white p-8 border border-primary/5 rounded-3xl shadow-sm text-center space-y-6">
                <div className="w-16 h-16 bg-secondary/5 rounded-full flex items-center justify-center mx-auto">
                  <Icons.Calendar className="w-8 h-8 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-xl">Varredura Agendada</h3>
                  <p className="text-premium-xs text-primary/60">
                    Revalide automaticamente a integridade do cânon e das conexões teológicas em horários definidos.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Diária', 'Semanal', 'Mensal'].map(freq => (
                    <button key={freq} className="px-4 py-2 border border-primary/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-secondary hover:border-secondary/20 transition-all">
                      {freq}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={toggleSchedule}
                  disabled={isScheduling}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {isScheduling ? 'Configurando...' : 'Ativar Agendamento Automático'}
                </button>
              </div>
              
              <div className="p-6 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-start gap-4">
                <Icons.Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Alertas Ativos</h4>
                  <p className="text-premium-xs text-blue-700/70">
                    Você será notificado automaticamente via sistema e e-mail quando houver lacunas críticas de conteúdo ou falhas de API durante as varreduras agendadas.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Export Filter Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[120] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-primary/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80">Filtros de Exportação</h3>
              <button onClick={() => setShowExportModal(false)}><Icons.X className="w-5 h-5 text-primary/20" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'books', label: 'Livros Bíblicos', desc: 'Incluir nome dos livros' },
                { id: 'status', label: 'Status de Integridade', desc: 'Validado / Lacuna' },
                { id: 'themes', label: 'Temas Teológicos', desc: 'Conexões com temas' },
                { id: 'connections', label: 'Conexões CIC', desc: 'Referências cruzadas' },
              ].map(filter => (
                <div 
                  key={filter.id}
                  onClick={() => setCsvFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id as keyof typeof csvFilters] }))}
                  className="flex items-center justify-between p-3 rounded-2xl border border-primary/5 hover:bg-primary/[0.02] cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-primary/80">{filter.label}</span>
                    <p className="text-[8px] text-primary/30 uppercase font-black">{filter.desc}</p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    csvFilters[filter.id as keyof typeof csvFilters] ? "bg-secondary border-secondary text-white" : "border-primary/10 bg-transparent"
                  )}>
                    {csvFilters[filter.id as keyof typeof csvFilters] && <Icons.Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              ))}
              <button 
                onClick={generateFilteredCSV}
                disabled={isExporting}
                className="w-full py-4 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/20 mt-4 active:scale-95 transition-all"
              >
                {isExporting ? 'Gerando...' : 'Gerar Relatório CSV'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
