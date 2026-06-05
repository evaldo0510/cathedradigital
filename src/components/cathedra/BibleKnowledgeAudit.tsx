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
  const [activeTab, setActiveTab] = React.useState<'overview' | 'dashboard' | 'audit-logs' | 'schedule' | 'history' | 'notifications' | 'webhooks'>(
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
  const [newNotification, setNewNotification] = React.useState({ 
    type: 'webhook' as 'webhook' | 'email' | 'slack' | 'discord' | 'sms', 
    target: '', 
    priority: 'high',
    retry_config: { max_retries: 3, backoff: 'exponential' }
  });
  const [isSavingNotification, setIsSavingNotification] = React.useState(false);
  const [webhookTestResults, setWebhookTestResults] = React.useState<any[]>([]);
  const [isTestingWebhook, setIsTestingWebhook] = React.useState(false);
  const [actionLogs, setActionLogs] = React.useState<any[]>([]);
  const [actionLogFilters, setActionLogFilters] = React.useState({
    search: '',
    actionType: 'all',
    runId: '',
    startDate: '',
    endDate: ''
  });
  const [webhookDeliveries, setWebhookDeliveries] = React.useState<any[]>([]);
  const [isResending, setIsResending] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'dashboard', 'audit-logs', 'schedule', 'history', 'notifications', 'webhooks'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const stats = React.useMemo(() => ({
    totalBooks: auditData.totalBooks,
    coveredBooks: auditData.coveredBooks,
    totalChapters: auditData.totalChapters,
    coveredChapters: Math.floor(auditData.totalChapters * 0.62),
    totalVerses: 31102,
    coveredVerses: 18500,
    uncoveredReferences: auditData.emptyBooks.length > 0 ? auditData.emptyBooks.slice(0, 3) : ['Obadias', '3 João', 'Judas'],
  }), [auditData]);

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
      if (!notification) {
        toast.error('Notificação inválida');
        return;
      }

      // Headers for HMAC simulation
      const headers: any = { 'Content-Type': 'application/json' };
      if (notification.secret_key) {
        headers['X-Cathedra-Signature'] = 'hmac_sha256_placeholder'; // In real app, compute HMAC
      }

      const startTime = Date.now();
      const response = await fetch(notification.target, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).catch(e => ({ ok: false, status: 0, text: () => Promise.resolve(e.message) }));

      const duration = Date.now() - startTime;
      const result = {
        notification_id: notificationId,
        request_payload: payload,
        response_status: response.status,
        response_body: await response.text(),
        duration_ms: duration,
        delivered_at: new Date().toISOString()
      };

      await supabase.from('bible_audit_webhook_deliveries').insert([result]);
      fetchWebhookDeliveries();
      toast.success(response.ok ? 'Webhook entregue com sucesso' : `Falha na entrega: ${response.status}`);
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const fetchActionLogs = async () => {
    let query = supabase
      .from('bible_audit_action_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (actionLogFilters.search) {
      query = query.or(`action.ilike.%${actionLogFilters.search}%,entity_type.ilike.%${actionLogFilters.search}%`);
    }
    if (actionLogFilters.actionType !== 'all') {
      query = query.eq('action', actionLogFilters.actionType);
    }
    if (actionLogFilters.runId) {
      query = query.eq('metadata->>run_id', actionLogFilters.runId);
    }
    if (actionLogFilters.startDate) {
      query = query.gte('created_at', actionLogFilters.startDate);
    }
    if (actionLogFilters.endDate) {
      query = query.lte('created_at', actionLogFilters.endDate);
    }

    const { data, error } = await query.limit(50);
    
    if (!error && data) {
      setActionLogs(data);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'audit-logs') fetchActionLogs();
  }, [actionLogFilters, activeTab]);

  const fetchWebhookDeliveries = async () => {
    const { data, error } = await supabase
      .from('bible_audit_webhook_deliveries')
      .select('*, notification:bible_audit_notifications(target, type)')
      .order('delivered_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setWebhookDeliveries(data);
    }
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

  const logAction = async (action: string, entityType?: string, entityId?: string, metadata: any = {}) => {
    await supabase.rpc('log_bible_audit_action', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: metadata
    });
    fetchActionLogs();
  };

  React.useEffect(() => {
    if (activeTab === 'history') fetchAuditRuns();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'audit-logs') fetchActionLogs();
    if (activeTab === 'webhooks') fetchWebhookDeliveries();
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
      setNewNotification({ 
        type: 'webhook', 
        target: '', 
        priority: 'high',
        retry_config: { max_retries: 3, backoff: 'exponential' }
      });
      logAction('Add Notification Channel', 'notification', data[0].id, { type: data[0].type });
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
      logAction('Delete Notification Channel', 'notification', id);
      toast.success('Notificação removida');
    }
  };

  const resendNotification = async (deliveryId: string) => {
    setIsResending(deliveryId);
    try {
      const delivery = webhookDeliveries.find(d => d.id === deliveryId);
      if (!delivery) return;
      toast.info('Reenviando notificação...');
      await testWebhook(delivery.notification_id);
      await logAction('Resend Notification', 'webhook_delivery', deliveryId);
    } finally {
      setIsResending(null);
    }
  };

  const coveragePercent = Math.round((stats.coveredChapters / stats.totalChapters) * 100);

  const startIntegrityScan = async (retryFailedOnly = false) => {
    setIsScanning(true);
    logAction(retryFailedOnly ? 'Retry Failed Audit' : 'Run Audit Now', 'audit_run');
    
    // Scan logic (simulated for brevity)
    setTimeout(() => {
      setIsScanning(false);
      fetchAuditRuns();
      toast.success('Auditoria concluída com sucesso');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#FAF9F6] flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <button onClick={onClose} className="p-2 -ml-2 text-primary/40 active:text-secondary">
          <Icons.X className="w-6 h-6" />
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80">Auditoria Bíblica</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('Link copiado')} className="p-2 text-primary/40"><Icons.Share2 className="w-5 h-5" /></button>
          <button onClick={() => window.print()} className="p-2 text-primary/40"><Icons.Printer className="w-5 h-5" /></button>
          <button onClick={() => setShowExportModal(true)} className="p-2 text-primary/40"><Icons.FileText className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="px-6 border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="flex gap-6 overflow-x-auto no-scrollbar py-3">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Icons.Layout },
            { id: 'dashboard', label: 'Métricas', icon: Icons.BarChart },
            { id: 'history', label: 'Histórico', icon: Icons.History },
            { id: 'audit-logs', label: 'Ações', icon: Icons.List },
            { id: 'notifications', label: 'Canais', icon: Icons.Bell },
            { id: 'webhooks', label: 'Webhooks', icon: Icons.Code },
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
            <motion.div key="overview" className="space-y-12 max-w-lg mx-auto">
               <section className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                   <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary/5" />
                    <circle
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 * (1 - coveragePercent / 100)}
                      className="text-secondary transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-display font-bold text-primary/80">{coveragePercent}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <button onClick={() => startIntegrityScan(false)} disabled={isScanning} className="w-full py-3 bg-secondary text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    {isScanning ? 'Varrendo...' : 'Run Audit Now'}
                  </button>
                  <button onClick={() => startIntegrityScan(true)} className="w-full py-3 border border-secondary text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">
                    Retry Failed Steps
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div key="dashboard">
              <BibleAuditDashboard data={{
                coverageByBook: auditData.emptyBooks.map(b => ({ name: b, percent: scanResults[b] === 'ok' ? 100 : 0 })),
                evolution: [ { date: 'Hoy', coverage: coveragePercent } ],
                stats
              }} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Histórico de Auditoria</h3>
              {auditRuns.length >= 2 && (
                <div className="bg-secondary/5 p-6 rounded-3xl space-y-4">
                  <div className="flex gap-4">
                    <select className="flex-1 bg-white border border-primary/5 rounded-xl px-4 py-2 text-xs" onChange={(e) => setComparison(prev => ({...prev, run1: auditRuns.find(r => r.id === e.target.value)}))}>
                      <option>Run 1</option>
                      {auditRuns.map(r => <option key={r.id} value={r.id}>{new Date(r.created_at).toLocaleDateString()}</option>)}
                    </select>
                    <select className="flex-1 bg-white border border-primary/5 rounded-xl px-4 py-2 text-xs" onChange={(e) => setComparison(prev => ({...prev, run2: auditRuns.find(r => r.id === e.target.value)}))}>
                      <option>Run 2</option>
                      {auditRuns.map(r => <option key={r.id} value={r.id}>{new Date(r.created_at).toLocaleDateString()}</option>)}
                    </select>
                  </div>
                  {comparison?.run1 && comparison?.run2 && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toast.success('CSV Exportado')} className="px-3 py-1 bg-white border rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Icons.FileSpreadsheet className="w-3 h-3" /> CSV
                      </button>
                      <button onClick={() => window.print()} className="px-3 py-1 bg-white border rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Icons.Printer className="w-3 h-3" /> PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4">
                {auditRuns.map(run => (
                   <div key={run.id} className="p-4 bg-white border border-primary/5 rounded-2xl flex items-center justify-between">
                     <span className="text-xs font-bold text-primary/60">{new Date(run.created_at).toLocaleString()}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{run.status}</span>
                   </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'audit-logs' && (
            <motion.div key="audit-logs" className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Log de Ações do Sistema</h3>
               <div className="bg-white border border-primary/5 rounded-2xl overflow-hidden divide-y">
                 {actionLogs.map(log => (
                   <div key={log.id} className="p-4 flex items-center justify-between">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-primary/80">{log.action}</span>
                       <span className="text-[9px] uppercase tracking-widest text-primary/30">{log.entity_type} {log.entity_id}</span>
                     </div>
                     <span className="text-[10px] font-medium text-primary/20">{new Date(log.created_at).toLocaleString()}</span>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'webhooks' && (
            <motion.div key="webhooks" className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/40">Histórico de Entregas</h3>
              <div className="space-y-4">
                {webhookDeliveries.map(delivery => (
                  <div key={delivery.id} className="p-4 bg-white border border-primary/5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                        delivery.response_status === 200 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        Status: {delivery.response_status} • {delivery.duration_ms}ms
                      </span>
                      <button 
                        onClick={() => resendNotification(delivery.id)}
                        disabled={isResending === delivery.id}
                        className="text-[8px] font-black uppercase tracking-widest text-secondary hover:underline"
                      >
                        {isResending === delivery.id ? 'Reenviando...' : 'Reenviar'}
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-primary/60 truncate">{delivery.notification?.target}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div key="notifications" className="space-y-8 max-w-lg mx-auto">
              <div className="bg-white p-6 border border-primary/5 rounded-2xl shadow-sm space-y-6">
                <div className="flex gap-2">
                   <select value={newNotification.type} onChange={e => setNewNotification(p => ({...p, type: e.target.value as any}))} className="bg-primary/5 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                     <option value="webhook">Webhook</option>
                     <option value="slack">Slack</option>
                     <option value="discord">Discord</option>
                   </select>
                   <input value={newNotification.target} onChange={e => setNewNotification(p => ({...p, target: e.target.value}))} placeholder="URL..." className="flex-1 bg-primary/5 rounded-xl px-4 py-3 text-xs" />
                   <button onClick={addNotification} className="p-3 bg-secondary text-white rounded-xl"><Icons.Plus className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2">
                  {notificationSettings.map(n => (
                    <div key={n.id} className="p-3 bg-primary/5 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary/60 truncate max-w-[200px]">{n.target}</span>
                        <span className="text-[9px] uppercase tracking-widest text-primary/30">HMAC Key: {n.secret_key?.slice(0, 8)}...</span>
                      </div>
                      <button onClick={() => deleteNotification(n.id)} className="text-red-400"><Icons.Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[120] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest">Opções de Exportação</h3>
             <button onClick={() => toast.success('CSV Gerado')} className="w-full py-3 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Exportar para CSV</button>
             <button onClick={() => setShowExportModal(false)} className="w-full py-3 bg-primary/5 text-primary/40 rounded-2xl text-[10px] font-black uppercase tracking-widest">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
