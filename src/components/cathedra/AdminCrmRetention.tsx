import React, { useMemo, useCallback } from 'react';
import {
  Flame, TrendingDown, TrendingUp, Users, Clock, Activity,
  AlertTriangle, UserMinus, UserPlus, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

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
}

interface Props {
  users: UserProfile[];
}

const daysSince = (date: string | null) => {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(0 84% 60%)'];

const AdminCrmRetention: React.FC<Props> = ({ users }) => {
  const metrics = useMemo(() => {
    const active = users.filter(u => daysSince(u.last_visit) <= 3);
    const atRisk = users.filter(u => daysSince(u.last_visit) >= 4 && daysSince(u.last_visit) <= 14);
    const churned = users.filter(u => daysSince(u.last_visit) > 14);
    const newUsers7d = users.filter(u => daysSince(u.created_at) <= 7);
    const newUsers30d = users.filter(u => daysSince(u.created_at) <= 30);

    const avgStreak = users.length > 0
      ? (users.reduce((sum, u) => sum + (u.streak ?? 0), 0) / users.length).toFixed(1)
      : '0';

    const avgXp = users.length > 0
      ? Math.round(users.reduce((sum, u) => sum + (u.xp ?? 0), 0) / users.length)
      : 0;

    const retentionRate = users.length > 0
      ? ((active.length / users.length) * 100).toFixed(1)
      : '0';

    const churnRate = users.length > 0
      ? ((churned.length / users.length) * 100).toFixed(1)
      : '0';

    // Streak distribution
    const streakBuckets = [
      { name: '0', count: users.filter(u => (u.streak ?? 0) === 0).length },
      { name: '1-3', count: users.filter(u => (u.streak ?? 0) >= 1 && (u.streak ?? 0) <= 3).length },
      { name: '4-7', count: users.filter(u => (u.streak ?? 0) >= 4 && (u.streak ?? 0) <= 7).length },
      { name: '8-14', count: users.filter(u => (u.streak ?? 0) >= 8 && (u.streak ?? 0) <= 14).length },
      { name: '15-30', count: users.filter(u => (u.streak ?? 0) >= 15 && (u.streak ?? 0) <= 30).length },
      { name: '30+', count: users.filter(u => (u.streak ?? 0) > 30).length },
    ];

    const statusPie = [
      { name: 'Ativos', value: active.length },
      { name: 'Em Risco', value: atRisk.length },
      { name: 'Inativos', value: churned.length },
    ].filter(d => d.value > 0);

    return { active, atRisk, churned, newUsers7d, newUsers30d, avgStreak, avgXp, retentionRate, churnRate, streakBuckets, statusPie };
  }, [users]);

  const PIE_COLORS = ['hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(0 84% 60%)'];

  const exportRetentionCsv = useCallback(() => {
    const headers = ['Nome', 'Email', 'Status', 'Plano', 'Streak', 'XP', 'Dias Inativo', 'Cadastro'];
    const rows = users.map(u => {
      const days = daysSince(u.last_visit);
      const status = days <= 3 ? 'Ativo' : days <= 14 ? 'Em risco' : 'Inativo';
      return [
        u.name || '', u.email, status, u.is_premium ? 'PRO' : 'Free',
        u.streak ?? 0, u.xp ?? 0, days,
        new Date(u.created_at).toLocaleDateString('pt-BR'),
      ].map(v => `"${v}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retencao_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Relatório de retenção exportado (${users.length} usuários).`);
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Export + KPI Cards */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportRetentionCsv} disabled={users.length === 0}>
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{metrics.retentionRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.active.length} ativos de {users.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{metrics.churnRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.churned.length} inativos ({'>'}14 dias)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Streak Médio</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgStreak}</div>
            <p className="text-[11px] text-muted-foreground mt-1">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Novos (7d)</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{metrics.newUsers7d.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.newUsers30d.length} nos últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição de Streaks</CardTitle>
            <CardDescription>Frequência de dias consecutivos</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.streakBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} name="Usuários" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saúde da Base</CardTitle>
            <CardDescription>Ativos vs Em Risco vs Inativos</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center">
            {metrics.statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                    {metrics.statusPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados suficientes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Users Alert */}
      {metrics.atRisk.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" /> Usuários em Risco ({metrics.atRisk.length})
            </CardTitle>
            <CardDescription>Não acessam há 4-14 dias. Considere enviar notificação de reengajamento.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metrics.atRisk.slice(0, 12).map(u => (
                <Badge key={u.id} variant="outline" className="gap-1.5 border-amber-500/30 text-amber-700">
                  {u.name || u.email.split('@')[0]} · {daysSince(u.last_visit)}d
                </Badge>
              ))}
              {metrics.atRisk.length > 12 && (
                <Badge variant="secondary">+{metrics.atRisk.length - 12} mais</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCrmRetention;
