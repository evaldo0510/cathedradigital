import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, TrendingUp, Download, DollarSign, ArrowUpRight,
  BarChart3, Calendar, AlertCircle, Crown, Shield, Search,
  ChevronDown, ChevronUp, UserCog, ArrowLeft, Home, Smartphone, MonitorSmartphone,
  Target, Activity, Bell, LayoutGrid, UserCheck, Handshake, Heart, Wallet,
  MessageSquare, Map as MapIcon, Clock, Tag, Building2, RefreshCcw, Globe, Palette, Eye
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminChartsTab = lazy(() => import('./AdminChartsTab'));
const AdminTransactionsTab = lazy(() => import('./AdminTransactionsTab'));
const AdminCrmSegmentation = lazy(() => import('./AdminCrmSegmentation'));
const AdminCrmRetention = lazy(() => import('./AdminCrmRetention'));
const AdminCrmUserProfile = lazy(() => import('./AdminCrmUserProfile'));
const AdminCrmAutomations = lazy(() => import('./AdminCrmAutomations'));
const AdminPartnersTab = lazy(() => import('./AdminPartnersTab'));
const AdminContentTab = lazy(() => import('./AdminContentTab'));
const AdminJourneysTab = lazy(() => import('./AdminJourneysTab'));
const AdminThemesTab = lazy(() => import('./AdminThemesTab'));
const AdminConstructionTab = lazy(() => import('./AdminConstructionTab'));
const WebhookSimulator = lazy(() => import('./WebhookSimulator'));
const SecurityAuditPage = lazy(() => import('./SecurityAuditPage'));
const AdminSeoTab = lazy(() => import('./AdminSeoTab'));
const DesignSystemGuide = lazy(() => import('./DesignSystemGuide'));
const VisualRegressionDashboard = lazy(() => import('./VisualRegressionDashboard'));


interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalVisits: number;
  totalDownloads: number;
  totalRevenue: number;
  pendingRevenue: number;
  pwaInstalls: number;
  pwaOpens: number;
  activeToday: number;
  activeLast30Days: number;
  inactiveUsers: number;
  journeysInProgress: number;
  totalReflections: number;
  totalJourneysStarted: number;
  totalJourneysCompleted: number;
  returnRate: number;
  recentTransactions: any[];
  userGrowth: any[];
  revenueData: any[];
  diocesesStats: { name: string; count: number }[];
  statesStats: { name: string; count: number }[];
  movementsStats: { name: string; count: number }[];
}


interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string | null;
  is_premium: boolean;
  created_at: string;
  xp: number | null;
  level: number | null;
  streak: number | null;
  last_visit: string | null;
  reflections_count?: number;
  depth_level?: string;
  current_journey?: string;
  access_frequency?: string;
}

