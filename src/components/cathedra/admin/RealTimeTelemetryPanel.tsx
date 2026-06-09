import React, { useState, useEffect, useMemo } from 'react';
import Telemetry, { TelemetryEvent } from '@/lib/telemetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/constants';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, ComposedChart 
} from 'recharts';
import { CathedraButton } from '../CathedraButton';
import AdminAuditPage from './AdminAuditPage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RealTimeTelemetryPanel: React.FC = () => {
  const [events, setEvents] = useState<TelemetryEvent[]>(Telemetry.getEvents());
  const [thresholds, setThresholds] = useState(Telemetry.getThresholds());
  const [filter, setFilter] = useState({ component: 'All', endpoint: 'All', period: '60' });
  const [showConfig, setShowConfig] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [notificationConfig, setNotificationConfig] = useState({ slack_webhook: '', email: '', enabled: false });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.app_metadata?.role;
      setIsAdmin(role === 'admin');
      setCurrentUserId(session?.user?.id);
      
      const { data } = await supabase.from('telemetry_settings').select('value').eq('key', 'notification_config').maybeSingle();
      if (data?.value) setNotificationConfig(data.value as any);
    };
    checkAdmin();
  }, []);

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
    const periodMs = parseInt(filter.period) * 60 * 1000;
    const now = Date.now();
    return events.filter(e => {
      const matchPeriod = filter.period === 'All' || (now - e.timestamp) <= periodMs;
      const matchComp = filter.component === 'All' || e.component === filter.component;
      const matchEnd = filter.endpoint === 'All' || e.endpoint === filter.endpoint;
      return matchPeriod && matchComp && matchEnd;
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
      ? JSON.stringify(filteredEvents, null, 2)
      : "Timestamp,Type,Component,Endpoint,ResponseTime,Metadata\n" + filteredEvents.map(e => 
          `${new Date(e.timestamp).toISOString()},${e.type},"${e.component || ''}","${e.endpoint || ''}",${e.responseTime || ''},"${JSON.stringify(e.metadata || {}).replace(/"/g, '""')}"`
        ).join("\n");
    
    Telemetry.audit('export', `Exportação de Telemetria (${format.toUpperCase()})`, {
      eventCount: filteredEvents.length,
      period: filter.period,
      format
    }, 'info', currentUserId);
    
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
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar configurações de telemetria');
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const newConfig = { ...thresholds, [key]: num };
    setThresholds(newConfig);
    Telemetry.setThresholds(newConfig, currentUserId);
  };

  const updateNotificationConfig = async (newConfig: any) => {
    if (!isAdmin) return;
    setNotificationConfig(newConfig);
    await supabase.from('telemetry_settings').upsert({
      key: 'notification_config',
      value: newConfig,
      updated_at: new Date().toISOString(),
      updated_by: currentUserId
    });
    toast.success('Configurações de notificação atualizadas');
  };

  return (
    <div className="space-y-spacing-lg animate-in fade-in duration-500">
      <div className="flex flex-col gap-spacing-md md:flex-row md:items-center md:justify-between bg-muted/20 p-spacing-lg rounded-[2.5rem] border border-primary/5 shadow-premium-sm">
        <div className="space-y-1">
          <h2 className="text-premium-xl font-black uppercase tracking-tight flex items-center gap-spacing-xs">
            <Icons.Activity className="text-primary animate-pulse" />
            Telemetria Avançada
          </h2>
          <div className="flex items-center gap-spacing-sm">
            <CathedraButton 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAudit(!showAudit)}
              className="h-6 px-2 text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary"
            >
              <Icons.History className="w-3 h-3 mr-1" />
              {showAudit ? 'Voltar para Tempo Real' : 'Ver Auditoria'}
            </CathedraButton>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">|</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Stream Live</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-spacing-sm">
          <CathedraButton 
            variant="outline" 
            size="sm" 
            onClick={() => setShowConfig(!showConfig)}
            className="rounded-premium-full border-primary/20"
          >
            <Icons.Settings className="w-4 h-4 mr-2" />
            Limiares
          </CathedraButton>
          
          <div className="flex items-center bg-background/50 rounded-premium-full p-1 border border-border/40">
            <CathedraButton variant="ghost" size="sm" onClick={() => handleExport('csv')} className="h-8 rounded-premium-full px-3 text-[10px]">
              CSV
            </CathedraButton>
            <CathedraButton variant="ghost" size="sm" onClick={() => handleExport('json')} className="h-8 rounded-premium-full px-3 text-[10px]">
              JSON
            </CathedraButton>
          </div>
        </div>
      </div>

      {showConfig && (
        <Card className="rounded-[2rem] border-primary/20 bg-primary/[0.02] animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-spacing-lg grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
            {!isAdmin && (
              <div className="col-span-full mb-2 flex items-center gap-2 text-destructive text-[10px] font-bold uppercase">
                <Icons.Lock className="w-3 h-3" />
                Apenas visualização - Acesso restrito a administradores
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-60">Limite Erros (%)</label>
              <Input 
                type="number" 
                value={thresholds.errorRate} 
                onChange={(e) => updateThreshold('errorRate', e.target.value)}
                disabled={!isAdmin}
                className="rounded-xl h-10 border-primary/10 disabled:opacity-50"

              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-60">Limite Latência (ms)</label>
              <Input 
                type="number" 
                value={thresholds.avgLatency} 
                onChange={(e) => updateThreshold('avgLatency', e.target.value)}
                disabled={!isAdmin}
                className="rounded-xl h-10 border-primary/10 disabled:opacity-50"

              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-60">Limite Effect Triggers (pm)</label>
              <Input 
                type="number" 
                value={thresholds.effectTriggers} 
                onChange={(e) => updateThreshold('effectTriggers', e.target.value)}
                disabled={!isAdmin}
                className="rounded-xl h-10 border-primary/10 disabled:opacity-50"

              />
            </div>
          </CardContent>
        </Card>
      )}

      {showAudit ? (
        <AdminAuditPage />
      ) : (
        <>
          <div className="flex flex-wrap gap-spacing-md bg-muted/10 p-spacing-sm rounded-premium-full border border-border/20">
        <div className="flex items-center gap-2 px-spacing-md">
          <Icons.Filter className="w-4 h-4 opacity-40" />
          <span className="text-[9px] font-black uppercase opacity-40">Filtros:</span>
        </div>
        
        <Select value={filter.component} onValueChange={(v) => setFilter(f => ({ ...f, component: v }))}>
          <SelectTrigger className="w-[180px] h-9 rounded-premium-full border-none bg-transparent hover:bg-muted/30">
            <SelectValue placeholder="Componente" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            {components.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filter.endpoint} onValueChange={(v) => setFilter(f => ({ ...f, endpoint: v }))}>
          <SelectTrigger className="w-[180px] h-9 rounded-premium-full border-none bg-transparent hover:bg-muted/30">
            <SelectValue placeholder="Endpoint" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            {endpoints.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filter.period} onValueChange={(v) => setFilter(f => ({ ...f, period: v }))}>
          <SelectTrigger className="w-[180px] h-9 rounded-premium-full border-none bg-transparent hover:bg-muted/30">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            <SelectItem value="15">Últimos 15 min</SelectItem>
            <SelectItem value="60">Últimos 60 min</SelectItem>
            <SelectItem value="120">Últimas 2 horas</SelectItem>
            <SelectItem value="All">Todo o histórico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {events.filter(e => e.type === 'alert').length > 0 && (
        <div className="space-y-spacing-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest px-spacing-md opacity-60 flex items-center gap-2">
            <Icons.ShieldAlert className="w-3 h-3 text-destructive" />
            Alertas de Performance Ativos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
            {events.filter(e => e.type === 'alert').slice(-3).reverse().map((alert, i) => (
              <div key={i} className={`p-spacing-md rounded-[1.5rem] border animate-in zoom-in-95 duration-300 ${
                alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/30' : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className={`text-[11px] font-black uppercase ${
                      alert.severity === 'critical' ? 'text-destructive' : 'text-amber-600'
                    }`}>
                      {alert.metadata?.title}
                    </p>
                    <p className="text-[10px] opacity-70 leading-tight">{alert.metadata?.message}</p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[8px] rounded-full">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="mt-2 text-[8px] opacity-40 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              Linha do Tempo: Render Cycles vs API
            </CardTitle>
          </CardHeader>
          <CardContent className="p-spacing-lg h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={metrics.timePoints}>
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
                  name="useEffect Triggers" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorEffects)" 
                  strokeWidth={2}
                />
                <Bar 
                  dataKey="requests" 
                  name="API Requests" 
                  fill="#3b82f6" 
                  barSize={10} 
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
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
        <CardHeader className="bg-muted/20 border-b border-border/40 py-spacing-md flex flex-row items-center justify-between">
          <CardTitle className="text-premium-xs font-black uppercase tracking-widest">Feed de Eventos Filtrado</CardTitle>
          <Badge variant="outline" className="text-[9px] font-mono">Mostrando {filteredEvents.length} eventos</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/10 border-b border-border/40">
              <tr>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Horário</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Tipo</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Componente</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Endpoint</th>
                <th className="px-spacing-md py-spacing-xs text-[9px] font-black uppercase opacity-40">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredEvents.slice(-10).reverse().map((event, i) => (
                <tr key={i} className="hover:bg-muted/5 transition-colors">
                  <td className="px-spacing-md py-spacing-sm font-mono text-[9px] opacity-60">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-spacing-md py-spacing-sm">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      event.type === 'error' || event.type === 'navigation_error' ? 'bg-destructive/10 text-destructive' :
                      event.type === 'request' ? 'bg-blue-500/10 text-blue-600' :
                      event.type === 'alert' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-spacing-md py-spacing-sm text-[10px] font-bold">
                    {event.component || 'Global'}
                  </td>
                  <td className="px-spacing-md py-spacing-sm text-[10px] opacity-60 font-mono">
                    {event.endpoint || '-'}
                  </td>
                  <td className="px-spacing-md py-spacing-sm text-[10px] opacity-60 truncate max-w-[200px]">
                    {event.responseTime ? `${event.responseTime}ms` : 
                     event.type === 'alert' ? event.metadata?.title :
                     event.metadata ? JSON.stringify(event.metadata) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}
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
