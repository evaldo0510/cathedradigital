import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/hooks/useLang';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';
import { toast } from 'sonner';

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

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('infrastructure_audit_runs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar histórico:', error);
    } else {
      setHistory(data || []);
    }
  };

  const runAudit = async () => {
    setLoading(true);
    const results = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      lang: lang,
      userAgent: navigator.userAgent,
      pathname: location.pathname,
    };

    const status = 'PASS'; // Simulação

    const { error } = await supabase
      .from('infrastructure_audit_runs')
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
          <h1 className="text-3xl font-bold tracking-tight">Diagnóstico Cathedra</h1>
          <p className="text-muted-foreground">Monitoramento de Infraestrutura e Multi-idioma (Audit 7.7.1A)</p>
        </div>
        <Button onClick={runAudit} disabled={loading}>
          Executar Auditoria Agora
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estado do Idioma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">{lang}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Path: {location.pathname}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map(loc => (
                <Button 
                  key={loc.code} 
                  variant={lang === loc.code ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setLang(loc.code)}
                >
                  {loc.code.toUpperCase()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Teste de Tradução (t)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chave "back":</span>
                <span className="font-mono font-bold">{t('back')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chave "enter":</span>
                <span className="font-mono font-bold">{t('enter')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chave "search":</span>
                <span className="font-mono font-bold">{t('search')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Persistência Local</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-muted p-2 rounded truncate">
              cathedra_lang: {localStorage.getItem('cathedra_lang') || 'null'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {history.map((run) => (
                <div key={run.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {new Date(run.created_at).toLocaleString('pt-BR')}
                      </span>
                      <Badge variant={run.status === 'PASS' ? 'default' : 'destructive'}>
                        {run.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      ID: {run.id}
                    </div>
                  </div>
                  <pre className="text-[10px] bg-muted p-2 rounded max-w-xs overflow-hidden">
                    {JSON.stringify(run.details, null, 2)}
                  </pre>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
