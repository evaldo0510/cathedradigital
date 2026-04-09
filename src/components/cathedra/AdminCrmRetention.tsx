import React, { useMemo, useCallback, useState } from 'react';
import {
  Flame, TrendingDown, TrendingUp, Users, Clock, Activity,
  AlertTriangle, UserMinus, UserPlus, Download, DollarSign,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
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

interface Transaction {
  id: string;
  amount: number;
  status: string | null;
  created_at: string | null;
}

interface Props {
  users: UserProfile[];
  totalRevenue: number;
  transactions: Transaction[];
}

const daysSince = (date: string | null) => {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

const calcDelta = (current: number, previous: number): { pct: string; direction: 'up' | 'down' | 'flat' } => {
  if (previous === 0 && current === 0) return { pct: '0', direction: 'flat' };
  if (previous === 0) return { pct: '+∞', direction: 'up' };
  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 0.5) return { pct: '0', direction: 'flat' };
  return { pct: `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`, direction: delta > 0 ? 'up' : 'down' };
};

const DeltaBadge: React.FC<{ current: number; previous: number; invertColor?: boolean }> = ({ current, previous, invertColor }) => {
  const { pct, direction } = calcDelta(current, previous);
  const isGood = invertColor ? direction === 'down' : direction === 'up';
  const isBad = invertColor ? direction === 'up' : direction === 'down';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isGood ? 'text-emerald-600' : isBad ? 'text-destructive' : 'text-muted-foreground'}`}>
      {direction === 'up' && <ArrowUp className="w-3 h-3" />}
      {direction === 'down' && <ArrowDown className="w-3 h-3" />}
      {direction === 'flat' && <Minus className="w-3 h-3" />}
      {pct}%
    </span>
  );
};

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(0 84% 60%)'];

const PERIOD_OPTIONS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
  { label: 'Tudo', value: 0 },
] as const;

const AdminCrmRetention: React.FC<Props> = ({ users, totalRevenue, transactions }) => {
  const [periodMonths, setPeriodMonths] = useState<number>(0);

  const cutoffDate = useMemo(() => {
    if (periodMonths === 0) return null;
    const d = new Date();
    d.setMonth(d.getMonth() - periodMonths);
    return d;
  }, [periodMonths]);

  const filteredUsers = useMemo(() => {
    if (!cutoffDate) return users;
    return users.filter(u => new Date(u.created_at) >= cutoffDate);
  }, [users, cutoffDate]);

  const filteredTransactions = useMemo(() => {
    if (!cutoffDate) return transactions;
    return transactions.filter(t => t.created_at && new Date(t.created_at) >= cutoffDate);
  }, [transactions, cutoffDate]);

  const filteredRevenue = useMemo(() => {
    return filteredTransactions
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  // Previous period data for comparison
  const prevPeriod = useMemo(() => {
    if (periodMonths === 0) return null;
    const prevEnd = new Date();
    prevEnd.setMonth(prevEnd.getMonth() - periodMonths);
    const prevStart = new Date(prevEnd);
    prevStart.setMonth(prevStart.getMonth() - periodMonths);

    const prevUsers = users.filter(u => {
      const d = new Date(u.created_at);
      return d >= prevStart && d < prevEnd;
    });
    const prevTx = transactions.filter(t => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      return d >= prevStart && d < prevEnd;
    });

    const prevActive = prevUsers.filter(u => daysSince(u.last_visit) <= 3);
    const prevChurned = prevUsers.filter(u => daysSince(u.last_visit) > 14);
    const prevPremium = prevUsers.filter(u => u.is_premium);
    const prevAvgStreak = prevUsers.length > 0
      ? prevUsers.reduce((s, u) => s + (u.streak ?? 0), 0) / prevUsers.length
      : 0;
    const prevNewUsers7d = prevUsers.filter(u => daysSince(u.created_at) <= 7);
    const prevRevenue = prevTx.filter(t => t.status === 'approved').reduce((s, t) => s + Number(t.amount), 0);
    const prevRetention = prevUsers.length > 0 ? (prevActive.length / prevUsers.length) * 100 : 0;
    const prevChurn = prevUsers.length > 0 ? (prevChurned.length / prevUsers.length) * 100 : 0;
    const prevLtv = prevPremium.length > 0 ? prevRevenue / prevPremium.length : 0;
    const prevArpu = prevUsers.length > 0 ? prevRevenue / prevUsers.length : 0;

    return { retentionRate: prevRetention, churnRate: prevChurn, avgStreak: prevAvgStreak, newUsers7d: prevNewUsers7d.length, ltv: prevLtv, arpu: prevArpu };
  }, [periodMonths, users, transactions]);

  const metrics = useMemo(() => {
    const active = filteredUsers.filter(u => daysSince(u.last_visit) <= 3);
    const atRisk = filteredUsers.filter(u => daysSince(u.last_visit) >= 4 && daysSince(u.last_visit) <= 14);
    const churned = filteredUsers.filter(u => daysSince(u.last_visit) > 14);
    const newUsers7d = filteredUsers.filter(u => daysSince(u.created_at) <= 7);
    const newUsers30d = filteredUsers.filter(u => daysSince(u.created_at) <= 30);

    const avgStreak = filteredUsers.length > 0
      ? (filteredUsers.reduce((sum, u) => sum + (u.streak ?? 0), 0) / filteredUsers.length).toFixed(1)
      : '0';

    const avgXp = filteredUsers.length > 0
      ? Math.round(filteredUsers.reduce((sum, u) => sum + (u.xp ?? 0), 0) / filteredUsers.length)
      : 0;

    const retentionRate = filteredUsers.length > 0
      ? ((active.length / filteredUsers.length) * 100).toFixed(1)
      : '0';

    const churnRate = filteredUsers.length > 0
      ? ((churned.length / filteredUsers.length) * 100).toFixed(1)
      : '0';

    const streakBuckets = [
      { name: '0', count: filteredUsers.filter(u => (u.streak ?? 0) === 0).length },
      { name: '1-3', count: filteredUsers.filter(u => (u.streak ?? 0) >= 1 && (u.streak ?? 0) <= 3).length },
      { name: '4-7', count: filteredUsers.filter(u => (u.streak ?? 0) >= 4 && (u.streak ?? 0) <= 7).length },
      { name: '8-14', count: filteredUsers.filter(u => (u.streak ?? 0) >= 8 && (u.streak ?? 0) <= 14).length },
      { name: '15-30', count: filteredUsers.filter(u => (u.streak ?? 0) >= 15 && (u.streak ?? 0) <= 30).length },
      { name: '30+', count: filteredUsers.filter(u => (u.streak ?? 0) > 30).length },
    ];

    const statusPie = [
      { name: 'Ativos', value: active.length },
      { name: 'Em Risco', value: atRisk.length },
      { name: 'Inativos', value: churned.length },
    ].filter(d => d.value > 0);

    const premium = filteredUsers.filter(u => u.is_premium);

    const funnelData = [
      { name: 'Cadastrados', value: filteredUsers.length, fill: 'hsl(var(--primary))' },
      { name: 'Ativos (≤3d)', value: active.length, fill: 'hsl(142 76% 36%)' },
      { name: 'PRO', value: premium.length, fill: 'hsl(45 93% 47%)' },
    ];

    return { active, atRisk, churned, newUsers7d, newUsers30d, avgStreak, avgXp, retentionRate, churnRate, streakBuckets, statusPie, funnelData, premium };
  }, [filteredUsers]);

  const mrrData = useMemo(() => {
    const approved = filteredTransactions.filter(t => t.status === 'approved' && t.created_at);
    const monthMap: Record<string, number> = {};
    approved.forEach(t => {
      const d = new Date(t.created_at!);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + Number(t.amount);
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }));
  }, [filteredTransactions]);

  const PIE_COLORS = ['hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(0 84% 60%)'];

  const exportRetentionCsv = useCallback(() => {
    const headers = ['Nome', 'Email', 'Status', 'Plano', 'Streak', 'XP', 'Dias Inativo', 'Cadastro'];
    const rows = filteredUsers.map(u => {
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
    toast.success(`Relatório de retenção exportado (${filteredUsers.length} usuários).`);
  }, [filteredUsers]);

  return (
    <div className="space-y-6">
      {/* Period Filter + Export */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={periodMonths === opt.value ? 'default' : 'outline'}
              className="h-8 text-xs"
              onClick={() => setPeriodMonths(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportRetentionCsv} disabled={filteredUsers.length === 0}>
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{metrics.retentionRate}%</span>
              {prevPeriod && <DeltaBadge current={parseFloat(metrics.retentionRate)} previous={prevPeriod.retentionRate} />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.active.length} ativos de {filteredUsers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-destructive">{metrics.churnRate}%</span>
              {prevPeriod && <DeltaBadge current={parseFloat(metrics.churnRate)} previous={prevPeriod.churnRate} invertColor />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.churned.length} inativos ({'>'}14 dias)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Streak Médio</CardTitle>
            <Flame className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{metrics.avgStreak}</span>
              {prevPeriod && <DeltaBadge current={parseFloat(metrics.avgStreak)} previous={prevPeriod.avgStreak} />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Novos (7d)</CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{metrics.newUsers7d.length}</span>
              {prevPeriod && <DeltaBadge current={metrics.newUsers7d.length} previous={prevPeriod.newUsers7d} />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.newUsers30d.length} nos últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">LTV Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {metrics.premium.length > 0
                ? (filteredRevenue / metrics.premium.length).toFixed(2)
                : '0.00'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">receita / cliente PRO</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ARPU</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {filteredUsers.length > 0 ? (filteredRevenue / filteredUsers.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">receita / usuário total</p>
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

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Funil de Conversão</CardTitle>
          <CardDescription>Cadastro → Ativo → PRO</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {filteredUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.funnelData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36} name="Usuários">
                  {metrics.funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center pt-20">Sem dados suficientes.</p>
          )}
        </CardContent>
      </Card>

      {/* MRR Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Receita Mensal Recorrente (MRR)</CardTitle>
          <CardDescription>Evolução mensal da receita aprovada</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {mrrData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMrr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center pt-20">Sem transações aprovadas.</p>
          )}
        </CardContent>
      </Card>

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
