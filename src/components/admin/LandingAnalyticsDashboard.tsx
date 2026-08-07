import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  ts: number;
}

export const LandingAnalyticsDashboard = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    const checkEvents = () => {
      if (typeof window !== 'undefined') {
        const cathedraEvents = (window as any).__cathedra_events || [];
        setEvents([...cathedraEvents]);
      }
    };

    checkEvents();
    const interval = setInterval(checkEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const conversionEvents = events.filter(e => e.name === 'conversion');
    const signupClicks = conversionEvents.filter(e => e.properties?.type === 'signup_click').length;
    const journeyStarts = conversionEvents.filter(e => e.properties?.type === 'start_journey').length;
    const leads = conversionEvents.filter(e => e.properties?.type === 'lead_capture_success').length;
    
    const navClicks = events.filter(e => e.name === 'navigation_click');
    const bibleClicks = navClicks.filter(e => e.properties?.target === 'bible').length;

    return {
      totalConversions: conversionEvents.length,
      signupClicks,
      journeyStarts,
      leads,
      bibleClicks,
      conversionRate: events.length > 0 ? ((conversionEvents.length / events.length) * 100).toFixed(1) : '0'
    };
  }, [events]);

  const chartData = [
    { name: 'Jornada', value: stats.journeyStarts, color: '#0B1F3A' },
    { name: 'Cadastro', value: stats.signupClicks, color: '#C8A96A' },
    { name: 'Leads', value: stats.leads, color: '#10b981' },
    { name: 'Bíblia', value: stats.bibleClicks, color: '#6366f1' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Conversões" value={stats.totalConversions} icon={<Icons.Zap className="w-4 h-4" />} />
        <StatCard label="Leads Capturados" value={stats.leads} icon={<Icons.Mail className="w-4 h-4" />} color="text-emerald-600" />
        <StatCard label="Inícios de Jornada" value={stats.journeyStarts} icon={<Icons.Star className="w-4 h-4" />} />
        <StatCard label="Taxa de Engajamento" value={`${stats.conversionRate}%`} icon={<Icons.Activity className="w-4 h-4" />} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Icons.Activity className="w-4 h-4" /> Distribuição de Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Icons.ShieldCheck className="w-4 h-4" /> Últimos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
              {events.length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-xs italic">Nenhum evento registrado nesta sessão.</p>
              )}
              {events.slice().reverse().map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Badge variant={e.name === 'conversion' ? 'default' : 'outline'} className="text-[9px] uppercase">
                      {e.name}
                    </Badge>
                    <span className="text-muted-foreground font-mono">
                      {e.properties?.type || e.properties?.target || '-'}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-40">
                    {new Date(e.ts).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color?: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center opacity-70">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold font-serif ${color || ''}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
);
