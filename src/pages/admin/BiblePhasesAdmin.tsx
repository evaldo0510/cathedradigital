/**
 * /admin/bible-phases — Torre de controle da Bíblia (read-only, P0.2.2.1).
 *
 * Mostra, por tradução × fase, cobertura de livros/capítulos/versículos,
 * pipeline stage, checklist de certificação, ICE e status. Nenhum botão de
 * ação nesta versão: importação e certificação chegam em P0.2.2.2+.
 */
import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, Loader2 } from 'lucide-react';

type PhaseCode =
  | 'A_pentateuco'
  | 'B_historicos'
  | 'C_sapienciais'
  | 'D_profetas'
  | 'E_novo_testamento';

const PHASE_LABEL: Record<PhaseCode, string> = {
  A_pentateuco: 'A · Pentateuco',
  B_historicos: 'B · Históricos',
  C_sapienciais: 'C · Sapienciais',
  D_profetas: 'D · Profetas',
  E_novo_testamento: 'E · Novo Testamento',
};

type PipelineStage =
  | 'draft'
  | 'importing'
  | 'integrity_check'
  | 'editorial_review'
  | 'ice'
  | 'certified'
  | 'primary'
  | 'archived';

type PhaseStatus = 'pending' | 'importing' | 'imported' | 'certified' | 'rejected';

interface PhaseRow {
  translation_id: string;
  translation_code: string;
  translation_name: string;
  translation_status: string;
  pipeline_stage: PipelineStage;
  is_primary: boolean;
  phase: PhaseCode;
  expected_books: number;
  expected_chapters: number;
  actual_books: number;
  actual_chapters: number;
  actual_verses: number;
  status: PhaseStatus;
  certified_at: string | null;
  ice_score: number | null;
  check_verses: boolean;
  check_references: boolean;
  check_nexus: boolean;
  check_popovers: boolean;
  check_reader: boolean;
  check_navigation: boolean;
  check_continuity: boolean;
  check_search: boolean;
}

const PIPELINE_LABEL: Record<PipelineStage, string> = {
  draft: 'Draft',
  importing: 'Em Importação',
  integrity_check: 'Integridade',
  editorial_review: 'Em Revisão',
  ice: 'ICE',
  certified: 'Certificada',
  primary: 'Primária',
  archived: 'Arquivada',
};

const STATUS_LABEL: Record<PhaseStatus, string> = {
  pending: 'Pendente',
  importing: 'Importando',
  imported: 'Importada',
  certified: 'Certificada',
  rejected: 'Reprovada',
};

const STATUS_VARIANT: Record<PhaseStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  importing: 'secondary',
  imported: 'secondary',
  certified: 'default',
  rejected: 'destructive',
};

function pct(n: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((n / total) * 100));
}

function CheckIcon({ ok }: { ok: boolean }) {
  return ok
    ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="ok" />
    : <X className="h-3.5 w-3.5 text-muted-foreground" aria-label="pendente" />;
}

export default function BiblePhasesAdmin() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data, isLoading, error } = useQuery({
    queryKey: ['bible-phase-summary'],
    enabled: isAdmin,
    queryFn: async (): Promise<PhaseRow[]> => {
      const { data, error } = await supabase.rpc('get_bible_phase_summary');
      if (error) throw error;
      return (data ?? []) as PhaseRow[];
    },
  });

  const byTranslation = useMemo(() => {
    const map = new Map<string, PhaseRow[]>();
    for (const row of data ?? []) {
      const list = map.get(row.translation_id) ?? [];
      list.push(row);
      map.set(row.translation_id, list);
    }
    return map;
  }, [data]);

  if (adminLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando permissões…
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-serif tracking-tight">Bíblia · Torre de Controle</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          Painel somente-leitura de importação certificada. Cada tradução avança pelo pipeline
          editorial (<em>draft → importing → integrity → review → ICE → certified → primary</em>)
          e só é promovida quando as 5 fases canônicas passam nos gates.
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            Erro ao carregar: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {Array.from(byTranslation.entries()).map(([tid, rows]) => {
          const head = rows[0];
          const totalExpectedVerses = rows.reduce((s, r) => s + r.expected_chapters * 25, 0); // aproximação apenas ilustrativa
          const totalActualVerses = rows.reduce((s, r) => s + Number(r.actual_verses), 0);
          return (
            <Card key={tid}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl">{head.translation_name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5">{head.translation_code}</code>
                    <span>·</span>
                    <span>status: {head.translation_status}</span>
                    {head.is_primary && (
                      <Badge variant="default" className="ml-2">primária</Badge>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="whitespace-nowrap">
                  Pipeline: {PIPELINE_LABEL[head.pipeline_stage]}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Fase</th>
                        <th className="py-2 pr-3 font-medium">Cobertura</th>
                        <th className="py-2 pr-3 font-medium">Livros</th>
                        <th className="py-2 pr-3 font-medium">Capítulos</th>
                        <th className="py-2 pr-3 font-medium">Versículos</th>
                        <th className="py-2 pr-3 font-medium">Checklist</th>
                        <th className="py-2 pr-3 font-medium">ICE</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const coverage = pct(r.actual_chapters, r.expected_chapters);
                        return (
                          <tr key={r.phase} className="border-b last:border-0 align-top">
                            <td className="py-3 pr-3 font-medium">{PHASE_LABEL[r.phase]}</td>
                            <td className="py-3 pr-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <Progress value={coverage} className="h-2 w-24" />
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {coverage}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-3 tabular-nums">
                              {r.actual_books}/{r.expected_books}
                            </td>
                            <td className="py-3 pr-3 tabular-nums">
                              {r.actual_chapters}/{r.expected_chapters}
                            </td>
                            <td className="py-3 pr-3 tabular-nums">{Number(r.actual_verses).toLocaleString('pt-BR')}</td>
                            <td className="py-3 pr-3">
                              <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
                                <div className="flex items-center gap-1"><CheckIcon ok={r.check_reader} /> Reader</div>
                                <div className="flex items-center gap-1"><CheckIcon ok={r.check_popovers} /> Popovers</div>
                                <div className="flex items-center gap-1"><CheckIcon ok={r.check_nexus} /> Nexus</div>
                                <div className="flex items-center gap-1"><CheckIcon ok={r.check_navigation} /> Navegação</div>
                                <div className="flex items-center gap-1"><CheckIcon ok={r.check_continuity} /> Continuidade</div>
                                <div className="flex items-center gap-1"><CheckIcon ok={r.check_search} /> Busca</div>
                              </div>
                            </td>
                            <td className="py-3 pr-3 tabular-nums">
                              {r.ice_score != null ? r.ice_score : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-3 pr-3">
                              <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="text-xs text-muted-foreground">
                        <td className="pt-3" colSpan={4}>Total versículos importados nesta tradução</td>
                        <td className="pt-3 tabular-nums" colSpan={4}>
                          {totalActualVerses.toLocaleString('pt-BR')}
                          <span className="ml-1 opacity-60">(aprox. esperado: {totalExpectedVerses.toLocaleString('pt-BR')})</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <footer className="mt-10 text-xs text-muted-foreground">
        Somente leitura · Ações de importação e certificação chegam em P0.2.2.2.
      </footer>
    </div>
  );
}
