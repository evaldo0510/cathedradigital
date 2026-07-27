/**
 * CollectionCertificatePage — Página de status para coleções `certificate_eligible`.
 *
 * Rota: /colecoes/:slug/certificado
 *
 * Mostra critérios da trilha, progresso agregado por item e confirmação
 * final quando todos os itens (incluindo bloqueados) forem concluídos.
 * Não emite PDF — apenas certifica na tela e registra `certificate_issued_at`
 * em `collection_progress` (linha sintética por item já cobre o resto).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { trackCollectionEvent } from '@/features/collections/collectionAnalytics';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Award,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowLeft,
  Lock,
  Sparkles,
} from 'lucide-react';
import { EditorialHero } from '@/components/reader';
import { ReaderShell } from '@/components/reader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollection } from '@/features/collections/useCollection';
import { useCollectionProgress } from '@/features/collections/useCollectionProgress';
import { CollectionProgressBar } from '@/features/collections/CollectionProgressBar';
import {
  computeCertificateStatus,
  type ProgressMap,
} from '@/features/collections/certificateEligibility';

const CollectionCertificatePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCollection(slug);
  const collectionId = data?.collection.id;
  const { progress } = useCollectionProgress(collectionId);

  const status = useMemo(
    () =>
      computeCertificateStatus(
        data?.collection ?? null,
        data?.items ?? [],
        progress as ProgressMap,
      ),
    [data, progress],
  );

  const { total, completed: totalCompleted, pct, done, itemStates, criteria } = status;

  // Analytics: dispara uma única vez quando a trilha certificável é concluída.
  const emittedRef = useRef(false);
  useEffect(() => {
    if (emittedRef.current) return;
    if (!data?.collection || !done) return;
    if (!data.collection.certificate_eligible) return;
    emittedRef.current = true;
    const c = data.collection;
    trackCollectionEvent('collection_certificate_completed', {
      collection_id: c.id,
      collection_slug: c.slug,
      collection_title: c.title,
      category: c.category,
      difficulty_level: c.difficulty_level ?? null,
      estimated_reading_time_minutes: c.estimated_reading_time_minutes ?? null,
      items_total: total,
      items_completed: totalCompleted,
      has_certificate: true,
    });
  }, [data, done, total, totalCompleted]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) return <Navigate to="/404" replace />;
  const { collection } = data;

  // Só faz sentido para trilhas certificáveis.
  if (!collection.certificate_eligible) {
    return <Navigate to={`/colecoes/${collection.slug}`} replace />;
  }


  return (
    <>
      <Helmet>
        <title>Certificado · {collection.title} · Cathedra</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <ReaderShell
        contentMaxWidth="max-w-3xl"
        ariaLabel={`Certificado — ${collection.title}`}
        hero={
          <EditorialHero
            kicker="Cathedra · Certificação editorial"
            title={`Certificado — ${collection.title}`}
            subtitle="Confirmação da conclusão da trilha de formação"
          />
        }
      >
        <div className="mb-spacing-md">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/colecoes/${collection.slug}`}>
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden />
              Voltar à coleção
            </Link>
          </Button>
        </div>

        {/* Estado do certificado */}
        <section
          aria-labelledby="cert-status"
          data-testid="certificate-status"
          className={cn(
            'rounded-2xl border p-spacing-lg space-y-spacing-md',
            done
              ? 'border-primary/40 bg-primary/[0.05]'
              : 'border-border bg-card/40',
          )}
        >
          <div className="flex items-center gap-spacing-md">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
              aria-hidden
            >
              {done ? <Award className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h2 id="cert-status" className="font-serif text-premium-xl text-foreground">
                {done ? 'Trilha concluída' : 'Certificado em progresso'}
              </h2>
              <p className="text-premium-sm text-muted-foreground">
                {totalCompleted} de {total} conteúdos concluídos · {pct}%
              </p>
            </div>
          </div>

          <CollectionProgressBar completed={totalCompleted} total={total} />

          {done ? (
            <div
              className="rounded-xl border border-primary/30 bg-primary/[0.06] p-spacing-md space-y-spacing-xs"
              data-testid="certificate-confirmation"
            >
              <p className="inline-flex items-center gap-spacing-xs text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                <Sparkles className="w-4 h-4" aria-hidden />
                Confirmado
              </p>
              <p className="font-serif text-premium-md text-foreground leading-relaxed">
                {collection.completion_message ??
                  `Você completou "${collection.title}". O aprendizado permanece — retome quando quiser.`}
              </p>
            </div>
          ) : (
            <p className="text-premium-sm text-muted-foreground">
              Continue a leitura para desbloquear a confirmação final.
            </p>
          )}
        </section>

        {/* Critérios */}
        <section
          aria-labelledby="cert-criteria"
          className="mt-spacing-lg rounded-2xl border border-border/60 bg-card/40 p-spacing-lg"
        >
          <h2 id="cert-criteria" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
            Critérios da certificação
          </h2>
          <ul className="space-y-spacing-xs">
            {criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-spacing-xs text-premium-sm">
                {c.met ? (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-[3px]" aria-hidden />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-[3px]" aria-hidden />
                )}
                <span className={cn(c.met ? 'text-foreground' : 'text-muted-foreground')}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Progresso por item */}
        <section
          aria-labelledby="cert-items"
          className="mt-spacing-lg rounded-2xl border border-border/60 bg-card/40 p-spacing-lg"
        >
          <h2 id="cert-items" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
            Progresso por conteúdo
          </h2>
          <ol className="space-y-spacing-2xs">
            {itemStates.map((st, i) => {
              const it = st.item;
              const c = st.status === 'completed';
              const locked = st.locked;
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-spacing-xs text-premium-sm py-spacing-2xs border-b border-border/40 last:border-b-0"
                >
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-6">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {c ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden />
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
                  )}
                  <span className={cn('flex-1', c ? 'text-foreground' : 'text-muted-foreground')}>
                    {it.title_override ?? it.item_slug.replace(/-/g, ' ')}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-widest',
                      c ? 'text-primary' : locked ? 'text-muted-foreground/50' : 'text-muted-foreground/60',
                    )}
                  >
                    {c ? 'Concluído' : locked ? 'Bloqueado' : 'Pendente'}
                  </span>
                </li>
              );
            })}
          </ol>

        </section>
      </ReaderShell>
    </>
  );
};

export default CollectionCertificatePage;
