import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Icons } from '@/constants';
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Clock, ShieldCheck, RefreshCcw, Activity } from "lucide-react";

const WebhookAlerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: alertData }, { data: settingsData }] = await Promise.all([
      supabase.from('webhook_alerts').select('*').order('last_occurrence', { ascending: false }).limit(5),
      supabase.from('webhook_settings').select('*').single()
    ]);
    if (alertData) setAlerts(alertData);
    if (settingsData) setSettings(settingsData);
  };

  const updateSettings = async (field: string, value: any) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('webhook_settings')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', settings.id);
    
    if (error) toast.error('Erro ao salvar configurações');
    else {
      setSettings({ ...settings, [field]: value });
      toast.success('Configuração atualizada');
    }
    setIsSaving(false);
  };

  if (alerts.length === 0 && !settings) return <p className="text-sm text-muted-foreground italic">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alertas Ativos</h5>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sem alertas críticos no momento.</p>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`p-3 border rounded-xl flex items-start gap-3 ${
              alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertCircle className={`w-4 h-4 mt-1 shrink-0 ${
                alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
              }`} />
              <div>
                <p className={`text-xs font-bold uppercase ${
                  alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
                }`}>{alert.alert_type.replace('_', ' ')} ({alert.count}x)</p>
                <p className={`text-[11px] line-clamp-2 ${
                  alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                }`}>{alert.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(alert.last_occurrence), 'HH:mm - dd/MM')}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {settings && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Limites e Retentativas</h5>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Taxa de Timeout p/ Alerta (%)</label>
              <Select 
                value={(settings.alert_threshold_timeout * 100).toString()} 
                onValueChange={(val) => updateSettings('alert_threshold_timeout', parseFloat(val) / 100)}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Janela de Observação (min)</label>
              <Select 
                value={(settings.alert_window_minutes || 60).toString()} 
                onValueChange={(val) => updateSettings('alert_window_minutes', parseInt(val))}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="360">6 horas</SelectItem>
                  <SelectItem value="1440">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">E-mail para Alertas Críticos</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="admin@exemplo.com"
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={settings.alert_notification_email || ''}
                  onBlur={(e) => updateSettings('alert_notification_email', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Máximo de Retentativas</label>
              <Select 
                value={settings.max_retries.toString()} 
                onValueChange={(val) => updateSettings('max_retries', parseInt(val))}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                  <SelectItem value="10">10 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, delay: i * 0.15, ease } 
  }),
};

const BENEFITS = [
  { 
    title: "Jornadas Completas", 
    desc: "Acesse todos os caminhos de formação sem limites ou interrupções.",
    icon: Icons.Compass 
  },
  { 
    title: "Respostas mais profundas da Logos", 
    desc: "Obtenha reflexões teológicas densas e personalizadas com nossa IA.",
    icon: Icons.Sparkles 
  },
  { 
    title: "Acompanhamento Contínuo", 
    desc: "Métricas e lembretes para garantir sua constância na vida de oração.",
    icon: Icons.Target 
  },
  { 
    title: "Conteúdos Exclusivos", 
    desc: "Acesso total a documentos raros, meditações e estudos avançados.",
    icon: Icons.Library 
  }
];

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isPremium } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [isReprocessing, setIsReprocessing] = useState<string | null>(null);

  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const fetchLogs = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingLogs(true);
    let query = supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    if (filterDate !== 'all') {
      const now = new Date();
      if (filterDate === 'today') {
        const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query = query.gte('created_at', today);
      } else if (filterDate === 'week') {
        const lastWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte('created_at', lastWeek);
      }
    }

    const { data, error } = await query.limit(50);
    
    if (!error && data) {
      setWebhookLogs(data);
    }
    setIsLoadingLogs(false);
  }, [isAdmin, filterStatus, filterDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCSV = () => {
    const csv = Papa.unparse(webhookLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `webhook_logs_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exportados para CSV');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Webhooks - Mercado Pago", 14, 15);
    const tableData = webhookLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.event_type,
      log.status,
      log.duration_ms || '-',
      log.error_message || '-'
    ]);
    (doc as any).autoTable({
      head: [['Data', 'Evento', 'Status', 'Duração', 'Erro']],
      body: tableData,
      startY: 20
    });
    doc.save(`webhook_logs_${new Date().toISOString()}.pdf`);
    toast.success('Logs exportados para PDF');
  };

  const reprocessWebhook = async (log: any) => {
    setIsReprocessing(log.id);
    try {
      const { data, error } = await supabase.functions.invoke('mercado-pago-webhook', {
        body: log.payload,
        headers: {
          'x-request-id': log.event_id,
          'x-is-retry': 'true',
          'x-retry-log-id': log.id
        }
      });
      if (error) throw error;
      
      // No need to manual update here as the webhook function now handles it
      
      toast.success('Evento reprocessado com sucesso');
      fetchLogs();
    } catch (error: any) {
      toast.error('Erro ao reprocessar: ' + error.message);
    } finally {
      setIsReprocessing(null);
    }
  };

  const generateMonthlyReport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const monthYear = format(now, 'MMMM yyyy', { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text(`Relatório Mensal Webhooks - ${monthYear}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Total de Logs: ${webhookLogs.length}`, 14, 30);
    doc.text(`Falhas: ${webhookLogs.filter(l => l.status === 'failed').length}`, 14, 37);
    doc.text(`Sucessos: ${webhookLogs.filter(l => l.status === 'success').length}`, 14, 44);

    const tableData = webhookLogs.map(log => [
      format(new Date(log.created_at), 'dd/MM HH:mm'),
      log.event_type,
      log.status.toUpperCase(),
      log.event_id || '-',
      log.retry_count || 0,
      log.error_message ? 'SIM' : 'NÃO'
    ]);

    (doc as any).autoTable({
      head: [['Data', 'Tipo', 'Status', 'ID Transação', 'Retentativas', 'Erro']],
      body: tableData,
      startY: 50,
      theme: 'striped',
      headStyles: { fillStyle: '#8B5CF6' }
    });

    doc.save(`relatorio_mensal_${format(now, 'yyyy_MM')}.pdf`);
    toast.success('Relatório mensal gerado com sucesso.');
  };

  const simulatePayment = async (status: 'approved' | 'cancelled' | 'pending' = 'approved') => {
    if (!user) return;
    setIsSimulating(true);
    try {
      // We'll call the actual webhook with a simulated payload
      const requestId = `sim_${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('mercado-pago-webhook', {
        body: { 
          action: 'payment.updated', 
          data: { id: 'sim_payment_123' },
          simulation: true,
          simulated_status: status
        },
        headers: {
          'x-request-id': requestId,
          'x-simulation': 'true'
        }
      });
      
      if (error) throw error;
      
      toast.success(`Simulação de ${status} enviada para o webhook.`);
      fetchLogs();
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast.error('Erro na simulação: ' + error.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center py-spacing-2xl md:py-spacing-3xl px-spacing-md relative overflow-hidden">
      <Helmet>
        <title>Cathedra PRO — Eleve sua Vida Espiritual</title>
      </Helmet>

      {/* Decorative background elements */}
      <div className="absolute top-spacing-0 left-spacing-2xs/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-spacing-2xs/4 w-spacing-4xl h-spacing-4xl bg-primary/20 rounded-premium " />
        <div className="absolute bottom-[20%] right-spacing-2xs/4 w-spacing-4xl h-spacing-4xl bg-primary/10 rounded-premium " />
      </div>

      <div className="max-w-spacing-3xl w-full text-center space-y-spacing-xl">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={0}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 border border-primary/20 rounded-premium text-primary">
            <Icons.Crown className="w-spacing-md h-spacing-md" />
            <span className="text-premium-xs font-black uppercase tracking-widest">Cathedra PRO</span>
          </div>
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={1}
          className="space-y-spacing-md"
        >
          <h1 className="text-premium-4xl md:text-premium-6xl font-display font-bold tracking-tight text-balance">
            Sua caminhada de fé merece <span className="text-primary italic">profundidade</span>.
          </h1>
          <p className="text-premium-lg md:text-premium-xl text-muted-foreground font-serif italic max-w-spacing-xl mx-auto leading-relaxed">
            O Cathedra PRO foi desenhado para quem deseja ir além do essencial e vivenciar a plenitude da nossa tradição.
          </p>
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={2}
          className="grid sm:grid-cols-2 gap-spacing-lg text-left py-spacing-xl"
        >
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="group p-spacing-md rounded-premium bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 ">
              <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary mb-spacing-md group-hover:scale-110 transition-transform duration-500">
                <benefit.icon className="w-spacing-md h-spacing-md" />
              </div>
              <h3 className="font-bold text-premium-lg mb-spacing-2xs">{benefit.title}</h3>
              <p className="text-premium-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={3}
          className="flex flex-col items-center gap-spacing-lg"
        >
          <Button 
            size="lg"
            className="h-spacing-3xl px-spacing-xl rounded-premium-full text-premium-lg font-bold bg-primary text-primary-foreground shadow-premium-hover shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 group"
            onClick={() => navigate(AppRoute.CHECKOUT)}
            disabled={isPremium}
          >
            {isPremium ? (
              <span className="flex items-center gap-spacing-xs">Experiência Desbloqueada <Icons.Zap className="w-spacing-md h-spacing-md fill-current" /></span>
            ) : (
              <span className="flex items-center gap-spacing-xs">
                Desbloquear experiência completa
                <Icons.ArrowRight className="w-spacing-md h-spacing-md group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
          
          <div className="flex flex-col items-center gap-spacing-md">
            <div className="flex items-center gap-spacing-lg text-premium-xs font-medium text-muted-foreground/60 tracking-widest uppercase">
              <span>Acesso Imediato</span>
              <div className="w-spacing-2xs h-spacing-2xs rounded-premium bg-border" />
              <span>Cancele quando quiser</span>
            </div>
            
            {profile?.premium_status && profile.premium_status !== 'inactive' && (
              <div className="p-spacing-md bg-primary/5 rounded-premium border border-primary/20 text-center">
                <p className="text-premium-sm font-bold text-primary mb-1">
                  Status Atual: {profile.premium_status.toUpperCase()}
                </p>
                {profile.premium_expires_at && (
                  <p className="text-premium-xs text-muted-foreground">
                    Expira em: {new Date(profile.premium_expires_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700 font-bold"
                  onClick={async () => {
                    if (confirm('Deseja realmente cancelar sua assinatura?')) {
                      toast.promise(
                        supabase.functions.invoke('mercadopago-simulate', {
                          body: { userId: user?.id, status: 'cancelled' }
                        }),
                        {
                          loading: 'Processando cancelamento...',
                          success: () => {
                            setTimeout(() => window.location.reload(), 1500);
                            return 'Assinatura cancelada com sucesso.';
                          },
                          error: 'Erro ao cancelar.'
                        }
                      );
                    }
                  }}
                >
                  Cancelar Assinatura
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div 
            variants={fadeUp} 
            initial="hidden" 
            animate="visible" 
            custom={4}
            className="pt-spacing-2xl border-t border-border/50 w-full"
          >
            <Tabs defaultValue="tests" className="w-full">
              <div className="flex flex-col items-center gap-spacing-md mb-spacing-lg">
                <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                  <Icons.FlaskConical className="w-spacing-lg h-spacing-lg" />
                </div>
                <h3 className="text-premium-xl font-serif font-bold italic">Painel de Controle Mercado Pago</h3>
                <TabsList className="bg-muted/50 rounded-premium-full p-1">
                  <TabsTrigger value="tests" className="rounded-premium-full font-bold">Simulações E2E</TabsTrigger>
                  <TabsTrigger value="logs" className="rounded-premium-full font-bold">Monitor de Webhooks</TabsTrigger>
                  <TabsTrigger value="alerts" className="rounded-premium-full font-bold">Alertas e Relatórios</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="alerts">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-sm">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Status e Configurações
                    </h4>
                    <WebhookAlerts />
                  </div>
                  <div className="bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-sm">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Icons.FileText className="w-4 h-4 text-primary" />
                      Relatórios e Exportação
                    </h4>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Gere relatórios consolidados de falhas, reprocessamentos e transações por período.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={exportCSV} className="rounded-xl h-12 gap-2" variant="outline">
                          <Icons.Download className="w-4 h-4" /> CSV
                        </Button>
                        <Button onClick={exportPDF} className="rounded-xl h-12 gap-2" variant="outline">
                          <Icons.FileText className="w-4 h-4" /> PDF
                        </Button>
                      </div>
                      <Button onClick={generateMonthlyReport} className="w-full rounded-xl h-12 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
                        Gerar Relatório Mensal PRO
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tests">
                <div className="bg-muted/30 p-spacing-xl rounded-[2.5rem] border border-dashed border-primary/30 text-center">
                  <p className="text-premium-sm text-muted-foreground font-serif italic mb-spacing-md max-w-spacing-sm mx-auto">
                    Execute fluxos completos de ponta a ponta para validar a integração, idempotência e segurança.
                  </p>
                  <div className="flex flex-wrap justify-center gap-spacing-sm">
                    <Button 
                      variant="outline"
                      onClick={() => simulatePayment('approved')}
                      disabled={isSimulating}
                      className="rounded-premium-full border-green-500/30 text-green-600 hover:bg-green-500/5 h-spacing-2xl px-spacing-lg font-bold"
                    >
                      {isSimulating ? 'Processando...' : 'Simular Sucesso'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => simulatePayment('cancelled')}
                      disabled={isSimulating}
                      className="rounded-premium-full border-red-500/30 text-red-600 hover:bg-red-500/5 h-spacing-2xl px-spacing-lg font-bold"
                    >
                      Simular Cancelamento
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => simulatePayment('pending')}
                      disabled={isSimulating}
                      className="rounded-premium-full border-amber-500/30 text-amber-600 hover:bg-amber-500/5 h-spacing-2xl px-spacing-lg font-bold"
                    >
                      Simular Pendente
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => navigate(AppRoute.TRANSACTIONS)}
                      className="rounded-premium-full h-spacing-2xl px-spacing-lg font-bold"
                    >
                      <Icons.History className="w-4 h-4 mr-2" />
                      Histórico
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="logs">
                <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden">
                  <div className="p-spacing-md border-b border-border/50 bg-muted/20 space-y-spacing-md">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-spacing-md">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-premium-sm uppercase tracking-wider">Monitor de Webhooks</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-premium-full text-[10px] font-bold uppercase">
                          <Icons.Download className="w-3 h-3 mr-1" /> CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-premium-full text-[10px] font-bold uppercase">
                          <Icons.FileText className="w-3 h-3 mr-1" /> PDF
                        </Button>
                        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={isLoadingLogs} className="rounded-premium-full">
                          <RefreshCcw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[140px] h-8 text-[10px] uppercase font-bold rounded-premium-full bg-background">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-premium">
                          <SelectItem value="all">Todos Status</SelectItem>
                          <SelectItem value="success">Sucesso</SelectItem>
                          <SelectItem value="failed">Falha</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterDate} onValueChange={setFilterDate}>
                        <SelectTrigger className="w-[140px] h-8 text-[10px] uppercase font-bold rounded-premium-full bg-background">
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="rounded-premium">
                          <SelectItem value="all">Sempre</SelectItem>
                          <SelectItem value="today">Hoje</SelectItem>
                          <SelectItem value="week">Últimos 7 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Erro / Idempotency</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {webhookLogs.map((log) => (
                            <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
                              <TableCell className="text-premium-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </TableCell>
                              <TableCell className="font-medium">
                                {log.event_type}
                                {log.retry_count > 0 && (
                                  <div className="text-[10px] text-primary font-bold flex items-center gap-1 mt-1">
                                    <RefreshCcw className="w-2 h-2" /> Retentativa #{log.retry_count}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'} className="rounded-full">
                                  {log.status === 'success' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : log.status === 'failed' ? <AlertCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                  {log.status.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-red-500 text-xs italic">
                                {log.error_message || log.event_id || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {(log.status === 'failed' || log.status === 'pending') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => reprocessWebhook(log)}
                                    disabled={isReprocessing === log.id}
                                    className="h-7 px-2 text-[10px] font-bold uppercase text-primary"
                                  >
                                    <RefreshCcw className={`w-3 h-3 mr-1 ${isReprocessing === log.id ? 'animate-spin' : ''}`} />
                                    Reprocessar {log.retry_count > 0 && `(#${log.retry_count})`}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </AnimatePresence>
                        {webhookLogs.length === 0 && !isLoadingLogs && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-spacing-xl text-muted-foreground italic font-serif">
                              Nenhum evento registrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <div className="p-spacing-sm bg-muted/10 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t border-border/50 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    Validação de Assinatura e Proteção de Idempotência Ativas
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;