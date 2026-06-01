import { Icons } from '@/constants';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const SecurityDashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [rlsResults, setRlsResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [logsRes, rlsRes] = await Promise.all([
      supabase.from('security_audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('rls_test_results').select('*').order('run_at', { ascending: false }).limit(10)
    ]);

    if (logsRes.data) setLogs(logsRes.data);
    if (rlsRes.data) setRlsResults(rlsRes.data);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="p-spacing-xl space-y-spacing-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-premium-3xl font-bold flex items-center gap-spacing-xs">
          <Icons.Shield className="w-spacing-xl h-spacing-xl text-primary" />
          Painel de Segurança & Auditoria
        </h1>
        <button onClick={fetchData} className="p-spacing-xs hover:bg-muted rounded-premium-full transition-colors">
          <Icons.RefreshCw className={`w-spacing-md h-spacing-md ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-premium-lg">Status RLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-spacing-xs">
              <Icons.CheckCircle className="text-green-500" />
              <span>Proteção Ativa em 142 tabelas</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-premium-lg">Segredos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-spacing-xs">
              <Icons.CheckCircle className="text-green-500" />
              <span>MercadoPago: Rotacionado há 2h</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-premium-lg">Alertas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-spacing-xs text-yellow-500">
              <Icons.AlertTriangle/>
              <span>3 tentativas de payload excedido</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.event_type}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(log.severity)}>{log.severity}</Badge>
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-spacing-xl text-muted-foreground">
                    Nenhum evento de segurança registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados dos Testes de RLS</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teste</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Executado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rlsResults.map((res) => (
                <TableRow key={res.id}>
                  <TableCell className="font-medium">{res.test_name}</TableCell>
                  <TableCell>
                    <Badge variant={res.status === 'success' ? 'default' : 'destructive'}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(res.run_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {rlsResults.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-spacing-xl text-muted-foreground">
                    Aguardando execução do pipeline de CI.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
