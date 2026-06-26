import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type Finding = {
  id: string;
  abbrev: string;
  book_name: string;
  chapter: number | null;
  finding_type: string;
  severity: string;
  message: string;
};

type RunMeta = {
  id: string;
  started_at: string;
  status: string;
  total_books_checked: number | null;
  total_chapters_checked: number | null;
};

const BLOCKING_TYPES = new Set(['missing_book', 'missing_chapter', 'empty_chapter']);

/**
 * Mostra qual a cobertura atual dos 73 livros segundo a última diagnose:
 * livros/capítulos faltando e tipos de verificação que falharam.
 */
export const BibleCoveragePanel: React.FC = () => {
  const [run, setRun] = useState<RunMeta | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: runs, error: e1 } = await supabase
        .from('bible_diagnostic_runs')
        .select('id, started_at, status, total_books_checked, total_chapters_checked')
        .in('status', ['ok', 'warning', 'error'])
        .order('started_at', { ascending: false })
        .limit(1);
      if (e1) throw e1;
      const last = runs?.[0] as RunMeta | undefined;
      if (!last) { setRun(null); setFindings([]); return; }
      setRun(last);

      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', {
        body: { action: 'get_findings', run_id: last.id },
      });
      if (error) throw error;
      setFindings(((data?.rows as Finding[]) ?? []));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const byType: Record<string, number> = {};
    const byBook: Record<string, { name: string; findings: Finding[] }> = {};
    let blocking = 0;
    for (const f of findings) {
      byType[f.finding_type] = (byType[f.finding_type] ?? 0) + 1;
      if (BLOCKING_TYPES.has(f.finding_type)) blocking++;
      const key = f.abbrev || '—';
      if (!byBook[key]) byBook[key] = { name: f.book_name || key, findings: [] };
      byBook[key].findings.push(f);
    }
    const books = Object.entries(byBook)
      .map(([abbr, v]) => ({
        abbr,
        name: v.name,
        total: v.findings.length,
        blocking: v.findings.filter(f => BLOCKING_TYPES.has(f.finding_type)).length,
        chapters: v.findings.filter(f => f.chapter != null).map(f => f.chapter!).sort((a, b) => a - b),
        types: Array.from(new Set(v.findings.map(f => f.finding_type))),
      }))
      .sort((a, b) => b.blocking - a.blocking || b.total - a.total);
    return { byType, books, blocking };
  }, [findings]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Cobertura dos 73 livros</CardTitle>
            <CardDescription>
              {run
                ? <>Última diagnose: {new Date(run.started_at).toLocaleString('pt-BR')} · status <strong>{run.status}</strong> · {run.total_books_checked ?? 0} livros · {run.total_chapters_checked ?? 0} capítulos verificados</>
                : 'Nenhuma diagnose registrada ainda.'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Carregando…' : 'Atualizar'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byType).length === 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Sem achados — cobertura íntegra
              </Badge>
            )}
            {Object.entries(summary.byType).map(([t, n]) => (
              <Badge
                key={t}
                variant={BLOCKING_TYPES.has(t) ? 'destructive' : 'outline'}
                className="font-mono text-xs"
              >
                {t}: {n}
              </Badge>
            ))}
            {summary.blocking > 0 && (
              <Badge variant="destructive">
                {summary.blocking} bloqueante(s) — leitura bloqueada para não-admins
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Livros e capítulos com pendência</CardTitle>
          <CardDescription>Ordenado pelos com mais findings bloqueantes.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Livro</TableHead>
                <TableHead>Abbr</TableHead>
                <TableHead>Tipos de verificação que falharam</TableHead>
                <TableHead>Capítulos</TableHead>
                <TableHead className="text-right">Bloqueantes</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.books.map(b => (
                <TableRow key={b.abbr} className={b.blocking > 0 ? 'bg-red-50/40 dark:bg-red-950/10' : ''}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="font-mono text-xs">{b.abbr}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {b.types.map(t => (
                        <Badge key={t} variant={BLOCKING_TYPES.has(t) ? 'destructive' : 'outline'} className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[260px] truncate" title={b.chapters.join(', ')}>
                    {b.chapters.length ? b.chapters.join(', ') : '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{b.blocking}</TableCell>
                  <TableCell className="text-right">{b.total}</TableCell>
                </TableRow>
              ))}
              {summary.books.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Nenhum livro com pendência.
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

export default BibleCoveragePanel;
