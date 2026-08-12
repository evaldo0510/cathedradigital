import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SiteHealthDashboard() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'paused' | 'error'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const checkHealth = async () => {
    setStatus('checking');
    setErrorDetails(null);
    try {
      // Test simple read from a public table that exists
      const { data, error } = await supabase.from('app_feature_flags').select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('paused') || error.code === 'PGRST301') {
          setStatus('paused');
          setErrorDetails('O projeto do banco de dados (Supabase) está pausado. A publicação e sincronização de dados estão suspensas até a reativação.');
        } else {
          setStatus('error');
          setErrorDetails(error.message);
        }
      } else {
        setStatus('healthy');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorDetails(err.message || 'Erro desconhecido ao conectar com a infraestrutura.');
    } finally {
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif">Infraestrutura & Health Check</h1>
        <Button variant="outline" size="sm" onClick={checkHealth} disabled={status === 'checking'}>
          <RefreshCw className={`mr-2 h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>

      {status === 'paused' && (
        <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-200 text-amber-900">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-bold">Supabase Project Paused</AlertTitle>
          <AlertDescription>
            A infraestrutura backend foi pausada. O frontend está operando em modo degradado.
            <div className="mt-4 flex gap-3">
              <Button size="sm" variant="outline" className="bg-white border-amber-300" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Reativar no Dashboard <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status do Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {status === 'healthy' ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              ) : status === 'paused' ? (
                <ShieldAlert className="h-8 w-8 text-amber-500" />
              ) : status === 'checking' ? (
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <p className="text-xl font-semibold capitalize">{status}</p>
                <p className="text-xs text-muted-foreground">
                  Última verificação: {lastCheck ? lastCheck.toLocaleTimeString() : '--:--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conectividade API</CardTitle>
          </CardHeader>
          <CardContent>
            {errorDetails ? (
              <div className="text-xs bg-muted p-2 rounded border border-destructive/20 font-mono overflow-auto max-h-24">
                {errorDetails}
              </div>
            ) : status === 'healthy' ? (
              <p className="text-sm text-emerald-600">Conexão estabelecida com sucesso.</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aguardando diagnóstico...</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-serif mb-4">Checklist de Recuperação</h2>
        <div className="space-y-2">
          {[
            { label: 'Reativar projeto no Dashboard', done: status === 'healthy' },
            { label: 'Aguardar status Healthy no Lovable Cloud', done: status === 'healthy' },
            { label: 'Validar leitura de dados (Bíblia/Catecismo)', done: status === 'healthy' },
            { label: 'Executar Auditoria 7.7 Completa', done: false }
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
              {step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <div className="h-4 w-4 rounded-full border-2" />}
              <span className={step.done ? 'line-through opacity-50' : ''}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
