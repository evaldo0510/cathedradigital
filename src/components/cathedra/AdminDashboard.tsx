import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, TrendingUp, Download, DollarSign, ArrowUpRight,
  BarChart3, Calendar, AlertCircle, Crown, Shield, Search,
  ChevronDown, ChevronUp, UserCog, ArrowLeft, Home, Smartphone, MonitorSmartphone,
  Target, Activity, Bell, LayoutGrid, UserCheck, Handshake, Heart, Wallet,
  MessageSquare, Map as MapIcon
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'xp'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const [statsRes, metricsRes, transactionsRes, journalRes, journeysStartedRes, journeysCompletedRes, crmRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('app_metrics').select('*'),
          supabase.from('transactions').select('*').order('created_at', { ascending: false }),
          supabase.from('spiritual_journal').select('user_id', { count: 'exact', head: true }),
          supabase.from('journey_progress').select('user_id', { count: 'exact', head: true }),
          supabase.from('journey_progress').select('user_id', { count: 'exact', head: true }).not('completed_at', 'is', null),
          supabase.from('user_management_stats').select('*')
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
              return date >= start && date <= end;
            })
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
            
          return { name: `Sem ${4 - weeksAgo}`, amount };
        });

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
          recentTransactions: transactions.slice(0, 10),
          userGrowth,
          revenueData,
        });


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
    return sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  // If a user profile is selected, show it
  if (selectedUser) {
    return (
      <div className="space-y-8 pb-10">
        <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
          <AdminCrmUserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />
        </Suspense>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">CRM & Gestão completa da plataforma.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/hoje')}
          className="flex items-center gap-2 shrink-0"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar ao App</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <LayoutGrid className="w-3.5 h-3.5 hidden sm:block" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-3.5 h-3.5 hidden sm:block" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="w-3.5 h-3.5 hidden sm:block" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-1.5 text-xs sm:text-sm">
            <Handshake className="w-3.5 h-3.5 hidden sm:block" /> Parceiros
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="w-3.5 h-3.5 hidden sm:block" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="journeys" className="gap-1.5 text-xs sm:text-sm">
            <MapIcon className="w-3.5 h-3.5 hidden sm:block" /> Jornadas
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="gap-1.5 text-xs sm:text-sm">
            <Target className="w-3.5 h-3.5 hidden sm:block" /> CRM
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">Usuários cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <UserCheck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.activeLast30Days}</div>
                <p className="text-xs text-muted-foreground mt-1">Ativos nos últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Usuários PRO</CardTitle>
                <Crown className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{stats?.premiumUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">Assinantes ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.returnRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Usuários recorrentes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Acumulado bruto</p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Doação (50%)</CardTitle>
                <Heart className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((stats?.totalRevenue || 0) * 0.5)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Destinado à caridade</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Valor Restante</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((stats?.totalRevenue || 0) * 0.5)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Manutenção e operação</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-secondary/5 border-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Reflexões Criadas</CardTitle>
                <Heart className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{stats?.totalReflections}</div>
                <p className="text-xs text-muted-foreground mt-1">Impacto espiritual</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Jornadas Iniciadas</CardTitle>
                <MapIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.totalJourneysStarted}</div>
                <p className="text-xs text-muted-foreground mt-1">Engajamento em trilhas</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Jornadas Concluídas</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.totalJourneysCompleted}</div>
                <p className="text-xs text-muted-foreground mt-1">Sucesso formativo</p>
              </CardContent>
            </Card>
          </div>


          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Ativos Hoje</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeToday}</div>
                <p className="text-xs text-muted-foreground mt-1">Visitantes hoje</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Inativos</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.inactiveUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">{'>'} 48h sem acesso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Instalações PWA</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pwaInstalls}</div>
                <p className="text-xs text-muted-foreground mt-1">Total instalados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Jornadas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.journeysInProgress}</div>
                <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Removido duplicatas de cards financeiros e PWA já incluídos acima */}

          {/* Charts */}
          <Suspense fallback={<Skeleton className="h-[350px] rounded-xl" />}>
            <AdminChartsTab userGrowth={stats?.userGrowth || []} revenueData={stats?.revenueData || []} />
          </Suspense>
        </TabsContent>

        {/* Segmentation Tab */}
        <TabsContent value="segmentation">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <AdminCrmSegmentation users={users} onSelectUser={setSelectedUser} />
          </Suspense>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <AdminCrmRetention users={users} totalRevenue={stats?.totalRevenue ?? 0} transactions={stats?.recentTransactions ?? []} />
          </Suspense>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <Suspense fallback={<Skeleton className="h-[300px] rounded-xl" />}>
            <AdminCrmAutomations />
          </Suspense>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Suspense fallback={<Skeleton className="h-[300px] rounded-xl" />}>
            <AdminTransactionsTab transactions={stats?.recentTransactions || []} />
          </Suspense>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <AdminPartnersTab />
          </Suspense>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <AdminContentTab />
          </Suspense>
        </TabsContent>

        {/* Journeys Tab */}
        <TabsContent value="journeys" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <AdminJourneysTab />
          </Suspense>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou email..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold cursor-pointer hover:text-primary" onClick={() => toggleSort('name')}>
                        Nome <SortIcon field="name" />
                      </th>
                      <th className="text-left p-4 font-semibold hidden md:table-cell">Email</th>
                      <th className="text-center p-4 font-semibold">Status</th>
                      <th className="text-center p-4 font-semibold">Cargo</th>
                      <th className="text-center p-4 font-semibold cursor-pointer hover:text-primary hidden lg:table-cell" onClick={() => toggleSort('xp')}>
                        XP <SortIcon field="xp" />
                      </th>
                      <th className="text-center p-4 font-semibold cursor-pointer hover:text-primary hidden lg:table-cell" onClick={() => toggleSort('created_at')}>
                        Cadastro <SortIcon field="created_at" />
                      </th>
                      <th className="text-center p-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-black text-xs shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium truncate max-w-[150px]">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{u.email}</td>
                        <td className="p-4 text-center">
                          {u.is_premium ? (
                            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                              <Crown className="w-3 h-3" /> PRO
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">Gratuito</Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {u.role === 'admin' ? (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
                              <Shield className="w-3 h-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">Usuário</Badge>
                          )}
                        </td>
                        <td className="p-4 text-center hidden lg:table-cell font-mono text-xs">{u.xp ?? 0}</td>
                        <td className="p-4 text-center hidden lg:table-cell text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleTogglePremium(u.id, u.is_premium)}
                              title={u.is_premium ? 'Remover PRO' : 'Ativar PRO'}
                              className={`p-1.5 rounded-lg transition-all ${u.is_premium ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:text-primary'}`}
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              title={u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                              className={`p-1.5 rounded-lg transition-all ${u.role === 'admin' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-muted text-muted-foreground hover:text-destructive'}`}
                            >
                              <UserCog className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Manual Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><Crown className="w-4 h-4 text-primary" /> Controle Manual de Acesso</CardTitle>
              <CardDescription>Libere ou remova o acesso PRO de um usuário pelo email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleManualPremium(true)}
                    disabled={manualLoading || !manualEmail.trim()}
                    className="gap-2"
                    size="sm"
                  >
                    <Crown className="w-4 h-4" /> Liberar PRO
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleManualPremium(false)}
                    disabled={manualLoading || !manualEmail.trim()}
                    className="gap-2"
                    size="sm"
                  >
                    Remover PRO
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O usuário precisa estar cadastrado na plataforma. A alteração tem efeito imediato.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
