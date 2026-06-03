import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminStats {
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
  userGrowth: { name: string; total: number }[];
  revenueData: { name: string; amount: number }[];
  diocesesStats: { name: string; count: number }[];
  statesStats: { name: string; count: number }[];
  movementsStats: { name: string; count: number }[];
  users: AdminUser[];
}

export interface AdminUser {
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

export const useAdminDashboardData = () => {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const thirtyDaysAgoStart = new Date();
      thirtyDaysAgoStart.setDate(new Date().getDate() - 30);
      const iso30 = thirtyDaysAgoStart.toISOString();

      const [statsRes, metricsRes, transactionsRes, journalRes, journeysStartedRes, journeysCompletedRes, crmRes] = await Promise.all([
        supabase.from('profiles').select('id, is_premium, created_at, last_visit, diocese, estado, movimento_pastoral, name, role, xp, level, streak'),
        supabase.from('app_metrics').select('metric_type, created_at').gte('created_at', iso30),
        supabase.from('transactions').select('amount, status, created_at, profiles(name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('spiritual_journal').select('user_id', { count: 'exact', head: true }),
        supabase.from('journey_progress').select('user_id', { count: 'exact', head: true }),
        supabase.from('journey_progress').select('user_id', { count: 'exact', head: true }).not('completed_at', 'is', null),
        supabase.from('user_management_stats').select('id, email, classification, reflections_count, current_journey, last_activity').limit(1000),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (metricsRes.error) throw metricsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      const allProfiles = statsRes.data || [];
      const metrics = metricsRes.data || [];
      const transactions = transactionsRes.data || [];

      const premiumCount = allProfiles.filter(p => p.is_premium).length;
      const visitsCount = metrics.filter(m => m.metric_type === 'visit').length;
      const downloadsCount = metrics.filter(m => m.metric_type === 'download').length;
      const pwaInstalls = metrics.filter(m => m.metric_type === 'pwa_install').length;
      const pwaOpens = metrics.filter(m => m.metric_type === 'pwa_open').length;
      const totalRevenue = transactions.filter(t => t.status === 'approved').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);

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

      const dioceseMap = new Map<string, number>();
      const stateMap = new Map<string, number>();
      const movementMap = new Map<string, number>();

      allProfiles.forEach(p => {
        if (p.diocese) dioceseMap.set(p.diocese, (dioceseMap.get(p.diocese) || 0) + 1);
        if (p.estado) stateMap.set(p.estado, (stateMap.get(p.estado) || 0) + 1);
        if (p.movimento_pastoral) movementMap.set(p.movimento_pastoral, (movementMap.get(p.movimento_pastoral) || 0) + 1);
      });

      return {
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
        diocesesStats: Array.from(dioceseMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        statesStats: Array.from(stateMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        movementsStats: Array.from(movementMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        users: allProfiles.map(p => {
          const crm = ((crmRes.data || []) as any[]).find(u => u.id === p.id) || {};
          return {
            ...p,
            email: crm.email || '',
            depth_level: crm.classification || 'Novo',
            reflections_count: crm.reflections_count || 0,
            current_journey: crm.current_journey || 'Nenhuma',
            last_visit: crm.last_activity || p.last_visit,
            name: (p as any).name || 'Usuário'
          } as AdminUser;
        })
      };
    },
    refetchInterval: 60000,
  });
};
