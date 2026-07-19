import { Icons } from '@/constants';
import React, { useEffect, useState, lazy, Suspense, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AdminHeader } from './admin/AdminHeader';
import { AdminStatsCards } from './admin/AdminStatsCards';
import { useAdminDashboardData, AdminUser } from '@/hooks/useAdminDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { CathedraCard } from './CathedraCard';
import { Badge } from '@/components/ui/badge';

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
const PerfGovernanceDashboard = lazy(() => import('./PerfGovernanceDashboard'));
const VisualRegressionDashboard = lazy(() => import('./VisualRegressionDashboard'));
const RealTimeTelemetryPanel = lazy(() => import('./admin/RealTimeTelemetryPanel'));


interface UserProfile extends AdminUser {}

interface CRMUser {
  id: string;
  email?: string;
  classification?: string;
  reflections_count?: number;
  current_journey?: string;
  last_activity?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { data: stats, isLoading, error: statsError } = useAdminDashboardData(page, pageSize);

  const [searchQuery, setSearchQuery] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'xp'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const tabsListRef = React.useRef<HTMLDivElement>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const users = stats?.users || [];

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao atualizar status PRO');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    toast.success(!currentStatus ? 'Usuário promovido a PRO' : 'Acesso PRO removido');
  };

  const handleManualPremium = async (grant: boolean) => {
    if (!manualEmail.trim()) {
      toast.error('Informe um email válido');
      return;
    }
    setManualLoading(true);
    
    const { data: sensitiveData, error: sensitiveError } = await supabase
      .from('user_sensitive_data' as any)
      .select('user_id')
      .eq('email', manualEmail.trim())
      .maybeSingle();

    if (sensitiveError || !sensitiveData) {
      setManualLoading(false);
      toast.error('Nenhum usuário encontrado com esse email');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: grant })
      .eq('id', (sensitiveData as any).user_id);

    setManualLoading(false);

    if (error) {
      toast.error('Erro ao atualizar: ' + error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    toast.success(grant ? `Premium ativado para ${manualEmail}` : `Premium removido de ${manualEmail}`);
    setManualEmail('');
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        const cmp = String(valA).localeCompare(String(valB), 'pt', { numeric: true });
        return sortAsc ? cmp : -cmp;
      });
  }, [users, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    // Adicionando data-test para ordenação
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <Icons.ChevronUp className="w-spacing-sm h-spacing-sm inline ml-spacing-2xs" /> : <Icons.ChevronDown className="w-spacing-sm h-spacing-sm inline ml-spacing-2xs" />;
  };

  if (selectedUser) {
    return (
      <div className="space-y-spacing-xl pb-spacing-xl">
        <Suspense fallback={<Skeleton className="h-[400px] rounded-premium-full" />}>
          <AdminCrmUserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />
        </Suspense>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-spacing-lg animate-pulse p-spacing-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-md">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-spacing-4xl w-full rounded-premium-lg" />)}
        </div>
        <Skeleton className="h-[400px] rounded-premium-lg" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center p-spacing-2xl text-center bg-destructive/10 rounded-premium border border-destructive/20 m-spacing-lg">
        <Icons.AlertCircle className="h-spacing-2xl w-spacing-2xl text-destructive mb-spacing-md" />
        <h2 className="text-premium-xl font-bold mb-spacing-xs">Erro ao carregar dados</h2>
        <p className="text-muted-foreground">{String(statsError)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-spacing-lg sm:space-y-spacing-xl pb-spacing-3xl sm:pb-spacing-xl px-spacing-0 sm:px-spacing-0">
      <AdminHeader onSecurityClick={() => navigate('/admin/security')} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-spacing-lg">
        <div className="px-spacing-md sm:px-spacing-0 -mx-spacing-md sm:mx-spacing-0">
          <TabsList ref={tabsListRef} className="flex w-full overflow-x-auto justify-start h-auto p-spacing-2xs bg-muted/30 border border-border/10 rounded-premium-full no-scrollbar scroll-smooth snap-x">
            <TabsTrigger value="overview" data-test="tab-overview" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.LayoutGrid className="w-spacing-sm h-spacing-sm" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" data-test="tab-users" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.Users className="w-spacing-sm h-spacing-sm" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="transactions" data-test="tab-transactions" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.DollarSign className="w-spacing-sm h-spacing-sm" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="design" data-test="tab-design" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.Palette className="w-spacing-sm h-spacing-sm" /> Design
            </TabsTrigger>
            <TabsTrigger value="regression" data-test="tab-regression" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.Eye className="w-spacing-sm h-spacing-sm" /> Regressão
            </TabsTrigger>
            <TabsTrigger value="governance" data-test="tab-governance" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.Activity className="w-spacing-sm h-spacing-sm" /> Governança
            </TabsTrigger>
            <TabsTrigger value="telemetry" data-test="tab-telemetry" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.Zap className="w-spacing-sm h-spacing-sm text-amber-500" /> Telemetria
            </TabsTrigger>

            <TabsTrigger value="content" data-test="tab-content" className="gap-spacing-xs text-premium-xs font-black uppercase tracking-widest min-w-fit px-spacing-md py-spacing-xs snap-start">
              <Icons.MessageSquare className="w-spacing-sm h-spacing-sm" /> Conteúdo
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-spacing-lg">
          {stats && <AdminStatsCards stats={stats} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-lg px-spacing-md sm:px-spacing-0">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <AdminChartsTab userGrowth={stats?.userGrowth || []} revenueData={stats?.revenueData || []} />
            </Suspense>
            
            <Card className="rounded-premium-lg border-primary/5">
              <CardHeader>
                <CardTitle className="text-premium-lg font-black uppercase">Ações Rápidas</CardTitle>
                <CardDescription>Gestão manual de acessos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-spacing-md">
                <div className="space-y-spacing-xs">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Ativar PRO por Email</label>
                  <div className="flex gap-spacing-xs">
                    <Input 
                      placeholder="email@exemplo.com" 
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="rounded-premium"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleManualPremium(true)}
                      disabled={manualLoading}
                      className="rounded-premium font-bold"
                    >
                      Ativar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-spacing-md">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <AdminCrmSegmentation 
              users={users} 
              onSelectUser={setSelectedUser}
              totalUsers={stats?.totalUsers || 0}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="transactions">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <AdminTransactionsTab transactions={stats?.recentTransactions || []} />
          </Suspense>
        </TabsContent>

        <TabsContent value="design" className="space-y-spacing-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-md px-spacing-md sm:px-spacing-0">
            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/a11y-audit')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.Activity className="text-primary" />
                <Badge variant="outline">Acessibilidade</Badge>
              </div>
              <h3 className="font-bold">Auditoria A11y</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">WCAG AA Mobile Scan.</p>
            </CathedraCard>

            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/visual-audit')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.ShieldAlert className="text-primary" />
                <Badge variant="outline">Design Tokens</Badge>
              </div>
              <h3 className="font-bold">Auditoria Visual</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">Conformidade do System.</p>
            </CathedraCard>

            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/telemetry')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.Activity className="text-primary" />
                <Badge variant="outline">Telemetria</Badge>
              </div>
              <h3 className="font-bold">Telemetria Mobile</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">Logs de erros e sessões.</p>
            </CathedraCard>

            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/ui-errors')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.ShieldAlert className="text-primary" />
                <Badge variant="outline">Depuração</Badge>
              </div>
              <h3 className="font-bold">Inspetor de Falhas</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">Inspeciona erros de UI e TypeErrors.</p>
            </CathedraCard>

            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/language')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.Languages className="text-primary" />
                <Badge variant="outline">Linguagem</Badge>
              </div>
              <h3 className="font-bold">Gestão de Vernáculo</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">Gerencie a allowlist e auditoria.</p>
            </CathedraCard>

            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/security-alerts')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.Bell className="text-primary" />
                <Badge variant="outline">Notificações</Badge>
              </div>
              <h3 className="font-bold">Alertas de Segurança</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">Monitore vulnerabilidades detectadas.</p>
            </CathedraCard>

            <CathedraCard 
              className="p-spacing-lg cursor-pointer hover:bg-primary/[0.02] transition-colors"
              onClick={() => navigate('/admin/glossario')}
            >
              <div className="flex items-center justify-between mb-spacing-md">
                <Icons.BookMarked className="text-primary" />
                <Badge variant="outline">Léxico</Badge>
              </div>
              <h3 className="font-bold">Editor de Verbetes</h3>
              <p className="text-premium-xs opacity-50 mt-spacing-xs">Crie, edite e publique termos teológicos.</p>
            </CathedraCard>

          </div>
          
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <DesignSystemGuide />
          </Suspense>
        </TabsContent>


        <TabsContent value="regression">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <VisualRegressionDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="governance">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <PerfGovernanceDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="telemetry">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <RealTimeTelemetryPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="content">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <AdminContentTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
