import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { AdminStats } from '@/hooks/useAdminDashboardData';

interface AdminStatsCardsProps {
  stats: AdminStats;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats }) => {
  const cards = [
    { title: 'Total de Usuários', value: stats.totalUsers, icon: Icons.Users, trend: `+${Math.round(stats.totalUsers * 0.05)} novos` },
    { title: 'Usuários PRO', value: stats.premiumUsers, icon: Icons.Star, subValue: `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% conversão`, color: 'text-amber-500' },
    { title: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString()}`, icon: Icons.DollarSign, subValue: `R$ ${stats.pendingRevenue.toLocaleString()} pendente`, color: 'text-emerald-500' },
    { title: 'Taxa de Retorno', value: `${stats.returnRate.toFixed(1)}%`, icon: Icons.RefreshCw, trend: 'Últimos 30 dias', color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-md px-spacing-md sm:px-spacing-0">
      {cards.map((card, i) => (
        <Card key={i} className="rounded-premium-lg border-primary/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-spacing-2xs">
            <CardTitle className="text-premium-xs font-bold uppercase tracking-widest opacity-60">{card.title}</CardTitle>
            <card.icon className={`h-spacing-lg w-spacing-lg ${card.color || 'text-primary'} opacity-70 group-hover:scale-110 transition-transform`} />
          </CardHeader>
          <CardContent>
            <div className="text-premium-2xl font-black tracking-tight">{card.value}</div>
            <div className="flex items-center gap-spacing-xs mt-spacing-2xs">
              {card.trend && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase py-0 px-spacing-xs rounded-full border-none">{card.trend}</Badge>}
              {card.subValue && <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{card.subValue}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
