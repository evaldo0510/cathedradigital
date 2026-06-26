import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type CoverageRow = {
  abbrev: string;
  name: string;
  testament: string;
  canonical_type: string;
  expected_chapters: number;
  chapters_present: number;
  verses_total: number;
  english_verse_count: number;
  coverage_pct: number | null;
  status: 'ok' | 'missing' | 'empty' | 'partial' | 'over' | 'contaminated';
};

type Job = {
  id: string;
  source_id: string;
  status: string;
  finished_at: string | null;
  created_at: string;
  verification: any;
  audit_log: any;
};

type Source = {
  id: string;
  code: string;
  name: string;
  is_primary: boolean;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-green-600',
  partial: 'bg-yellow-600',
  empty: 'bg-orange-600',
  missing: 'bg-red-600',
  contaminated: 'bg-purple-600',
  over: 'bg-blue-600',
};

function StatusBadge({ s }: { s: string }) {
  return <Badge className={STATUS_COLORS[s] || 'bg-gray-500'}>{s}</Badge>;
}

export default function BibleSprint1Admin() {
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [reRunningJobId, setReRunningJobId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [covRes, jobsRes, srcRes] = await Promise.all([
        supabase.rpc('bible_canonical_coverage' as any),
        supabase
          .from('bible_import_jobs')
          .select('id, source_id, status, finished_at, created_at, verification, audit_log')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('bible_translation_sources')
          .select('id, code, name, is_primary, status')
          .order('created_at', { ascending: false }),
      ]);
      if (covRes.error) throw covRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (srcRes.error) throw srcRes.error;
      setCoverage((covRes.data || []) as any);
      setJobs((jobsRes.data || []) as any);
      setSources((srcRes.data || []) as any);
    } catch (e: any) {
      toast.error(e.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const totals = useMemo(() => {
    const t = { ok: 0, partial: 0, empty: 0, missing: 0, contaminated: 0, over: 0 };
    coverage.forEach((r) => {
      t[r.status] = (t[r.status] || 0) + 1;
    });
    return t;
  }, [coverage]);

  const sprint1Passed = totals.ok === 73 && totals.partial === 0 && totals.empty === 0 && totals.missing === 0 && totals.contaminated === 0;

  const bookLink = (abbrev: string, chapter = 1) => `/bible/${encodeURIComponent(abbrev)}/${chapter}`;

  const rerunSprint1 = async (jobId: string, sourceId: string) => {
    setReRunningJobId(jobId);
    try {
      const { data, error } = await supabase.functions.invoke('bible-canon-diagnose', {
        body: { action: 'coverage', job_id: jobId, source_id: sourceId },
      });
      if (error) throw error;
      const passed = !!data?.coverage?.passed || !!data?.passed;
      // gravar no audit_log do job
      const entry = {
        ts: new Date().toISOString(),
        action: 'sprint1_rerun',
        passed,
        summary: data?.summary || data?.coverage?.summary || null,
      };
      const current = jobs.find((j) => j.id === jobId);
      const newLog = Array.isArray(current?.audit_log) ? [...current!.audit_log, entry] : [entry];
      const newVer = {
        ...(current?.verification || {}),
        sprint1: { passed, last_check_at: entry.ts, summary: entry.summary },
      };
      const upd = await supabase
        .from('bible_import_jobs')
        .update({ verification: newVer, audit_log: newLog })
        .eq('id', jobId);
      if (upd.error) throw upd.error;
      toast.success(passed ? 'Sprint 1 aprovada ✓' : 'Sprint 1 reprovada — veja os achados');
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Falha ao reexecutar');
    } finally {
      setReRunningJobId(null);
    }
  };

  const tryActivate = async (source: Source) => {
    const { error } = await supabase
      .from('bible_translation_sources')
      .update({ status: 'active', is_primary: true })
      .eq('id', source.id);
    if (error) {
      toast.error(`Bloqueado: ${error.message}`);
    } else {
      toast.success('Fonte ativada como primária');
      loadAll();
    }
  };

  const filtered = (statuses: string[]) =>
    coverage.filter((r) => statuses.includes(r.status));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sprint 1 — Bíblia Soberana</h1>
          <p className="text-muted-foreground text-sm">
            Gate de cobertura dos 73 livros, jobs de importação e bloqueio de ativação por fonte.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAll} disabled={loading}>
            {loading ? 'Carregando…' : 'Atualizar'}
          </Button>
          <Link to="/admin/bible-diagnostic-runs">
            <Button variant="outline">Diagnose runs</Button>
          </Link>
          <Link to="/admin/bible-import">
            <Button variant="outline">Importação</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Veredito Sprint 1{' '}
            {sprint1Passed ? (
              <Badge className="bg-green-600">PASSED</Badge>
            ) : (
              <Badge variant="destructive">FAILED</Badge>
            )}
          </CardTitle>
          <CardDescription>
            ok={totals.ok}/73 · partial={totals.partial} · empty={totals.empty} · missing={totals.missing} ·
            contaminated={totals.contaminated} · over={totals.over}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="missing">
        <TabsList>
          <TabsTrigger value="missing">Missing ({totals.missing})</TabsTrigger>
          <TabsTrigger value="partial">Partial ({totals.partial})</TabsTrigger>
          <TabsTrigger value="contaminated">Contaminated ({totals.contaminated})</TabsTrigger>
          <TabsTrigger value="ok">OK ({totals.ok})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs & Gate</TabsTrigger>
        </TabsList>

        {(['missing', 'partial', 'contaminated', 'ok'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Abbrev</TableHead>
                      <TableHead>Livro</TableHead>
                      <TableHead>Caps</TableHead>
                      <TableHead>Versos</TableHead>
                      <TableHead>EN hits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Abrir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered([tab]).map((r) => (
                      <TableRow key={r.abbrev}>
                        <TableCell className="font-mono">{r.abbrev}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>
                          {r.chapters_present}/{r.expected_chapters}
                        </TableCell>
                        <TableCell>{r.verses_total}</TableCell>
                        <TableCell>{r.english_verse_count}</TableCell>
                        <TableCell><StatusBadge s={r.status} /></TableCell>
                        <TableCell>
                          <Link to={bookLink(r.abbrev)} className="text-primary underline text-sm">
                            cap.1
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered([tab]).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum livro nesta categoria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Jobs de importação e gate de ativação</CardTitle>
              <CardDescription>
                Cada job mostra <code>verification.sprint1.passed</code>. A ativação/promoção a primária só passa quando o último job concluído marcar <strong>passed=true</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sprint 1</TableHead>
                    <TableHead>Audit log</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((j) => {
                    const src = sources.find((s) => s.id === j.source_id);
                    const passed = j?.verification?.sprint1?.passed === true;
                    const logCount = Array.isArray(j.audit_log) ? j.audit_log.length : 0;
                    return (
                      <TableRow key={j.id}>
                        <TableCell className="font-mono text-xs">{j.id.slice(0, 8)}…</TableCell>
                        <TableCell>{src ? `${src.code} — ${src.name}` : j.source_id?.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant="outline">{j.status}</Badge></TableCell>
                        <TableCell>
                          {passed ? (
                            <Badge className="bg-green-600">passed</Badge>
                          ) : (
                            <Badge variant="destructive">failed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{logCount} entradas</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reRunningJobId === j.id}
                            onClick={() => rerunSprint1(j.id, j.source_id)}
                          >
                            {reRunningJobId === j.id ? 'Rodando…' : 'Reexecutar Sprint 1'}
                          </Button>
                          {src && !src.is_primary && (
                            <Button size="sm" onClick={() => tryActivate(src)}>
                              Testar ativação
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum job encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-4">
                💡 O botão <strong>Testar ativação</strong> dispara um <code>UPDATE status=active, is_primary=true</code>. O trigger <code>enforce_bible_source_sprint1_gate</code> bloqueia com erro <em>"Sprint 1 gate"</em> enquanto o último job não passar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
