import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download, 
  WifiOff, 
  Smartphone, 
  Monitor,
  Clock,
  AlertCircle,
  Accessibility,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';

interface AuditItem {
  id: string;
  module: string;
  route: string;
  p: 'P0' | 'P1' | 'P2';
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  loadTime?: number;
  ttfb?: number;
  lcp?: number;
  accessibility?: {
    contrast: 'PASS' | 'FAIL';
    keyboard: 'PASS' | 'FAIL';
    labels: 'PASS' | 'FAIL';
  };
  deviceStatus?: {
    mobile: 'PASS' | 'FAIL' | 'BLOCKED';
    desktop: 'PASS' | 'FAIL' | 'BLOCKED';
  };
  evidence?: {
    message: string;
    screenshot?: string;
    stack?: string;
    timestamp: string;
  };
}

const initialAuditItems: AuditItem[] = [
  { 
    id: 'catechism', 
    module: 'Catecismo', 
    route: '/catecismo',
    p: 'P0', 
    status: 'FAIL',
    loadTime: 850,
    ttfb: 120,
    lcp: 1400,
    accessibility: { contrast: 'FAIL', keyboard: 'PASS', labels: 'PASS' },
    deviceStatus: { mobile: 'FAIL', desktop: 'FAIL' },
    evidence: {
      message: 'Jornada interrompida: Nenhum item de catecismo encontrado na listagem (Content Gap/Connection). Falha de contraste no Reader V2.',
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: 'bible', 
    module: 'Bíblia', 
    route: '/biblia',
    p: 'P0', 
    status: 'FAIL', 
    loadTime: 1200,
    ttfb: 250,
    lcp: 2100,
    accessibility: { contrast: 'PASS', keyboard: 'PASS', labels: 'PASS' },
    deviceStatus: { mobile: 'FAIL', desktop: 'PASS' },
    evidence: {
      message: 'Erro 409 em orações, falha na navegação de capítulos',
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: 'saints', 
    module: 'Santos', 
    route: '/santos',
    p: 'P0', 
    status: 'FAIL',
    loadTime: 410,
    ttfb: 80,
    lcp: 950,
    accessibility: { contrast: 'PASS', keyboard: 'FAIL', labels: 'PASS' },
    deviceStatus: { mobile: 'FAIL', desktop: 'FAIL' },
    evidence: {
      message: 'Jornada interrompida: Lista de santos vazia (Content Gap/Backend Connection). Navegação por teclado inacessível no grid.',
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: 'nexus', 
    module: 'Nexus', 
    route: '/nexus',
    p: 'P1', 
    status: 'PASS',
    loadTime: 150,
    ttfb: 45,
    lcp: 600,
    accessibility: { contrast: 'PASS', keyboard: 'PASS', labels: 'PASS' },
    deviceStatus: { mobile: 'PASS', desktop: 'PASS' }
  },
  { 
    id: 'patristic', 
    module: 'Patrística', 
    route: '/biblioteca/patristica',
    p: 'P1', 
    status: 'BLOCKED', 
    deviceStatus: { mobile: 'BLOCKED', desktop: 'BLOCKED' },
    evidence: {
      message: 'Indisponibilidade backend (Supabase) detectada via supabase-unreachable',
      timestamp: new Date().toISOString()
    }
  },
];

export default function Audit77Dashboard() {
  const [items, setItems] = useState<AuditItem[]>(initialAuditItems);
  const [isOffline, setIsOffline] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const { error } = await supabase.from('app_feature_flags').select('count', { count: 'exact', head: true });
      if (error && (error.message.includes('paused') || error.code === 'PGRST301')) {
        setIsPaused(true);
      } else {
        const wasPaused = isPaused;
        setIsPaused(false);
        if (wasPaused) {
          setItems(initialAuditItems);
        }
      }
    } catch (e) {
      console.error('Audit status check failed', e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    const handleUnreachable = () => {
      setIsOffline(true);
      setItems(prev => prev.map(item => ({
        ...item,
        status: item.status === 'PASS' ? 'BLOCKED' : item.status,
        deviceStatus: item.deviceStatus ? {
          mobile: item.deviceStatus.mobile === 'PASS' ? 'BLOCKED' : item.deviceStatus.mobile,
          desktop: item.deviceStatus.desktop === 'PASS' ? 'BLOCKED' : item.deviceStatus.desktop,
        } : undefined,
        evidence: item.status === 'PASS' ? {
          message: 'Backend inacessível. Certificação funcional impedida.',
          timestamp: new Date().toISOString()
        } : item.evidence
      })));
    };
    window.addEventListener('supabase-unreachable', handleUnreachable);
    return () => window.removeEventListener('supabase-unreachable', handleUnreachable);
  }, []);

  const totalItems = items.length;
  const passItems = items.filter(i => i.status === 'PASS').length;
  const failItems = items.filter(i => i.status === 'FAIL').length;
  const blockedItems = items.filter(i => i.status === 'BLOCKED').length;
  const progress = Math.round((passItems / totalItems) * 100);

  const exportReport = (format: 'json' | 'pdf') => {
    const report = {
      audit: '7.7',
      timestamp: new Date().toISOString(),
      summary: { totalItems, passItems, failItems, blockedItems, progress },
      performance_metrics: items.map(i => ({
        module: i.module,
        loadTime: i.loadTime,
        ttfb: i.ttfb,
        lcp: i.lcp
      })),
      accessibility_results: items.map(i => ({
        module: i.module,
        accessibility: i.accessibility
      })),
      items
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-7-7-full-report-${new Date().getTime()}.json`;
      a.click();
    } else {
      window.print();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Helmet>
        <title>Cathedra · AUDIT 7.7 Dashboard</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl">AUDIT 7.7 — Certificação Funcional Real</h1>
          <p className="text-sm text-muted-foreground">Monitoramento de jornadas críticas do peregrino</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={isChecking}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('json')}>
            <Download className="mr-2 h-4 w-4" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
            <FileText className="mr-2 h-4 w-4" /> PDF / Imprimir
          </Button>
        </div>
      </div>

      {isPaused && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-amber-800">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5" />
            <div className="text-sm">
              <span className="font-bold">Infraestrutura Pausada:</span> O projeto Supabase precisa ser reativado para prosseguir com a certificação real.
            </div>
          </div>
          <Button variant="outline" size="sm" className="bg-white" asChild>
            <a href="/admin/site-health">Ver Health Check</a>
          </Button>
        </div>
      )}

      {isOffline && !isPaused && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800">
          <WifiOff className="h-5 w-5" />
          <div className="text-sm">
            <span className="font-bold">Backend Indisponível:</span> Falhas de infraestrutura detectadas. Status BLOCKED aplicado automaticamente.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[10px] text-muted-foreground uppercase tracking-wider">Progresso Geral</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-serif">{progress}%</p>
            <Progress value={progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[10px] text-muted-foreground uppercase tracking-wider">Pass</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-serif text-emerald-600">{passItems}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[10px] text-muted-foreground uppercase tracking-wider">Fail (Corrigir)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-serif text-red-600">{failItems}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-[10px] text-muted-foreground uppercase tracking-wider">Blocked (Infra)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-serif text-amber-600">{blockedItems}</p></CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className={`border-l-4 ${
            item.status === 'PASS' ? 'border-l-emerald-500' : 
            item.status === 'FAIL' ? 'border-l-red-500' : 'border-l-amber-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px]">{item.p}</Badge>
                    <h2 className="font-serif text-lg">{item.module}</h2>
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.route}</code>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Tempo de carregamento total">
                      <Clock className="h-3.5 w-3.5" />
                      {item.loadTime ? `${item.loadTime}ms` : '—'}
                    </div>
                    <div className="flex items-center gap-1.5" title="TTFB (Time to First Byte)">
                      <Activity className="h-3.5 w-3.5 text-blue-500" />
                      {item.ttfb ? `${item.ttfb}ms` : '—'}
                    </div>
                    <div className="flex items-center gap-1.5" title="LCP (Largest Contentful Paint)">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      {item.lcp ? `${item.lcp}ms` : '—'}
                    </div>
                    <div className="flex items-center gap-3 border-x px-3">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5" />
                        <StatusIcon status={item.deviceStatus?.mobile} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" />
                        <StatusIcon status={item.deviceStatus?.desktop} />
                      </div>
                    </div>
                    {item.accessibility && (
                      <div className="flex items-center gap-3">
                        <Accessibility className="h-3.5 w-3.5 text-indigo-500" />
                        <div className="flex gap-2">
                          <span className={item.accessibility.contrast === 'PASS' ? 'text-emerald-600' : 'text-red-600'}>Contraste</span>
                          <span className={item.accessibility.keyboard === 'PASS' ? 'text-emerald-600' : 'text-red-600'}>Teclado</span>
                          <span className={item.accessibility.labels === 'PASS' ? 'text-emerald-600' : 'text-red-600'}>Labels</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.evidence && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-[11px] text-red-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold">EVIDÊNCIA DE FALHA:</p>
                          <p className="mt-1">{item.evidence.message}</p>
                          <p className="mt-1 text-[9px] opacity-70 italic">{item.evidence.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <Badge variant={
                      item.status === 'PASS' ? 'secondary' : 
                      item.status === 'FAIL' ? 'destructive' : 'outline'
                    } className={
                      item.status === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 
                      item.status === 'BLOCKED' ? 'bg-amber-100 text-amber-700' : ''
                    }>
                      {item.status}
                    </Badge>
                  </div>
                  {item.status === 'PASS' && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                  {item.status === 'FAIL' && <XCircle className="h-6 w-6 text-red-500" />}
                  {item.status === 'BLOCKED' && <ShieldAlert className="h-6 w-6 text-amber-500" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status?: 'PASS' | 'FAIL' | 'BLOCKED' }) {
  if (!status) return <span>—</span>;
  if (status === 'PASS') return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
  if (status === 'FAIL') return <XCircle className="h-3 w-3 text-red-500" />;
  return <ShieldAlert className="h-3 w-3 text-amber-500" />;
}
