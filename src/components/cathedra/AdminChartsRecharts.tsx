import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  userGrowth: any[];
  revenueData: any[];
}

const AdminChartsRecharts: React.FC<Props> = ({ userGrowth, revenueData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
    <Card className="border-border/40 shadow-none overflow-hidden bg-card ">
      <CardHeader className="pb-xs pt-md px-md">
        <CardTitle className="text-sm font-black uppercase tracking-tight text-primary">Crescimento de Usuários</CardTitle>
        <CardDescription className="text-premium-tiny uppercase tracking-widest opacity-60">Novos registros por mês</CardDescription>
      </CardHeader>
      <CardContent className="h-[240px] w-full p-xs sm:p-md">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))', 
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <Card className="border-border/40 shadow-none overflow-hidden bg-card ">
      <CardHeader className="pb-xs pt-md px-md">
        <CardTitle className="text-sm font-black uppercase tracking-tight text-primary">Fluxo Financeiro</CardTitle>
        <CardDescription className="text-premium-tiny uppercase tracking-widest opacity-60">Receita semanal acumulada</CardDescription>
      </CardHeader>
      <CardContent className="h-[240px] w-full p-xs sm:p-md">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              cursor={{fill: 'hsl(var(--primary) / 0.05)'}} 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))', 
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--primary))" 
              radius={[6, 6, 0, 0]} 
              barSize={32} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

export default AdminChartsRecharts;