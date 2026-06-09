
import React, { useState, useEffect, useMemo } from 'react';
import Telemetry, { TelemetryEvent } from '@/lib/telemetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/constants';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell 
} from 'recharts';

const RealTimeTelemetryPanel: React.FC = () => {
  const [events, setEvents] = useState<TelemetryEvent[]>(Telemetry.getEvents());
  const [thresholds, setThresholds] = useState(Telemetry.getThresholds());
  const [filter, setFilter] = useState({ component: 'All', endpoint: 'All' });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Subscrever a atualizações de telemetria
    const unsubscribe = Telemetry.subscribe((newEvents) => {
      setEvents(newEvents);
    });

    // Atualizar a cada segundo para manter o "tempo real" mesmo sem novos eventos
    const interval = setInterval(() => {
      setEvents(Telemetry.getEvents());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchComp = filter.component === 'All' || e.component === filter.component;
      const matchEnd = filter.endpoint === 'All' || e.endpoint === filter.endpoint;
      return matchComp && matchEnd;
    });
  }, [events, filter]);

  const components = useMemo(() => ['All', ...new Set(events.map(e => e.component).filter(Boolean))], [events]);
  const endpoints = useMemo(() => ['All', ...new Set(events.map(e => e.endpoint).filter(Boolean))], [events]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const last60s = now - 60000;
    
    // Filtrar eventos dos últimos 60 segundos para os gráficos de linha do tempo
    const recentEvents = filteredEvents.filter(e => e.timestamp > last60s);
    
    // Agrupar por segundos para o gráfico
    const timePoints = [];
    for (let i = 59; i >= 0; i--) {
      const time = now - (i * 1000);
      const secondStart = time - 500;
      const secondEnd = time + 500;
      
      const inSecond = recentEvents.filter(e => e.timestamp >= secondStart && e.timestamp < secondEnd);
      
      timePoints.push({
        time: i === 0 ? 'Agora' : `-${i}s`,
        effects: inSecond.filter(e => e.type === 'effect_trigger').length,
        requests: inSecond.filter(e => e.type === 'request').length,
        errors: inSecond.filter(e => e.type === 'error' || e.type === 'navigation_error').length,
        responseTime: inSecond.filter(e => e.type === 'request').reduce((acc, e) => acc + (e.responseTime || 0), 0) / (inSecond.filter(e => e.type === 'request').length || 1)
      });
    }

    const summary = Telemetry.getMetricsSummary();

    return {
      timePoints,
      summary
    };
  }, [filteredEvents]);

  const handleExport = (format: 'json' | 'csv') => {
    const data = format === 'json' 
      ? JSON.stringify(events, null, 2)
      : "Timestamp,Type,Component,Endpoint,ResponseTime,Metadata\n" + events.map(e => 
          `${new Date(e.timestamp).toISOString()},${e.type},"${e.component || ''}","${e.endpoint || ''}",${e.responseTime || ''},"${JSON.stringify(e.metadata || {}).replace(/"/g, '""')}"`
        ).join("\n");
    
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-export-${new Date().toISOString()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateThreshold = (key: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const newConfig = { ...thresholds, [key]: num };
    setThresholds(newConfig);
    Telemetry.setThresholds(newConfig);
  };

  return (
    <div className="space-y-spacing-lg animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-premium-xl font-black uppercase tracking-tight flex items-center gap-spacing-xs">
          <Icons.Activity className="text-primary animate-pulse" />
          Monitoramento em Tempo Real
        </h2>
        <div className="flex items-center gap-spacing-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Live Telemetry stream</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-md">
        <MetricCard 
          title="Disparos Effect" 
          value={metrics.summary.effectTriggers} 
          unit="pm" 
          icon={<Icons.Zap className="text-amber-500" />} 
          description="Frequência de re-render/effects"
        />
        <MetricCard 
          title="Total Requisições" 
          value={metrics.summary.totalRequests} 
          unit="pm" 
          icon={<Icons.RefreshCw className="text-blue-500" />} 
          description="Chamadas ao banco e APIs"
        />
        <MetricCard 
          title="Tempo Resposta" 
          value={Math.round(metrics.summary.avgResponseTime)} 
          unit="ms" 
          icon={<Icons.History className="text-emerald-500" />} 
          description="Latência média detectada"
        />
        <MetricCard 
          title="Taxa de Erros" 
          value={metrics.summary.errorRate.toFixed(1)} 
          unit="%" 
          icon={<Icons.ShieldAlert className="text-destructive" />} 
          description="Falhas em relação ao total"
          isBad={metrics.summary.errorRate > 5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-lg">
        <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 py-spacing-md">
            <CardTitle className="text-premium-xs font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.Zap className="w-spacing-sm h-spacing-sm text-amber-500" />
              Ciclos de Renderização & Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-spacing-lg h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.timePoints}>
                <defs>
                  <linearGradient id="colorEffects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={9} interval={9} />
                <YAxis axisLine={false} tickLine={false} fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '1rem', fontSize: '10px', color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="effects" 
                  name="Effects" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorEffects)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  name="Requests" 
                  stroke="#3b82f6" 
                  fillOpacity={0.1} 
                  fill="#3b82f6" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 py-spacing-md">
            <CardTitle className="text-premium-xs font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.History className="w-spacing-sm h-spacing-sm text-emerald-500" />
              Latência & Estabilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-spacing-lg h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.timePoints}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={9} interval={9} />
                <YAxis axisLine={false} tickLine={false} fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '1rem', fontSize: '10px', color: '#fff' }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="responseTime" 
                  name="Latência (ms)" 
                  stroke="#10b981" 
                  dot={false} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  name="Erros" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-primary/10 shadow-premium overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 py-spacing-md">
          <CardTitle className="text-premium-xs font-black uppercase tracking-widest">Logs de Eventos Recentes</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/10 border-b border-border/40">
              <tr>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Horário</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Tipo</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Componente</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {events.slice(-5).reverse().map((event, i) => (
                <tr key={i} className="hover:bg-muted/5">
                  <td className="px-spacing-md py-spacing-sm font-mono text-[9px] opacity-60">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-spacing-md py-spacing-sm">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      event.type === 'error' || event.type === 'navigation_error' ? 'bg-destructive/10 text-destructive' :
                      event.type === 'request' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-amber-500/10 text-amber-600'
                    }`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-spacing-md py-spacing-sm text-[10px] font-bold">
                    {event.component || 'Global'}
                  </td>
                  <td className="px-spacing-md py-spacing-sm text-[10px] opacity-60 truncate max-w-[200px]">
                    {event.responseTime ? `${event.responseTime}ms` : event.metadata ? JSON.stringify(event.metadata) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon, description, isBad }: any) => (
  <Card className={`rounded-[2rem] border-primary/5 shadow-premium-sm overflow-hidden transition-all hover:shadow-premium ${isBad ? 'bg-destructive/5' : ''}`}>
    <CardContent className="p-spacing-md">
      <div className="flex items-start justify-between">
        <div className="space-y-spacing-xs">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-premium-2xl font-black tracking-tighter ${isBad ? 'text-destructive' : ''}`}>{value}</span>
            <span className="text-[10px] font-bold opacity-30">{unit}</span>
          </div>
          <p className="text-[9px] font-serif italic text-muted-foreground leading-tight">
            {description}
          </p>
        </div>
        <div className="p-2 bg-muted/50 rounded-xl border border-border/40">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default RealTimeTelemetryPanel;
