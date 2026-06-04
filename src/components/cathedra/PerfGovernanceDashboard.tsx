import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell
} from 'recharts';
import { format, subDays, isAfter, parseISO } from 'date-fns';

const PerfGovernanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data, error } = await supabase
        .from('app_metrics')
        .select('*')
        .eq('metric_type', 'performance_event')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setMetrics(data.map(d => ({ ...d, ...(d.metadata as object || {}) })));
      }

      setLoading(false);
    };

    fetchMetrics();
  }, []);

  const chartData = useMemo(() => {
    const grouped = metrics.reduce((acc: any, m) => {
      const date = format(new Date(m.created_at), 'dd/MM');
      if (!acc[date]) acc[date] = { date, cls: 0, inp: 0, count: 0 };
      acc[date].cls += parseFloat(m.cls || 0);
      acc[date].inp += parseFloat(m.inp || 0);
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).map((g: any) => ({
      date: g.date,
      cls: (g.cls / g.count).toFixed(4),
      inp: (g.inp / g.count).toFixed(2)
    }));
  }, [metrics]);

  const routeAverages = useMemo(() => {
    const routes = metrics.reduce((acc: any, m) => {
      const route = m.route || '/';
      if (!acc[route]) acc[route] = { route, cls: 0, inp: 0, tbt: 0, count: 0 };
      acc[route].cls += parseFloat(m.cls || 0);
      acc[route].inp += parseFloat(m.inp || 0);
      acc[route].tbt += parseFloat(m.tbt || 0);
      acc[route].count += 1;
      return acc;
    }, {});

    return Object.values(routes).map((r: any) => ({
      route: r.route,
      avgCls: (r.cls / r.count).toFixed(4),
      avgInp: (r.inp / r.count).toFixed(2),
      avgTbt: (r.tbt / r.count).toFixed(2),
      count: r.count
    }));
  }, [metrics]);

  const comparePeriods = useMemo(() => {
    const threshold = subDays(new Date(), period === '7d' ? 7 : 30);
    const before = metrics.filter(m => !isAfter(parseISO(m.created_at), threshold));
    const after = metrics.filter(m => isAfter(parseISO(m.created_at), threshold));

    const avg = (arr: any[]) => ({
      cls: arr.length ? (arr.reduce((s, m) => s + parseFloat(m.cls || 0), 0) / arr.length).toFixed(4) : 0,
      inp: arr.length ? (arr.reduce((s, m) => s + parseFloat(m.inp || 0), 0) / arr.length).toFixed(2) : 0,
      tbt: arr.length ? (arr.reduce((s, m) => s + parseFloat(m.tbt || 0), 0) / arr.length).toFixed(2) : 0,
    });

    return { before: avg(before), after: avg(after) };
  }, [metrics, period]);

  if (loading) return <div className="p-10 text-center animate-pulse">Carregando Governança...</div>;

  return (
    <div className="max-w-7xl mx-auto p-spacing-lg space-y-spacing-xl pb-spacing-4xl">
      <div className="flex flex-col gap-spacing-md">
        <CathedraButton variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
          <Icons.ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </CathedraButton>
        <div className="flex items-center justify-between">
          <h1 className="text-premium-3xl font-black tracking-tight flex items-center gap-spacing-sm">
            <Icons.Activity className="text-primary" /> Painel de Governança Perf
          </h1>
          <div className="flex bg-muted p-1 rounded-full">
            <button 
              className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase ${period === '7d' ? 'bg-background shadow-sm' : 'opacity-40'}`}
              onClick={() => setPeriod('7d')}
            >
              7 Dias
            </button>
            <button 
              className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase ${period === '30d' ? 'bg-background shadow-sm' : 'opacity-40'}`}
              onClick={() => setPeriod('30d')}
            >
              30 Dias
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
        <CathedraCard className="p-spacing-lg space-y-md">
          <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50">Comparação de CLS</h3>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold opacity-40">Anterior</p>
              <p className="text-premium-xl font-mono">{comparePeriods.before.cls}</p>
            </div>
            <Icons.ArrowRight className="opacity-20 mb-2" />
            <div>
              <p className="text-[10px] uppercase font-bold text-primary">Atual</p>
              <p className={`text-premium-xl font-mono ${parseFloat(comparePeriods.after.cls as string) < parseFloat(comparePeriods.before.cls as string) ? 'text-green-500' : 'text-red-500'}`}>
                {comparePeriods.after.cls}
              </p>
            </div>
          </div>
        </CathedraCard>

        <CathedraCard className="p-spacing-lg space-y-md">
          <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50">Média INP (ms)</h3>
          <div className="flex items-end justify-between gap-4">
             <div>
              <p className="text-[10px] uppercase font-bold opacity-40">Anterior</p>
              <p className="text-premium-xl font-mono">{comparePeriods.before.inp}</p>
            </div>
            <Icons.ArrowRight className="opacity-20 mb-2" />
            <div>
              <p className="text-[10px] uppercase font-bold text-primary">Atual</p>
              <p className={`text-premium-xl font-mono ${parseFloat(comparePeriods.after.inp as string) < parseFloat(comparePeriods.before.inp as string) ? 'text-green-500' : 'text-red-500'}`}>
                {comparePeriods.after.inp}
              </p>
            </div>
          </div>
        </CathedraCard>

        <CathedraCard className="p-spacing-lg space-y-md">
          <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50">Média TBT (ms)</h3>
          <div className="flex items-end justify-between gap-4">
             <div>
              <p className="text-[10px] uppercase font-bold opacity-40">Anterior</p>
              <p className="text-premium-xl font-mono">{comparePeriods.before.tbt}</p>
            </div>
            <Icons.ArrowRight className="opacity-20 mb-2" />
            <div>
              <p className="text-[10px] uppercase font-bold text-primary">Atual</p>
              <p className={`text-premium-xl font-mono ${parseFloat(comparePeriods.after.tbt as string) < parseFloat(comparePeriods.before.tbt as string) ? 'text-green-500' : 'text-red-500'}`}>
                {comparePeriods.after.tbt}
              </p>
            </div>
          </div>
        </CathedraCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-lg">
        <CathedraCard className="p-spacing-lg">
          <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50 mb-spacing-lg">Tendência de Estabilidade (CLS)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="cls" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CathedraCard>

        <CathedraCard className="p-spacing-lg">
          <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50 mb-spacing-lg">Impacto por Rota (Média CLS)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeAverages}>
                <XAxis dataKey="route" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip />
                <Bar dataKey="avgCls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {routeAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={0.1 + (index * 0.2)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CathedraCard>
      </div>

      <CathedraCard className="overflow-hidden">
        <div className="p-spacing-md border-b border-border/10 bg-muted/20">
          <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50">Performance por Rota</h3>
        </div>
        <table className="w-full text-left text-premium-xs">
          <thead className="bg-muted/10">
            <tr>
              <th className="p-spacing-md opacity-50 font-black uppercase tracking-widest">Rota</th>
              <th className="p-spacing-md opacity-50 font-black uppercase tracking-widest">Amostras</th>
              <th className="p-spacing-md opacity-50 font-black uppercase tracking-widest">Média CLS</th>
              <th className="p-spacing-md opacity-50 font-black uppercase tracking-widest">Média INP</th>
              <th className="p-spacing-md opacity-50 font-black uppercase tracking-widest">Média TBT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {routeAverages.map((r, i) => (
              <tr key={i} className="hover:bg-primary/[0.01]">
                <td className="p-spacing-md font-bold">{r.route}</td>
                <td className="p-spacing-md opacity-60">{r.count}</td>
                <td className="p-spacing-md font-mono text-primary">{r.avgCls}</td>
                <td className="p-spacing-md font-mono">{r.avgInp}ms</td>
                <td className="p-spacing-md font-mono">{r.avgTbt}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CathedraCard>
    </div>
  );
};

export default PerfGovernanceDashboard;
