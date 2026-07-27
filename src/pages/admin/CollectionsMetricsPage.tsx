/**
 * CollectionsMetricsPage — Onda 3 · Coleções Inteligentes.
 * Painel admin/editor com métricas editoriais agregadas das coleções:
 * total, distribuição por trilha, top iniciadas, top concluídas e tempo médio.
 * Consome a RPC `collections_metrics_v1` (SECURITY DEFINER + has_role).
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReaderShell, EditorialHero } from '@/components/reader';
import { EditorialSurface } from '@/components/editorial';
import { Loader2, ArrowLeft, Layers, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

interface MetricsPayload {
  total_collections: number;
  total_items: number;
  by_track: Record<string, number>;
  top_started: Array<{ slug: string; title: string; started_users: number }>;
  top_completed: Array<{ slug: string; title: string; completion_rate: number | null }>;
  avg_completion_minutes: number;
  generated_at: string;
}

const TRACK_LABEL: Record<string, string> = {
  'formacao-fundamental': 'Formação Fundamental',
  'santos-espiritualidade': 'Santos e Espiritualidade',
  liturgia: 'Liturgia',
  'vida-crista': 'Vida Cristã',
  sem_trilha: 'Sem trilha',
};

export default function CollectionsMetricsPage() {
  const { data, isLoading, error } = useQuery<MetricsPayload>({
    queryKey: ['collections-metrics-v1'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('collections_metrics_v1' as never);
      if (error) throw error;
      return data as unknown as MetricsPayload;
    },
    staleTime: 60 * 1000,
  });

  return (
    <>
      <Helmet>
        <title>Métricas de Coleções · Cathedra</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <ReaderShell
        className="min-h-screen"
        contentMaxWidth="max-w-5xl"
        ariaLabel="Métricas de Coleções"
        hero={
          <EditorialHero
            kicker="ADMIN · ONDA 3"
            title="Métricas de Coleções"
            subtitle="Distribuição por trilha, engajamento e conclusão."
          />
        }
      >
        <div className="mb-spacing-md">
          <Link
            to="/admin/collections"
            className="inline-flex items-center gap-1 text-premium-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Voltar para Coleções
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <EditorialSurface tier="lowest" className="p-spacing-lg text-destructive">
            Erro ao carregar métricas: {(error as Error).message}
          </EditorialSurface>
        )}

        {data && (
          <div className="space-y-spacing-lg">
            {/* KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md">
              <KpiCard icon={Layers} label="Coleções publicadas" value={data.total_collections} />
              <KpiCard icon={CheckCircle2} label="Itens catalogados" value={data.total_items} />
              <KpiCard
                icon={Clock}
                label="Tempo médio (min)"
                value={data.avg_completion_minutes ?? 0}
              />
              <KpiCard
                icon={TrendingUp}
                label="Trilhas ativas"
                value={Object.keys(data.by_track ?? {}).length}
              />
            </section>

            {/* Por trilha */}
            <section>
              <h2 className="font-serif text-premium-lg mb-spacing-md">Por trilha</h2>
              <EditorialSurface tier="lowest" className="p-spacing-md">
                <ul className="space-y-spacing-2xs">
                  {Object.entries(data.by_track ?? {}).map(([k, v]) => (
                    <li
                      key={k}
                      className="flex items-center justify-between text-premium-sm"
                    >
                      <span className="text-foreground">{TRACK_LABEL[k] ?? k}</span>
                      <span className="font-mono tabular-nums text-primary">{v}</span>
                    </li>
                  ))}
                </ul>
              </EditorialSurface>
            </section>

            {/* Top iniciadas */}
            <section>
              <h2 className="font-serif text-premium-lg mb-spacing-md">Mais iniciadas</h2>
              <RankingList
                rows={data.top_started.map((r) => ({
                  slug: r.slug,
                  title: r.title,
                  metric: `${r.started_users} leitores`,
                }))}
                emptyLabel="Ainda sem dados de início."
              />
            </section>

            {/* Top concluídas */}
            <section>
              <h2 className="font-serif text-premium-lg mb-spacing-md">Maior taxa de conclusão</h2>
              <RankingList
                rows={data.top_completed.map((r) => ({
                  slug: r.slug,
                  title: r.title,
                  metric:
                    r.completion_rate == null ? '—' : `${r.completion_rate}%`,
                }))}
                emptyLabel="Ainda sem dados de conclusão."
              />
            </section>

            <p className="text-premium-xs text-muted-foreground text-center pt-spacing-md">
              Gerado em {new Date(data.generated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </ReaderShell>
    </>
  );
}

interface KpiProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}

const KpiCard: React.FC<KpiProps> = ({ icon: Icon, label, value }) => (
  <EditorialSurface tier="lowest" className="p-spacing-md">
    <div className="flex items-center gap-spacing-xs text-primary/70 mb-spacing-2xs">
      <Icon className="w-4 h-4" aria-hidden />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <div className="font-serif text-premium-2xl tabular-nums text-foreground">
      {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
    </div>
  </EditorialSurface>
);

interface RankingRow {
  slug: string;
  title: string;
  metric: string;
}

const RankingList: React.FC<{ rows: RankingRow[]; emptyLabel: string }> = ({
  rows,
  emptyLabel,
}) => {
  if (rows.length === 0) {
    return (
      <EditorialSurface tier="lowest" className="p-spacing-md text-muted-foreground italic text-premium-sm">
        {emptyLabel}
      </EditorialSurface>
    );
  }
  return (
    <EditorialSurface tier="lowest" className="divide-y divide-border/60">
      {rows.map((row, i) => (
        <div
          key={row.slug}
          className="flex items-center gap-spacing-md p-spacing-md"
        >
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-6">
            {String(i + 1).padStart(2, '0')}
          </span>
          <Link
            to={`/acervo/colecoes/${row.slug}`}
            className="flex-1 text-premium-sm text-foreground hover:text-primary hover:underline"
          >
            {row.title}
          </Link>
          <span className="font-mono tabular-nums text-premium-xs text-primary">
            {row.metric}
          </span>
        </div>
      ))}
    </EditorialSurface>
  );
};
