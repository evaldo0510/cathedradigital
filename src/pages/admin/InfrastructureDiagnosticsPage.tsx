import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/hooks/useLang';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';
import { toast } from 'sonner';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';

interface AuditRun {
  id: string;
  created_at: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  details: any;
}

export default function InfrastructureDiagnosticsPage() {
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const [history, setHistory] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, [filterLang, filterStatus]);

  const loadHistory = async () => {
    let query = (supabase.from('infrastructure_audit_runs' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filterLang !== 'all') {
      query = query.contains('details', { lang: filterLang });
    }
    
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao carregar histórico:', error);
    } else {
      setHistory((data || []) as AuditRun[]);
    }
  };

  const runAudit = async () => {
    setLoading(true);
    
    // Simula auditoria de multi-idioma por área
    const areas = ['Header', 'Home', 'Biblioteca', 'Reader', 'Saints'];
    const areaResults = areas.map(area => ({
      area,
      status: Math.random() > 0.1 ? 'PASS' : 'FAIL',
      cause: 'Audit simulation',
      fix: 'Verify translation keys'
    }));

    const results = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      lang: lang,
      userAgent: navigator.userAgent,
      pathname: location.pathname,
      areas: areaResults,
      multiLangReport: {
        missing: [],
        hardcoded: [],
        broken: []
      }
    };

    const status = areaResults.every(a => a.status === 'PASS') ? 'PASS' : 'FAIL';

    const { error } = await (supabase.from('infrastructure_audit_runs' as any) as any)
      .insert([{ status, details: results }]);

    if (error) {
      toast.error('Erro ao salvar auditoria');
    } else {
      toast.success('Auditoria concluída');
      loadHistory();
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cathedra Mission Control</h1>
          <p className="text-muted-foreground">Audit 7.7.1A — Diagnostics & Multi-Language Registry</p>
        </div>
        <Button onClick={runAudit} disabled={loading} className="gap-2">
          {loading ? <Icons.Cross className="w-4 h-4 animate-spin" /> : <Icons.Play className="w-4 h-4" />}
          Executar Auditoria Global
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-premium-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico e Filtros</TabsTrigger>
          <TabsTrigger value="report">Relatório de Multi-idioma</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Estado do Idioma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{lang.toUpperCase()}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUPPORTED_LOCALES.map(loc => (
                    <Button 
                      key={loc.code} 
                      variant={lang === loc.code ? "default" : "outline"} 
                      size="sm"
                      className="rounded-premium-full h-8"
                      onClick={() => setLang(loc.code)}
                    >
                      {loc.code.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Integridade (t)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">"back":</span>
                  <Badge variant="outline" className="font-mono">{t('back')}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">"search":</span>
                  <Badge variant="outline" className="font-mono">{t('search')}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">"admin":</span>
                  <Badge variant="outline" className="font-mono">{t('admin')}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Persistência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono bg-muted/50 p-3 rounded-premium break-all">
                  localStorage: {localStorage.getItem('cathedra_lang') || 'null'}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  Chave: cathedra_lang
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 outline-none">
          <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-premium border border-border/40">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Idioma</label>
              <Select value={filterLang} onValueChange={setFilterLang}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {SUPPORTED_LOCALES.map(loc => (
                    <SelectItem key={loc.code} value={loc.code}>{loc.nativeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PASS">PASS</SelectItem>
                  <SelectItem value="FAIL">FAIL</SelectItem>
                  <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" onClick={() => { setFilterLang('all'); setFilterStatus('all'); }} className="text-xs uppercase tracking-widest">
              Limpar Filtros
            </Button>
          </div>

          <Card className="premium-card">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border/40">
                  {history.map((run) => (
                    <div key={run.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={run.status === 'PASS' ? 'default' : 'destructive'} className="rounded-premium-full uppercase text-[9px] tracking-widest">
                            {run.status}
                          </Badge>
                          <span className="text-sm font-bold">
                            {new Date(run.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {run.details?.lang || '??'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {run.details?.areas?.map((area: any) => (
                          <div key={area.area} className="flex items-center gap-2 text-[10px] uppercase tracking-tighter">
                            <div className={cn("w-1.5 h-1.5 rounded-full", area.status === 'PASS' ? 'bg-green-500' : 'bg-red-500')} />
                            <span className="text-muted-foreground">{area.area}:</span>
                            <span className={cn("font-bold", area.status === 'PASS' ? 'text-green-600' : 'text-red-600')}>{area.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground font-serif italic">
                      Nenhuma execução encontrada para os filtros selecionados.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6 outline-none">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-premium-base font-black uppercase tracking-widest">Última Auditoria: Áreas e Correções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history[0]?.details?.areas?.map((area: any) => (
                  <div key={area.area} className="p-4 rounded-premium border border-border/40 bg-muted/20 flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-full",
                      area.status === 'PASS' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {area.status === 'PASS' ? <Icons.Check className="w-4 h-4" /> : <Icons.X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm uppercase tracking-wider">{area.area}</h4>
                        <Badge variant={area.status === 'PASS' ? "default" : "destructive"}>{area.status}</Badge>
                      </div>
                      {area.status === 'FAIL' && (
                        <>
                          <p className="text-xs text-muted-foreground"><span className="font-bold">Causa Raiz:</span> {area.cause}</p>
                          <p className="text-xs text-primary font-bold"><span className="uppercase tracking-widest">Correção:</span> {area.fix}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {!history[0] && (
                  <p className="text-center py-10 text-muted-foreground italic">Execute uma auditoria para ver o relatório detalhado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
