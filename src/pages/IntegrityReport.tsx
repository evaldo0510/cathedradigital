import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrityReport() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bible_integrity_reports')
      .select(`
        *,
        bible_books (name)
      `)
      .order('created_at', { ascending: false });

    if (!error) setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const stats = {
    total: reports.length,
    matches: reports.filter(r => r.status === 'match').length,
    mismatches: reports.filter(r => r.status === 'mismatch').length,
    missing: reports.filter(r => r.status === 'missing_source').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-primary" /> Relatório de Integridade (SHA-256)
        </h1>
        <Button onClick={fetchReports} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="py-2"><CardTitle className="text-xs">Validado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="py-2"><CardTitle className="text-xs text-green-600">Sucesso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.matches}</div></CardContent></Card>
        <Card><CardHeader className="py-2"><CardTitle className="text-xs text-red-600">Discrepâncias</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.mismatches}</div></CardContent></Card>
        <Card><CardHeader className="py-2"><CardTitle className="text-xs text-amber-600">Ausentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{stats.missing}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Livro</TableHead>
                <TableHead>Cap.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hash Calculado (Prefix)</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.bible_books?.name}</TableCell>
                  <TableCell>{report.chapter_number}</TableCell>
                  <TableCell>
                    {report.status === 'match' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">INTEGRO</Badge>
                    ) : report.status === 'mismatch' ? (
                      <Badge variant="destructive" className="animate-pulse">DISCREPÂNCIA</Badge>
                    ) : (
                      <Badge variant="outline">AUSENTE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{report.calculated_hash.substring(0, 16)}...</TableCell>
                  <TableCell className="text-[10px] opacity-70">{report.correlation_id || '-'}</TableCell>
                  <TableCell className="text-xs">{new Date(report.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}