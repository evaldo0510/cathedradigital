import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import BibleCoveragePanel from '@/components/cathedra/BibleCoveragePanel';

type Run = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  triggered_by: string | null;
  total_books_checked: number | null;
  total_chapters_checked: number | null;
  total_findings: number | null;
  duration_ms: number | null;
  error: string | null;
};

type Finding = {
  id: string;
  run_id: string;
  abbrev: string;
  book_name: string;
  chapter: number | null;
  finding_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
};

const PAGE_SIZE = 10;

function statusBadge(s: string) {
  const v = s.toLowerCase();
  if (v === 'ok') return <Badge className="bg-green-600">ok</Badge>;
  if (v === 'warning') return <Badge className="bg-yellow-600">warning</Badge>;
  if (v === 'error') return <Badge variant="destructive">error</Badge>;
  if (v === 'running') return <Badge variant="secondary">running</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function fetchFindings(runId: string): Promise<Finding[]> {
  const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', {
    body: { action: 'get_findings', run_id: runId },
  });
  if (error) throw error;
  return (data?.rows as Finding[]) ?? [];
}

const BibleDiagnosticRuns: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [bookFilter, setBookFilter] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);

  // Compare
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [diff, setDiff] = useState<null | {
    leftFindings: Finding[];
    rightFindings: Finding[];
  }>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', {
        body: { action: 'list_runs', limit: 50 },
      });
      if (error) throw error;
      const rows = (data?.rows as Run[]) ?? [];
      setRuns(rows);

      // Pre-fetch counts by type per run for completed runs (lazy: only those with findings)
      const needsCounts = rows.filter(r => (r.total_findings ?? 0) > 0).slice(0, 20);
      const map: Record<string, Record<string, number>> = {};
      const bookMap: Record<string, Set<string>> = {};
      await Promise.all(
        needsCounts.map(async r => {
          try {
            const findings = await fetchFindings(r.id);
            const byType: Record<string, number> = {};
            const books = new Set<string>();
            for (const f of findings) {
              byType[f.finding_type] = (byType[f.finding_type] ?? 0) + 1;
              books.add(f.abbrev);
            }
            map[r.id] = byType;
            bookMap[r.id] = books;
          } catch {
            // ignore
          }
        }),
      );
      setCounts(map);
      const bf: Record<string, boolean> = {};
      for (const [rid, books] of Object.entries(bookMap)) {
        for (const b of books) bf[`${rid}:${b}`] = true;
      }
      setBookFilter(bf);
    } catch (e) {
      toast.error('Falha ao carregar execuções: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const filteredRuns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return runs;
    return runs.filter(r => {
      // search by book abbrev (case-insensitive)
      const keys = Object.keys(bookFilter).filter(k => k.startsWith(`${r.id}:`)).map(k => k.split(':')[1].toLowerCase());
      if (keys.some(b => b.includes(q))) return true;
      // also match status/triggered_by
      return (r.status || '').toLowerCase().includes(q) || (r.triggered_by || '').toLowerCase().includes(q);
    });
  }, [runs, search, bookFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE));
  const pageRuns = filteredRuns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', {
        body: { action: 'run' },
      });
      if (error) throw error;
      toast.success(`Diagnóstico concluído: ${data?.total_findings ?? 0} achados em ${fmtDuration(data?.duration_ms ?? 0)}`);
      await loadRuns();
    } catch (e) {
      toast.error('Falha ao executar: ' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  // Auto-seleciona última bem-sucedida (status=ok ou warning) para o lado direito
  useEffect(() => {
    if (runs.length >= 2 && !leftId && !rightId) {
      const completed = runs.filter(r => r.status !== 'running' && r.status !== 'error');
      if (completed.length >= 2) {
        setRightId(completed[0].id);
        setLeftId(completed[1].id);
      }
    }
  }, [runs, leftId, rightId]);

  const loadDiff = useCallback(async () => {
    if (!leftId || !rightId) return;
    setDiffLoading(true);
    try {
      const [l, r] = await Promise.all([fetchFindings(leftId), fetchFindings(rightId)]);
      setDiff({ leftFindings: l, rightFindings: r });
    } catch (e) {
      toast.error('Falha ao comparar: ' + (e as Error).message);
    } finally {
      setDiffLoading(false);
    }
  }, [leftId, rightId]);

  const diffSummary = useMemo(() => {
    if (!diff) return null;
    const aggregate = (rows: Finding[]) => {
      const byType: Record<string, number> = {};
      const byBook: Record<string, number> = {};
      for (const f of rows) {
        byType[f.finding_type] = (byType[f.finding_type] ?? 0) + 1;
        byBook[f.abbrev] = (byBook[f.abbrev] ?? 0) + 1;
      }
      return { byType, byBook };
    };
    const L = aggregate(diff.leftFindings);
    const R = aggregate(diff.rightFindings);
    const allTypes = new Set([...Object.keys(L.byType), ...Object.keys(R.byType)]);
    const allBooks = new Set([...Object.keys(L.byBook), ...Object.keys(R.byBook)]);
    const typeDiff = Array.from(allTypes).map(t => ({
      key: t, left: L.byType[t] ?? 0, right: R.byType[t] ?? 0, delta: (R.byType[t] ?? 0) - (L.byType[t] ?? 0),
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const bookDiff = Array.from(allBooks).map(b => ({
      key: b, left: L.byBook[b] ?? 0, right: R.byBook[b] ?? 0, delta: (R.byBook[b] ?? 0) - (L.byBook[b] ?? 0),
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    return { typeDiff, bookDiff };
  }, [diff]);

  const deltaCell = (d: number) => {
    if (d === 0) return <span className="text-muted-foreground">0</span>;
    if (d > 0) return <span className="text-red-600 font-semibold">+{d} ⚠</span>;
    return <span className="text-green-600 font-semibold">{d}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold">Diagnóstico do Cânon — Execuções</h1>
        <p className="text-muted-foreground">Histórico das execuções do diagnóstico read-only dos 73 livros.</p>
      </header>

      <Tabs defaultValue="coverage">
        <TabsList>
          <TabsTrigger value="coverage">Cobertura (73 livros)</TabsTrigger>
          <TabsTrigger value="runs">Execuções</TabsTrigger>
          <TabsTrigger value="compare">Comparar runs</TabsTrigger>
        </TabsList>

        <TabsContent value="coverage" className="mt-4">
          <BibleCoveragePanel />
        </TabsContent>

        <TabsContent value="runs" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Input
              placeholder="Buscar por livro (ex.: Sb), status ou trigger…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadRuns} variant="outline" disabled={loading}>
              {loading ? 'Carregando…' : 'Atualizar'}
            </Button>
            <Button onClick={runNow} disabled={running}>
              {running ? 'Executando…' : 'Executar agora'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimas execuções</CardTitle>
              <CardDescription>
                {filteredRuns.length} resultado(s) · página {page}/{totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Início</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead className="text-right">Livros</TableHead>
                    <TableHead className="text-right">Capítulos</TableHead>
                    <TableHead className="text-right">Achados</TableHead>
                    <TableHead>Tipos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRuns.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(r.started_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs">{r.triggered_by ?? '—'}</TableCell>
                      <TableCell className="text-right text-xs">{fmtDuration(r.duration_ms)}</TableCell>
                      <TableCell className="text-right">{r.total_books_checked ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.total_chapters_checked ?? '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{r.total_findings ?? 0}</TableCell>
                      <TableCell className="text-xs">
                        {counts[r.id]
                          ? Object.entries(counts[r.id]).map(([k, v]) => (
                              <Badge key={k} variant="outline" className="mr-1 mb-1">{k}: {v}</Badge>
                            ))
                          : (r.total_findings ? '…' : '—')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageRuns.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Nenhuma execução encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  Próxima
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparar duas execuções</CardTitle>
              <CardDescription>Selecione as runs base (anterior) e atual. Regressões aparecem em vermelho.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base (anterior)</label>
                  <select className="w-full mt-1 border border-input rounded-md p-2 bg-background" value={leftId} onChange={(e) => setLeftId(e.target.value)}>
                    <option value="">—</option>
                    {runs.map(r => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.started_at).toLocaleString('pt-BR')} · {r.status} · {r.total_findings ?? 0} achados
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atual</label>
                  <select className="w-full mt-1 border border-input rounded-md p-2 bg-background" value={rightId} onChange={(e) => setRightId(e.target.value)}>
                    <option value="">—</option>
                    {runs.map(r => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.started_at).toLocaleString('pt-BR')} · {r.status} · {r.total_findings ?? 0} achados
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={loadDiff} disabled={!leftId || !rightId || diffLoading}>
                  {diffLoading ? 'Comparando…' : 'Comparar'}
                </Button>
                {diff && (
                  <span className="text-sm text-muted-foreground self-center">
                    Base: {diff.leftFindings.length} · Atual: {diff.rightFindings.length} · Δ {diff.rightFindings.length - diff.leftFindings.length}
                  </span>
                )}
              </div>

              {diffSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Diff por tipo</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Base</TableHead>
                            <TableHead className="text-right">Atual</TableHead>
                            <TableHead className="text-right">Δ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {diffSummary.typeDiff.map(r => (
                            <TableRow key={r.key} className={r.delta > 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                              <TableCell className="font-mono text-xs">{r.key}</TableCell>
                              <TableCell className="text-right">{r.left}</TableCell>
                              <TableCell className="text-right">{r.right}</TableCell>
                              <TableCell className="text-right">{deltaCell(r.delta)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">Diff por livro</CardTitle></CardHeader>
                    <CardContent className="max-h-[480px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Livro</TableHead>
                            <TableHead className="text-right">Base</TableHead>
                            <TableHead className="text-right">Atual</TableHead>
                            <TableHead className="text-right">Δ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {diffSummary.bookDiff.map(r => (
                            <TableRow key={r.key} className={r.delta > 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                              <TableCell className="font-mono text-xs">{r.key}</TableCell>
                              <TableCell className="text-right">{r.left}</TableCell>
                              <TableCell className="text-right">{r.right}</TableCell>
                              <TableCell className="text-right">{deltaCell(r.delta)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BibleDiagnosticRuns;