interface SensitiveRow {
  user_id: string;
  email: string;
  diagnosis_result?: any;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {

    // Force specific body class for admin layout
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);


  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [recentJournal, setRecentJournal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'xp'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const tabsListRef = React.useRef<HTMLDivElement>(null);
  
  // Sync with URL query param for persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [securityResetKey, setSecurityResetKey] = useState(0);

  // Debounced reset logic for security tab when URL changes
  useEffect(() => {
    if (activeTab === 'security') {
      const timer = setTimeout(() => {
        setSecurityResetKey(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

  useEffect(() => {
    if (activeTab && tabsListRef.current) {
      const activeTrigger = tabsListRef.current.querySelector(`[data-state="active"]`);
      if (activeTrigger) {
        activeTrigger.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const thirtyDaysAgoStart = new Date();
        thirtyDaysAgoStart.setDate(new Date().getDate() - 30);
        const iso30 = thirtyDaysAgoStart.toISOString();

        const [statsRes, metricsRes, transactionsRes, journalRes, journeysStartedRes, journeysCompletedRes, crmRes, recentJournalRes] = await Promise.all([
          supabase.from('profiles').select('id, is_premium, created_at, last_visit, role, diocese, estado, movimento_pastoral, name, xp, level, streak'),
          supabase.from('app_metrics').select('metric_type, created_at').gte('created_at', iso30),
          supabase.from('transactions').select('*, profiles(name)').order('created_at', { ascending: false }).limit(100),
          supabase.from('spiritual_journal').select('user_id', { count: 'exact', head: true }),
          supabase.from('journey_progress').select('user_id', { count: 'exact', head: true }),
          supabase.from('journey_progress').select('user_id', { count: 'exact', head: true }).not('completed_at', 'is', null),
          supabase.from('user_management_stats').select('*').limit(1000),
          supabase.from('spiritual_journal').select('*, profiles(name)').order('created_at', { ascending: false }).limit(5)
        ]);

        if (statsRes.error) throw statsRes.error;
        if (metricsRes.error) throw metricsRes.error;
        if (transactionsRes.error) throw transactionsRes.error;

        const allProfiles = statsRes.data || [];
        const metrics = metricsRes.data || [];
        const transactions = transactionsRes.data || [];
        const crmUsers = crmRes.data || [];

        const premiumCount = allProfiles.filter(p => p.is_premium).length;
        const visitsCount = metrics.filter(m => m.metric_type === 'visit').length;
        const downloadsCount = metrics.filter(m => m.metric_type === 'download').length;
        const pwaInstalls = metrics.filter(m => m.metric_type === 'pwa_install').length;
        const pwaOpens = metrics.filter(m => m.metric_type === 'pwa_open').length;
        const totalRevenue = transactions.filter(t => t.status === 'approved').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);

        // New CRM specific stats
        const now = new Date();
        const activeToday = allProfiles.filter(p => {
          if (!p.last_visit) return false;
          const visitDate = new Date(p.last_visit);
          return visitDate.toDateString() === now.toDateString();
        }).length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const activeLast30Days = allProfiles.filter(p => {
          if (!p.last_visit) return false;
          const visitDate = new Date(p.last_visit);
          return visitDate >= thirtyDaysAgo;
        }).length;

        const inactiveUsers = allProfiles.filter(p => {
          if (!p.last_visit) return true;
          const diff = (now.getTime() - new Date(p.last_visit).getTime()) / (1000 * 60 * 60);
          return diff >= 48;
        }).length;

        const returnRate = allProfiles.length > 0 ? ((allProfiles.length - inactiveUsers) / allProfiles.length) * 100 : 0;

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const currentYear = new Date().getFullYear();
        
        const userGrowth = months.map((month, index) => {
          const count = allProfiles.filter(p => {
            const date = new Date(p.created_at);
            return date.getMonth() <= index && date.getFullYear() <= currentYear;
          }).length;
          return { name: month, total: count };
        }).slice(0, new Date().getMonth() + 1);

        const revenueData = [3, 2, 1, 0].map(weeksAgo => {
          const start = new Date(now);
          start.setDate(now.getDate() - (weeksAgo + 1) * 7);
          const end = new Date(now);
          end.setDate(now.getDate() - weeksAgo * 7);
          
          const amount = transactions
            .filter(t => {
              const date = new Date(t.created_at);
              return t.status === 'approved' && date >= start && date <= end;
            })
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
            
          return { name: `Sem ${4 - weeksAgo}`, amount };
        });

        // Geographic & Pastoral Stats
        const dioceseMap = new Map<string, number>();
        const stateMap = new Map<string, number>();
        const movementMap = new Map<string, number>();

        allProfiles.forEach(p => {
          if (p.diocese) dioceseMap.set(p.diocese, (dioceseMap.get(p.diocese) || 0) + 1);
          if (p.estado) stateMap.set(p.estado, (stateMap.get(p.estado) || 0) + 1);
          if (p.movimento_pastoral) movementMap.set(p.movimento_pastoral, (movementMap.get(p.movimento_pastoral) || 0) + 1);
        });

        const diocesesStats = Array.from(dioceseMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        
        const statesStats = Array.from(stateMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        const movementsStats = Array.from(movementMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setStats({
          totalUsers: allProfiles.length,
          premiumUsers: premiumCount,
          totalVisits: visitsCount,
          totalDownloads: downloadsCount,
          pwaInstalls,
          pwaOpens,
          activeToday,
          activeLast30Days,
          inactiveUsers,
          journeysInProgress: journeysStartedRes.count || 0,
          totalReflections: journalRes.count || 0,
          totalJourneysStarted: journeysStartedRes.count || 0,
          totalJourneysCompleted: journeysCompletedRes.count || 0,
          returnRate,
          totalRevenue,
          pendingRevenue,
          recentTransactions: transactions.slice(0, 10),
          userGrowth,
          revenueData,
          diocesesStats,
          statesStats,
          movementsStats
        });

        setRecentJournal(recentJournalRes.data || []);


        const crmMap = new Map<string, any>();
        crmUsers.forEach(u => crmMap.set(u.id, u));

        setUsers(allProfiles.map(p => {
          const crm = crmMap.get(p.id) || {};
          return {
            ...p,
            email: crm.email || '',
            depth_level: crm.classification || 'Novo',
            reflections_count: crm.reflections_count || 0,
            current_journey: crm.current_journey || 'Nenhuma',
            last_visit: crm.last_activity // Map view's activity to last_visit for UI consistency
          };
        }) as UserProfile[]);
      } catch (err: any) {
        console.error('Error fetching admin stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao atualizar status PRO');
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_premium: !currentStatus } : u));
    toast.success(!currentStatus ? 'Usuário promovido a PRO' : 'Acesso PRO removido');
  };

  const handleToggleRole = async (userId: string, currentRole: string | null) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao atualizar cargo');
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(newRole === 'admin' ? 'Usuário promovido a Admin' : 'Cargo de Admin removido');
  };

  const handleManualPremium = async (grant: boolean) => {
    if (!manualEmail.trim()) {
      toast.error('Informe um email válido');
      return;
    }
    setManualLoading(true);
    const { data: sensitiveData, error: sensitiveError } = await (supabase as any)
      .from('user_sensitive_data')
      .select('user_id')
      .eq('email', manualEmail.trim())
      .maybeSingle();

    if (sensitiveError || !sensitiveData) {
      setManualLoading(false);
      toast.error('Nenhum usuário encontrado com esse email');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_premium: grant })
      .eq('id', sensitiveData.user_id)
      .select('id, is_premium');

    setManualLoading(false);

    if (error) {
      toast.error('Erro ao atualizar: ' + error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.error('Nenhum usuário encontrado com esse email');
      return;
    }

    setUsers(prev => prev.map(u => u.email === manualEmail.trim() ? { ...u, is_premium: grant } : u));
    toast.success(grant ? `Premium ativado para ${manualEmail}` : `Premium removido de ${manualEmail}`);
    setManualEmail('');
  };

  const filteredUsers = users
    .filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField] ?? '';
      const valB = b[sortField] ?? '';
      const cmp = String(valA).localeCompare(String(valB), 'pt', { numeric: true });
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="w-spacing-sm h-spacing-sm inline ml-spacing-2xs" /> : <ChevronDown className="w-spacing-sm h-spacing-sm inline ml-spacing-2xs" />;
  };

  // If a user profile is selected, show it
  if (selectedUser) {
    return (
      <div className="space-y-spacing-xl pb-spacing-xl">
        <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
          <AdminCrmUserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />
        </Suspense>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-spacing-lg animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-md">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-spacing-4xl w-full rounded-premium-full" />)}
        </div>
        <Skeleton className="h-[400px] rounded-premium-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-spacing-2xl text-center bg-destructive/10 rounded-premium border border-destructive/20">
        <AlertCircle className="h-spacing-2xl w-spacing-2xl text-destructive mb-spacing-md" />
        <h2 className="text-premium-xl font-bold mb-spacing-xs">Erro ao carregar dados</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-spacing-lg sm:space-y-spacing-xl pb-spacing-3xl sm:pb-spacing-xl px-spacing-0 sm:px-spacing-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-spacing-md px-spacing-md sm:px-spacing-0">
        <div className="flex flex-col gap-spacing-2xs">
          <h1 className="text-premium-xl sm:text-premium-3xl font-display font-black uppercase tracking-tight text-primary">Painel Administrativo</h1>
          <p className="text-premium-xs sm:text-premium-sm text-muted-foreground font-medium uppercase tracking-wider opacity-70">CRM & Gestão completa da plataforma.</p>
        </div>
        <div className="flex gap-spacing-xs">
          <Button variant="outline" size="sm" onClick={() => navigate('/')} className="rounded-premium-full gap-spacing-xs font-bold uppercase tracking-widest text-[10px]">
            <Home className="w-spacing-md h-spacing-md" /> Ver Portal
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/security')} className="rounded-premium-full gap-spacing-xs font-bold uppercase tracking-widest text-[10px]">
            <Shield className="w-spacing-md h-spacing-md" /> Segurança
          </Button>
        </div>
      </div>


      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-spacing-lg">
        <div className="px-spacing-md sm:px-spacing-0 -mx-spacing-md sm:mx-spacing-0">
          <TabsList ref={tabsListRef} className="flex w-full overflow-x-auto justify-start h-auto p-spacing-2xs bg-muted/30 border border-border/10 rounded-premium-full no-scrollbar scroll-smooth snap-x">
            <TabsTrigger value="overview" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <LayoutGrid className="w-spacing-sm h-spacing-sm" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Users className="w-spacing-sm h-spacing-sm" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <DollarSign className="w-spacing-sm h-spacing-sm" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Palette className="w-spacing-sm h-spacing-sm" /> Design System
            </TabsTrigger>
            <TabsTrigger value="regression" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Eye className="w-spacing-sm h-spacing-sm" /> Regressão Visual
            </TabsTrigger>

            <TabsTrigger value="partners" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Handshake className="w-spacing-sm h-spacing-sm" /> Parceiros
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <MessageSquare className="w-spacing-sm h-spacing-sm" /> Conteúdo
            </TabsTrigger>
            <TabsTrigger value="journeys" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <MapIcon className="w-spacing-sm h-spacing-sm" /> Jornadas
            </TabsTrigger>
            <TabsTrigger value="segmentation" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Target className="w-spacing-sm h-spacing-sm" /> CRM: Segmentos
            </TabsTrigger>
            <TabsTrigger value="retention" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Activity className="w-spacing-sm h-spacing-sm" /> CRM: Retenção
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Bell className="w-spacing-sm h-spacing-sm" /> CRM: Automações
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Tag className="w-spacing-sm h-spacing-sm" /> Nexus Temas
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Globe className="w-spacing-sm h-spacing-sm" /> SEO
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start relative group">
              <Shield className="w-spacing-sm h-spacing-sm text-red-500" /> Segurança
              <span className="absolute -top-spacing-2xs -right-spacing-2xs flex h-spacing-xs w-spacing-xs">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-premium-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-premium-full h-spacing-xs w-spacing-xs bg-red-500"></span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <RefreshCcw className="w-spacing-sm h-spacing-sm" /> Testes
            </TabsTrigger>
            <TabsTrigger value="geography" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <MapIcon className="w-spacing-sm h-spacing-sm" /> Geografia
            </TabsTrigger>
            <TabsTrigger value="construction" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Building2 className="w-spacing-sm h-spacing-sm" /> Obras
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Shield className="w-spacing-sm h-spacing-sm" /> Design
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-spacing-lg">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-spacing-sm">
            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Total Usuários</CardTitle>
                <Users className="h-spacing-sm w-spacing-sm text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black tabular-nums">{stats?.totalUsers}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Cadastrados</p>
              </CardContent>
            </Card>

            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Ativos</CardTitle>
                <UserCheck className="h-spacing-sm w-spacing-sm text-primary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-primary tabular-nums">{stats?.activeLast30Days}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Usuários PRO</CardTitle>
                <Crown className="h-spacing-sm w-spacing-sm text-secondary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-secondary tabular-nums">{stats?.premiumUsers}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Assinantes</p>
              </CardContent>
            </Card>

            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Retenção</CardTitle>
                <TrendingUp className="h-spacing-sm w-spacing-sm text-primary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-primary tabular-nums">{stats?.returnRate.toFixed(1)}%</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Recorrência</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-spacing-sm">
            <Card className="bg-primary/5 border-primary/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary opacity-80">Receita</CardTitle>
                <DollarSign className="h-spacing-sm w-spacing-sm text-primary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-primary tabular-nums">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats?.totalRevenue || 0)}
                </div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Aprovada</p>
              </CardContent>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-amber-500 opacity-80">Pendente</CardTitle>
                <Clock className="h-spacing-sm w-spacing-sm text-amber-500" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-amber-500 tabular-nums">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats?.pendingRevenue || 0)}
                </div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Em espera</p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-destructive opacity-80">Doação</CardTitle>
                <Heart className="h-spacing-sm w-spacing-sm text-destructive" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-destructive tabular-nums">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format((stats?.totalRevenue || 0) * 0.5)}
                </div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">50% Social</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary opacity-80">Op (50%)</CardTitle>
                <Wallet className="h-spacing-sm w-spacing-sm text-primary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-primary tabular-nums">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format((stats?.totalRevenue || 0) * 0.5)}
                </div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Operação</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-sm">
            <Card className="bg-secondary/5 border-secondary/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-secondary opacity-80">Reflexões</CardTitle>
                <Heart className="h-spacing-sm w-spacing-sm text-secondary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-secondary tabular-nums">{stats?.totalReflections}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Impacto Espiritual</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary opacity-80">Iniciadas</CardTitle>
                <MapIcon className="h-spacing-sm w-spacing-sm text-primary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-primary tabular-nums">{stats?.totalJourneysStarted}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Jornadas Totais</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 shadow-premium-none">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary opacity-80">Concluídas</CardTitle>
                <Activity className="h-spacing-sm w-spacing-sm text-primary" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black text-primary tabular-nums">{stats?.totalJourneysCompleted}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Sucesso de Retenção</p>
              </CardContent>
            </Card>
          </div>


          <div className="grid grid-cols-2 lg:grid-cols-4 gap-spacing-sm">
            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Hoje</CardTitle>
                <UserCheck className="h-spacing-sm w-spacing-sm text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black tabular-nums">{stats?.activeToday}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Visitantes</p>
              </CardContent>
            </Card>

            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Inativos</CardTitle>
                <AlertCircle className="h-spacing-sm w-spacing-sm text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black tabular-nums">{stats?.inactiveUsers}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">{'>'} 48h sem acesso</p>
              </CardContent>
            </Card>

            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">Instalações</CardTitle>
                <Smartphone className="h-spacing-sm w-spacing-sm text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black tabular-nums">{stats?.pwaInstalls}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">PWA Total</p>
              </CardContent>
            </Card>

            <Card className="shadow-premium-none border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm space-y-0">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest opacity-60">No Flow</CardTitle>
                <Target className="h-spacing-sm w-spacing-sm text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm">
                <div className="text-premium-xl font-black tabular-nums">{stats?.journeysInProgress}</div>
                <p className="text-premium-xs text-muted-foreground font-medium uppercase tracking-tighter mt-spacing-3xs">Em andamento</p>
              </CardContent>
            </Card>
          </div>

          {/* CRM Segment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
            <Card className="border-border/40 shadow-premium-none bg-card ">
              <CardHeader className="pb-spacing-xs pt-spacing-sm px-spacing-sm">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary">Engajamento por Segmento</CardTitle>
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm pt-spacing-2xs">
                <div className="space-y-spacing-xs">
                  {[
                    { label: 'Profundos (Mestres)', count: users.filter(u => u.depth_level === 'Profundo').length, color: 'bg-primary' },
                    { label: 'Engajados (High XP)', count: users.filter(u => u.depth_level === 'Engajado').length, color: 'bg-orange-500' },
                    { label: 'Ativos (Frequentes)', count: users.filter(u => u.depth_level === 'Ativo').length, color: 'bg-primary/60' },
                    { label: 'Novos / Inativos', count: users.filter(u => !u.depth_level || u.depth_level === 'Inativo' || u.depth_level === 'Novo').length, color: 'bg-muted' },
                  ].map(s => (
                    <div key={s.label} className="space-y-spacing-2xs">
                      <div className="flex items-center justify-between text-premium-xs font-bold uppercase tracking-wider">
                        <span className="opacity-70">{s.label}</span>
                        <span className="tabular-nums">{s.count}</span>
                      </div>
                      <div className="h-spacing-2xs w-full bg-muted/30 rounded-premium overflow-hidden">
                        <div 
                          className={`h-full ${s.color} transition-all duration-1000`} 
                          style={{ width: `${users.length > 0 ? (s.count / users.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-premium-none bg-card ">
              <CardHeader className="pb-spacing-2xs pt-spacing-sm px-spacing-sm flex flex-row items-center justify-between">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary">Conversão PRO</CardTitle>
                <div className="text-premium-xl font-black text-primary tabular-nums">
                  {users.length > 0 ? ((users.filter(u => u.is_premium).length / users.length) * 100).toFixed(1) : 0}%
                </div>
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm pt-spacing-2xs">
                <div className="mt-spacing-xs grid grid-cols-2 gap-spacing-md w-full">
                  <div className="text-center p-spacing-xs rounded-premium bg-primary/5 border border-primary/10">
                    <div className="text-premium-lg font-black">{users.filter(u => u.is_premium).length}</div>
                    <div className="text-premium-xs font-black uppercase tracking-widest opacity-50">Assinantes</div>
                  </div>
                  <div className="text-center p-spacing-xs rounded-premium bg-muted/20 border border-border/10">
                    <div className="text-premium-lg font-black opacity-60">{users.length - users.filter(u => u.is_premium).length}</div>
                    <div className="text-premium-xs font-black uppercase tracking-widest opacity-50">Gratuitos</div>
                  </div>
                </div>
                <p className="text-premium-xs text-muted-foreground text-center mt-spacing-sm uppercase tracking-tighter italic">Base total: {users.length} usuários</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-lg">
            <div className="lg:col-span-2">
              <Suspense fallback={<Skeleton className="h-[350px] rounded-premium-full" />}>
                <AdminChartsTab userGrowth={stats?.userGrowth || []} revenueData={stats?.revenueData || []} />
              </Suspense>
            </div>
            
            <Card className="border-border/40 shadow-premium-none bg-card ">
              <CardHeader className="pb-spacing-sm pt-spacing-sm px-spacing-sm">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-primary flex items-center gap-spacing-xs">
                  <MessageSquare className="w-spacing-sm h-spacing-sm" /> Últimas Reflexões
                </CardTitle>
              </CardHeader>
              <CardContent className="px-spacing-sm pb-spacing-sm pt-spacing-2xs space-y-spacing-sm">
                {recentJournal.length > 0 ? (
                  recentJournal.map((entry) => (
                    <div key={entry.id} className="p-spacing-xs rounded-premium bg-muted/20 border border-border/10 space-y-spacing-2xs hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between text-premium-xs font-bold">
                        <span className="text-primary truncate max-w-[120px]">{entry.profiles?.name || 'Anônimo'}</span>
                        <span className="text-muted-foreground opacity-60">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-premium-small leading-relaxed line-clamp-spacing-xs italic opacity-80">"{entry.content}"</p>
                      {entry.mood && (
                        <Badge variant="outline" className="text-premium-xs font-black h-spacing-md px-spacing-2xs uppercase tracking-tighter bg-primary/5 border-primary/20 text-primary">
                          {entry.mood}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-spacing-xl text-center text-premium-xs text-muted-foreground uppercase font-black tracking-widest opacity-40">
                    Nenhuma reflexão recente.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segmentation Tab */}
        <TabsContent value="segmentation">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminCrmSegmentation users={users} onSelectUser={setSelectedUser} />
          </Suspense>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminThemesTab />
          </Suspense>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminCrmRetention users={users} totalRevenue={stats?.totalRevenue ?? 0} transactions={stats?.recentTransactions ?? []} />
          </Suspense>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <Suspense fallback={<Skeleton className="h-[300px] rounded-premium-full" />}>
            <AdminCrmAutomations />
          </Suspense>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Suspense fallback={<Skeleton className="h-[300px] rounded-premium-full" />}>
            <AdminTransactionsTab transactions={stats?.recentTransactions || []} />
          </Suspense>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-spacing-md">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminPartnersTab />
          </Suspense>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-spacing-md">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminContentTab />
          </Suspense>
        </TabsContent>

        {/* Journeys Tab */}
        <TabsContent value="journeys" className="space-y-spacing-md">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminJourneysTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="seo" className="space-y-spacing-md">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminSeoTab />
          </Suspense>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-spacing-md outline-none">
          <Suspense fallback={
            <Card className="border-primary/20 bg-primary/5 animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-spacing-sm">
                  <div className="p-spacing-xs bg-primary/10 rounded-premium">
                    <Shield className="w-spacing-md h-spacing-md text-primary animate-spin" />
                  </div>
                  <div>
                    <CardTitle className="text-primary uppercase font-black tracking-widest text-premium-xs">Verificando Segurança</CardTitle>
                    <CardDescription className="text-premium-xs font-bold uppercase opacity-60">Escaneando vulnerabilidades e RLS...</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-spacing-md">
                <Skeleton className="h-spacing-2xl w-full rounded-premium-full bg-primary/10" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
                  <Skeleton className="h-spacing-4xl w-full rounded-premium-full bg-primary/5" />
                  <Skeleton className="h-spacing-4xl w-full rounded-premium-full bg-primary/5" />
                </div>
                <Skeleton className="h-spacing-4xl w-full rounded-premium-full bg-primary/5" />
              </CardContent>
            </Card>
          }>
            <SecurityAuditPage key={securityResetKey} />
          </Suspense>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-spacing-md">
          <div className="flex items-center gap-spacing-sm">
            <div className="relative flex-1">
              <Search className="absolute left-spacing-sm top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou email..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-spacing-xl"
              />
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Card>
            <CardContent className="p-spacing-0">
              <div className="overflow-x-auto">
                <table className="w-full text-premium-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      <th className="text-left px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60 cursor-pointer hover:text-primary" onClick={() => toggleSort('name')}>
                        Nome <SortIcon field="name" />
                      </th>
                      <th className="text-left px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60 hidden md:table-cell">Email</th>
                      <th className="text-center px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60">Status</th>
                      <th className="text-center px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60">Cargo</th>
                      <th className="text-center px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60 cursor-pointer hover:text-primary hidden lg:table-cell" onClick={() => toggleSort('xp')}>
                        XP <SortIcon field="xp" />
                      </th>
                      <th className="text-center px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60 cursor-pointer hover:text-primary hidden lg:table-cell" onClick={() => toggleSort('created_at')}>
                        Cadastro <SortIcon field="created_at" />
                      </th>
                      <th className="text-center px-spacing-sm py-spacing-xs font-black uppercase tracking-widest text-premium-xs opacity-60">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="px-spacing-sm py-spacing-xs">
                          <div className="flex items-center gap-spacing-xs">
                            <div className="w-spacing-lg h-spacing-lg rounded bg-foreground text-background flex items-center justify-center font-black text-premium-xs shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-bold text-premium-xs truncate max-w-[120px]">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-spacing-sm py-spacing-xs text-muted-foreground hidden md:table-cell truncate max-w-[180px] text-premium-xs font-medium">{u.email}</td>
                        <td className="px-spacing-sm py-spacing-xs text-center">
                          {u.is_premium ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 gap-spacing-2xs text-premium-xs font-bold h-spacing-md px-spacing-2xs shadow-premium-none">
                              <Crown className="w-spacing-xs h-spacing-xs" /> PRO
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-spacing-2xs text-premium-xs font-bold h-spacing-md px-spacing-2xs shadow-premium-none">GRATUITO</Badge>
                          )}
                        </td>
                        <td className="px-spacing-sm py-spacing-xs text-center">
                          {u.role === 'admin' ? (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-spacing-2xs text-premium-xs font-bold h-spacing-md px-spacing-2xs shadow-premium-none">
                              <Shield className="w-spacing-xs h-spacing-xs" /> ADMIN
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-spacing-2xs text-premium-xs font-bold h-spacing-md px-spacing-2xs shadow-premium-none">USER</Badge>
                          )}
                        </td>
                        <td className="px-spacing-sm py-spacing-xs text-center hidden lg:table-cell font-mono text-premium-xs font-bold">{u.xp ?? 0}</td>
                        <td className="px-spacing-sm py-spacing-xs text-center hidden lg:table-cell text-premium-xs font-medium text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-spacing-sm py-spacing-xs text-center">
                          <div className="flex items-center justify-center gap-spacing-2xs">
                            <Button
                              onClick={() => handleTogglePremium(u.id, u.is_premium)}
                              title={u.is_premium ? 'Remover PRO' : 'Ativar PRO'}
                              variant="ghost" size="icon-xs" className="bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            >
                              <Crown />
                            </Button>
                            <Button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              title={u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                              variant="ghost" size="icon-xs" className="bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <UserCog />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={7} className="p-spacing-xl text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Manual Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-spacing-xs text-premium-sm"><Crown className="w-spacing-md h-spacing-md text-primary" /> Controle Manual de Acesso</CardTitle>
              <CardDescription>Libere ou remova o acesso PRO de um usuário pelo email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-spacing-md">
              <div className="flex flex-col sm:flex-row gap-spacing-sm">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-spacing-xs">
                  <Button
                    onClick={() => handleManualPremium(true)}
                    disabled={manualLoading || !manualEmail.trim()}
                    className="gap-spacing-xs"
                    size="sm"
                  >
                    <Crown className="w-spacing-md h-spacing-md" /> Liberar PRO
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleManualPremium(false)}
                    disabled={manualLoading || !manualEmail.trim()}
                    className="gap-spacing-xs"
                    size="sm"
                  >
                    Remover PRO
                  </Button>
                </div>
              </div>
              <p className="text-premium-xs text-muted-foreground">
                O usuário precisa estar cadastrado na plataforma. A alteração tem efeito imediato.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-spacing-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
            <Card>
              <CardHeader>
                <CardTitle className="text-premium-lg">Distribuição por Estado</CardTitle>
                <CardDescription>Estados com mais usuários ativos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-spacing-md">
                  {stats?.statesStats.length === 0 ? (
                    <p className="text-premium-sm text-muted-foreground">Nenhum dado disponível.</p>
                  ) : (
                    stats?.statesStats.map(s => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-spacing-xs">
                          <Badge variant="outline">{s.name}</Badge>
                          <span className="text-premium-sm font-medium">{s.name}</span>
                        </div>
                        <span className="text-premium-sm font-bold">{s.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-premium-lg">Distribuição por Diocese</CardTitle>
                <CardDescription>Principais dioceses da comunidade.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-spacing-md max-h-[400px] overflow-y-auto pr-spacing-xs custom-scrollbar">
                  {stats?.diocesesStats.length === 0 ? (
                    <p className="text-premium-sm text-muted-foreground">Nenhum dado disponível.</p>
                  ) : (
                    stats?.diocesesStats.map(d => (
                      <div key={d.name} className="flex items-center justify-between group">
                        <span className="text-premium-sm text-muted-foreground group-hover:text-foreground transition-colors">{d.name}</span>
                        <span className="text-premium-sm font-bold">{d.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-premium-lg">Movimentos & Pastorais</CardTitle>
                <CardDescription>Engajamento por grupo eclesial.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-spacing-md max-h-[400px] overflow-y-auto pr-spacing-xs custom-scrollbar">
                  {stats?.movementsStats.length === 0 ? (
                    <p className="text-premium-sm text-muted-foreground">Nenhum dado disponível.</p>
                  ) : (
                    stats?.movementsStats.map(m => (
                      <div key={m.name} className="flex items-center justify-between">
                        <span className="text-premium-sm text-muted-foreground">{m.name}</span>
                        <span className="text-premium-sm font-bold">{m.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="regression" className="space-y-spacing-lg">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium" />}>
            <VisualRegressionDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="construction">

          <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
            <AdminConstructionTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="design">
          <Suspense fallback={<Skeleton className="h-[600px] rounded-[2rem]" />}>
            <DesignSystemGuide />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
