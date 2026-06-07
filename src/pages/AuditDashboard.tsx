import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AuditLog {
  id: string;
  correlation_id: string;
  event_name: string;
  status_code: number;
  livro?: string;
  capitulo?: number;
  error_code?: string;
  content_hash?: string;
  db_content_hash?: string;
  duration_ms: number;
  timestamp: string;
}

export default function AuditDashboard() {
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('id') || '');

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('core_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (searchTerm) {
      query = query.or(`correlation_id.ilike.%${searchTerm}%,livro.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) return <Badge variant="secondary" className="bg-green-100 text-green-800">200 OK</Badge>;
    if (code === 404) return <Badge variant="destructive">404 NOT FOUND</Badge>;
    return <Badge variant="outline">{code}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard de Auditoria</h1>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID de Correlação ou Livro..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          />
        </div>
        <Button onClick={fetchLogs}>Buscar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Eventos (50 recentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhas (4xx/5xx)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.status_code >= 400).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0 
                ? Math.round(logs.reduce((acc, curr) => acc + curr.duration_ms, 0) / logs.length) 
                : 0}ms
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Livro/Cap</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>SHA-256 Hash</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Carregando auditoria...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Nenhum registro encontrado.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{log.event_name}</TableCell>
                    <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                    <TableCell>
                      {log.livro ? `${log.livro} ${log.capitulo}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.correlation_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {log.content_hash ? (
                        <div className="flex items-center gap-1">
                          <code className="text-[10px] bg-muted p-1 rounded">
                            {log.content_hash.substring(0, 8)}...
                          </code>
                          {log.content_hash !== log.db_content_hash && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" title="Ver no Relatório CI" asChild>
                        <a href={`https://github.com/lovable/cathedra/actions/runs/audit/${log.correlation_id}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}