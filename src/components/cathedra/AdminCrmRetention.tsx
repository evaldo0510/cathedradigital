import { Icons } from '@/constants';
import React, { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
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

const DeltaBadge: React.FC<{ current: number; previous: number; invertColor?: boolean; tooltip?: string }> = ({ current, previous, invertColor, tooltip }) => {
  const { pct, direction } = calcDelta(current, previous);
  const isGood = invertColor ? direction === 'down' : direction === 'up';
  const isBad = invertColor ? direction === 'up' : direction === 'down';
  const badge = (
    <span className={`inline-flex items-center gap-spacing-3xs text-premium-xs font-medium cursor-default ${isGood ? 'text-primary' : isBad ? 'text-destructive' : 'text-muted-foreground'}`}>
      {direction === 'up' && <Icons.ArrowUp className="w-spacing-sm h-spacing-sm" />}
      {direction === 'down' && <Icons.ArrowDown className="w-spacing-sm h-spacing-sm" />}
      {direction === 'flat' && <Icons.Minus className="w-spacing-sm h-spacing-sm" />}
      {pct}%
    </span>
  );
  if (!tooltip) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="text-premium-xs">{tooltip}</TooltipContent>
    </Tooltip>
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
    const active = filteredUsers.filter(u => daysSince(u.last_visit) < 2);
    const atRisk = filteredUsers.filter(u => daysSince(u.last_visit) >= 2 && daysSince(u.last_visit) <= 7);
    const churned = filteredUsers.filter(u => daysSince(u.last_visit) > 7);
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
      const status = days < 2 ? 'Ativo' : 'Inativo';
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

  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find(o => o.value === periodMonths);
    return periodMonths === 0 ? null : `vs ${opt?.label ?? periodMonths + ' meses'} anteriores`;
  }, [periodMonths]);

  // Monthly sparkline data for KPIs
  const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const sparklines = useMemo(() => {
    const now = new Date();
    const months = 6;
    const result: { retention: { v: number; label: string }[]; churn: { v: number; label: string }[]; streak: { v: number; label: string }[]; newUsers: { v: number; label: string }[]; ltv: { v: number; label: string }[]; arpu: { v: number; label: string }[] } = {
      retention: [], churn: [], streak: [], newUsers: [], ltv: [], arpu: [],
    };

    for (let i = months - 1; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const start = new Date(end.getFullYear(), end.getMonth(), 1);

      const usersAtTime = users.filter(u => new Date(u.created_at) <= end);
      const active = usersAtTime.filter(u => {
        if (!u.last_visit) return false;
        const lv = new Date(u.last_visit);
        return lv >= start;
      });
      const churned = usersAtTime.filter(u => {
        if (!u.last_visit) return true;
        const diff = (end.getTime() - new Date(u.last_visit).getTime()) / (1000 * 60 * 60 * 24);
        return diff > 2;
      });
      const newU = users.filter(u => {
        const d = new Date(u.created_at);
        return d >= start && d <= end;
      });
      const monthTx = transactions.filter(t => {
        if (!t.created_at || t.status !== 'approved') return false;
        const d = new Date(t.created_at);
        return d >= start && d <= end;
      });
      const monthRev = monthTx.reduce((s, t) => s + Number(t.amount), 0);
      const premium = usersAtTime.filter(u => u.is_premium);
      const total = usersAtTime.length || 1;

      const label = MONTH_ABBR[start.getMonth()];
      result.retention.push({ v: (active.length / total) * 100, label });
      result.churn.push({ v: (churned.length / total) * 100, label });
      result.streak.push({ v: usersAtTime.length > 0 ? usersAtTime.reduce((s, u) => s + (u.streak ?? 0), 0) / usersAtTime.length : 0, label });
      result.newUsers.push({ v: newU.length, label });
      result.ltv.push({ v: premium.length > 0 ? monthRev / premium.length : 0, label });
      result.arpu.push({ v: monthRev / total, label });
    }
    return result;
  }, [users, transactions]);

  const SparkTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const label = payload[0]?.payload?.label || '';
    return (
      <div className="rounded-premium bg-popover px-spacing-xs py-spacing-2xs text-premium-xs font-medium text-popover-foreground shadow-premium border border-border">
        {label}: {Number(payload[0].value).toFixed(1)}
      </div>
    );
  };

  const Sparkline: React.FC<{ data: { v: number; label: string }[]; color?: string }> = ({ data, color = 'hsl(var(--primary))' }) => (
    <div className="h-spacing-xl w-spacing-3xl ml-auto">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <RechartsTooltip content={<SparkTooltip />} cursor={false} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} dot={false} activeDot={{ r: 2.5, strokeWidth: 0, fill: color }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-spacing-lg">
      {/* Period Filter + Export */}
      <div className="flex items-center justify-between flex-wrap gap-spacing-xs">
        <div className="flex gap-spacing-2xs">
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={periodMonths === opt.value ? 'default' : 'outline'}
              className="h-spacing-xl text-premium-xs"
              onClick={() => setPeriodMonths(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="h-spacing-xl text-premium-xs gap-spacing-2xs" onClick={exportRetentionCsv} disabled={filteredUsers.length === 0}>
          <Icons.Download className="w-spacing-sm h-spacing-sm" /> Exportar CSV
        </Button>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-spacing-md">
        {[
          {
            title: 'Taxa de Retenção',
            icon: <Icons.TrendingUp className="h-spacing-md w-spacing-md text-primary" />,
            value: <span className="text-premium-3xl font-bold text-primary">{metrics.retentionRate}%</span>,
            delta: prevPeriod && periodLabel ? <DeltaBadge current={parseFloat(metrics.retentionRate)} previous={prevPeriod.retentionRate} tooltip={periodLabel} /> : null,
            sub: <>{metrics.active.length} ativos de {filteredUsers.length}</>,
            spark: <Sparkline data={sparklines.retention} />,
          },
          {
            title: 'Taxa de Churn',
            icon: <Icons.TrendingDown className="h-spacing-md w-spacing-md text-destructive" />,
            value: <span className="text-premium-3xl font-bold text-destructive">{metrics.churnRate}%</span>,
            delta: prevPeriod && periodLabel ? <DeltaBadge current={parseFloat(metrics.churnRate)} previous={prevPeriod.churnRate} invertColor tooltip={periodLabel} /> : null,
            sub: <>{metrics.churned.length} inativos ({'>'}14 dias)</>,
            spark: <Sparkline data={sparklines.churn} color="hsl(var(--destructive))" />,
          },
          {
            title: 'Streak Médio',
            icon: <Icons.Flame className="h-spacing-md w-spacing-md text-accent-foreground" />,
            value: <span className="text-premium-3xl font-bold">{metrics.avgStreak}</span>,
            delta: prevPeriod && periodLabel ? <DeltaBadge current={parseFloat(metrics.avgStreak)} previous={prevPeriod.avgStreak} tooltip={periodLabel} /> : null,
            sub: 'dias consecutivos',
            spark: <Sparkline data={sparklines.streak} />,
          },
          {
            title: 'Novos (7d)',
            icon: <Icons.UserPlus className="h-spacing-md w-spacing-md text-primary" />,
            value: <span className="text-premium-3xl font-bold text-primary">{metrics.newUsers7d.length}</span>,
            delta: prevPeriod && periodLabel ? <DeltaBadge current={metrics.newUsers7d.length} previous={prevPeriod.newUsers7d} tooltip={periodLabel} /> : null,
            sub: <>{metrics.newUsers30d.length} nos últimos 30 dias</>,
            spark: <Sparkline data={sparklines.newUsers} />,
          },
          {
            title: 'LTV Médio',
            icon: <Icons.DollarSign className="h-spacing-md w-spacing-md text-primary" />,
            value: (() => { const ltv = metrics.premium.length > 0 ? filteredRevenue / metrics.premium.length : 0; return <span className="text-premium-3xl font-bold">R$ {ltv.toFixed(2)}</span>; })(),
            delta: (() => { const ltv = metrics.premium.length > 0 ? filteredRevenue / metrics.premium.length : 0; return prevPeriod && periodLabel ? <DeltaBadge current={ltv} previous={prevPeriod.ltv} tooltip={periodLabel} /> : null; })(),
            sub: 'receita / cliente PRO',
            spark: <Sparkline data={sparklines.ltv} />,
          },
          {
            title: 'ARPU',
            icon: <Icons.DollarSign className="h-spacing-md w-spacing-md text-muted-foreground" />,
            value: (() => { const arpu = filteredUsers.length > 0 ? filteredRevenue / filteredUsers.length : 0; return <span className="text-premium-3xl font-bold">R$ {arpu.toFixed(2)}</span>; })(),
            delta: (() => { const arpu = filteredUsers.length > 0 ? filteredRevenue / filteredUsers.length : 0; return prevPeriod && periodLabel ? <DeltaBadge current={arpu} previous={prevPeriod.arpu} tooltip={periodLabel} /> : null; })(),
            sub: 'receita / usuário total',
            spark: <Sparkline data={sparklines.arpu} />,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-spacing-xs space-y-0">
                <CardTitle className="text-premium-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.title}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-spacing-xs">
                      {kpi.value}
                      {kpi.delta}
                    </div>
                    <p className="text-premium-small text-muted-foreground mt-spacing-2xs">{kpi.sub}</p>
                  </div>
                  {kpi.spark}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-premium-sm">Distribuição de Streaks</CardTitle>
            <CardDescription>Frequência de dias consecutivos</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.streakBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} name="Usuários" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-premium-sm">Saúde da Base</CardTitle>
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
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-premium-sm">Sem dados suficientes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-premium-sm">Funil de Conversão</CardTitle>
          <CardDescription>Cadastro → Ativo → PRO</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {filteredUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.funnelData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36} name="Usuários">
                  {metrics.funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-premium-sm text-center pt-spacing-3xl">Sem dados suficientes.</p>
          )}
        </CardContent>
      </Card>

      {/* MRR Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-premium-sm">Receita Mensal Recorrente (MRR)</CardTitle>
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
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMrr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-premium-sm text-center pt-spacing-3xl">Sem transações aprovadas.</p>
          )}
        </CardContent>
      </Card>

      {metrics.atRisk.length > 0 && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader className="pb-spacing-sm">
            <CardTitle className="text-premium-sm flex items-center gap-spacing-xs text-secondary">
              <Icons.AlertTriangle className="w-spacing-md h-spacing-md" /> Usuários em Risco ({metrics.atRisk.length})
            </CardTitle>
            <CardDescription>Não acessam há 4-14 dias. Considere enviar notificação de reengajamento.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-spacing-xs">
              {metrics.atRisk.slice(0, 12).map(u => (
                <Badge key={u.id} variant="outline" className="gap-spacing-2xs border-secondary/30 text-amber-700">
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
    </TooltipProvider>
  );
};

export default AdminCrmRetention;
