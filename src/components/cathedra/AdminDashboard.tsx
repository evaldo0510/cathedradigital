import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, TrendingUp, Download, DollarSign, ArrowUpRight,
  BarChart3, Calendar, AlertCircle, Crown, Shield, Search,
  ChevronDown, ChevronUp, UserCog, ArrowLeft, Home, Smartphone, MonitorSmartphone,
  Target, Activity, Bell, LayoutGrid, UserCheck, Handshake, Heart, Wallet,
  MessageSquare, Map as MapIcon, Clock, Tag, Building2, RefreshCcw, Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
const NexusAuditPage = lazy(() => import('./NexusAuditPage'));

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

const AdminDashboard: React.FC = () => {
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
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [securityResetKey, setSecurityResetKey] = useState(0);

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
        if ((metricsRes as any).error) throw (metricsRes as any).error;
        if ((transactionsRes as any).error) throw (transactionsRes as any).error;

        const allProfiles = statsRes.data || [];
        const metrics = metricsRes.data || [];
        const transactions = transactionsRes.data || [];
        const crmUsers = (crmRes as any).data || [];

        const premiumCount = allProfiles.filter(p => p.is_premium).length;
        const totalRevenue = transactions.filter(t => t.status === 'approved').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);

        const now = new Date();
        const activeToday = allProfiles.filter(p => {
          if (!p.last_visit) return false;
          return new Date(p.last_visit).toDateString() === now.toDateString();
        }).length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const activeLast30Days = allProfiles.filter(p => p.last_visit && new Date(p.last_visit) >= thirtyDaysAgo).length;

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
            .filter(t => t.status === 'approved' && new Date(t.created_at) >= start && new Date(t.created_at) <= end)
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
          return { name: `Sem ${4 - weeksAgo}`, amount };
        });

        setStats({
          totalUsers: allProfiles.length,
          premiumUsers: premiumCount,
          activeToday,
          activeLast30Days,
          totalRevenue,
          pendingRevenue,
          returnRate,
          recentTransactions: transactions.slice(0, 10),
          userGrowth,
          revenueData,
          transactions
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
            last_visit: crm.last_activity
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
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (selectedUser) return (
    <div className="space-y-8 pb-10">
      <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
        <AdminCrmUserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />
      </Suspense>
    </div>
  );

  if (loading) return (
    <div className="space-y-12 p-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />)}
      </div>
      <Skeleton className="h-[500px] rounded-[3rem]" />
    </div>
  );

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col gap-2 px-4 md:px-0">
        <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight text-primary uppercase">Command Center</h1>
        <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.4em] opacity-60">Ecclesia Management System</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-10">
        <TabsList ref={tabsListRef} className="flex w-full overflow-x-auto justify-start h-auto p-2 bg-muted/20 border border-border/10 rounded-[1.5rem] no-scrollbar snap-x backdrop-blur-xl">
          <TabsTrigger value="overview" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 snap-start rounded-xl">
            <LayoutGrid className="w-4 h-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 snap-start rounded-xl">
            <Users className="w-4 h-4" /> Fiéis
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 snap-start rounded-xl">
            <DollarSign className="w-4 h-4" /> Ofertas
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 snap-start rounded-xl text-rose-500">
            <Shield className="w-4 h-4" /> Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-12 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden rounded-[2.5rem] shadow-sm relative group h-full">
                 <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-700">
                   <Users className="w-24 h-24 text-primary" />
                 </div>
                 <CardHeader className="pb-2 relative z-10">
                   <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Total de Fiéis</CardDescription>
                   <CardTitle className="text-5xl font-black tracking-tighter">{stats?.totalUsers}</CardTitle>
                 </CardHeader>
                 <CardContent className="relative z-10">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                     <TrendingUp className="h-4 w-4" />
                     <span>Crescimento Orgânico</span>
                   </div>
                 </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50 bg-gradient-to-br from-secondary/10 via-card to-card overflow-hidden rounded-[2.5rem] shadow-sm relative group h-full">
                 <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-700">
                   <Crown className="w-24 h-24 text-secondary" />
                 </div>
                 <CardHeader className="pb-2 relative z-10">
                   <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/60">Fiéis PRO</CardDescription>
                   <CardTitle className="text-5xl font-black tracking-tighter">{stats?.premiumUsers}</CardTitle>
                 </CardHeader>
                 <CardContent className="relative z-10">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary">
                     <Target className="h-4 w-4" />
                     <span>{((stats?.premiumUsers / stats?.totalUsers) * 100).toFixed(1)}% Conversão</span>
                   </div>
                 </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 via-card to-card overflow-hidden rounded-[2.5rem] shadow-sm relative group h-full">
                 <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-700">
                   <DollarSign className="w-24 h-24 text-emerald-500" />
                 </div>
                 <CardHeader className="pb-2 relative z-10">
                   <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60">Dízimos & Ofertas</CardDescription>
                   <CardTitle className="text-4xl font-black tracking-tighter">R$ {stats?.totalRevenue.toLocaleString()}</CardTitle>
                 </CardHeader>
                 <CardContent className="relative z-10">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                     <Activity className="h-4 w-4" />
                     <span>R$ {stats?.pendingRevenue.toLocaleString()} Pendente</span>
                   </div>
                 </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 bg-gradient-to-br from-rose-500/10 via-card to-card overflow-hidden rounded-[2.5rem] shadow-sm relative group h-full">
                 <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-700">
                   <Target className="w-24 h-24 text-rose-500" />
                 </div>
                 <CardHeader className="pb-2 relative z-10">
                   <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600/60">Retenção de Almas</CardDescription>
                   <CardTitle className="text-5xl font-black tracking-tighter">{stats?.returnRate.toFixed(1)}%</CardTitle>
                 </CardHeader>
                 <CardContent className="relative z-10">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600">
                     <Clock className="h-4 w-4" />
                     <span>{stats?.activeToday} Ativos hoje</span>
                   </div>
                 </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-xl">
               <CardHeader className="bg-muted/10 border-b border-border/20 p-8">
                 <CardTitle className="font-serif text-2xl font-black">Crescimento de Membros</CardTitle>
                 <CardDescription>Fluxo de novos peregrinos nos últimos meses</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                 <Suspense fallback={<Skeleton className="h-[300px]" />}>
                   <AdminChartsTab userGrowth={stats?.userGrowth || []} revenueData={stats?.revenueData || []} />
                 </Suspense>
               </CardContent>
             </Card>

             <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-xl">
               <CardHeader className="bg-muted/10 border-b border-border/20 p-8">
                 <CardTitle className="font-serif text-2xl font-black">Ofertas Recentes</CardTitle>
                 <CardDescription>Últimas transações aprovadas e pendentes</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                 <Suspense fallback={<Skeleton className="h-[300px]" />}>
                   <AdminTransactionsTab transactions={stats?.transactions || []} />
                 </Suspense>
               </CardContent>
             </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
