/**
 * SaintWorkOverviewPage — Página de visão geral da obra.
 *
 * Rota: /biblioteca/escritos/:autor/:obra
 * Mostra: abstract, licença, sumário de capítulos, botão "Iniciar leitura".
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getWorkBySlug,
  listChapters,
} from '@/services/saintWorksService';
import type { SaintWork, SaintWorkChapter } from '@/types/saintWorks';
import { SAINT_WORK_CATEGORY_LABELS } from '@/types/saintWorks';
import { EditorialHero } from '@/components/editorial';
import { EditorialCredits } from '@/components/biblioteca/EditorialCredits';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';

type ChapterSummary = Pick<SaintWorkChapter, 'id' | 'order' | 'title' | 'subtitle' | 'reading_minutes'>;

const SaintWorkOverviewPage: React.FC = () => {
  const { autor, obra } = useParams<{ autor: string; obra: string }>();
  const navigate = useNavigate();
  const [work, setWork] = useState<SaintWork | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!autor || !obra) return;
    setLoading(true);
    setNotFound(false);
    getWorkBySlug(autor, obra)
      .then(async (w) => {
        if (!alive) return;
        if (!w) {
          setNotFound(true);
          setWork(null);
          setChapters([]);
          return;
        }
        setWork(w);
        const chs = await listChapters(w.id);
        if (!alive) return;
        setChapters(chs);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [autor, obra]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando obra...</p>
      </main>
    );
  }

  if (notFound || !work) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-spacing-md p-spacing-lg">
        <h2 className="text-premium-lg font-serif">Obra não encontrada</h2>
        <p className="text-muted-foreground text-center max-w-md">
          A obra "{obra}" de "{autor}" não está disponível na Biblioteca Patrística.
        </p>
        <Button asChild variant="outline">
          <Link to="/biblioteca/escritos">Voltar à Biblioteca</Link>
        </Button>
      </main>
    );
  }

  const firstChapter = chapters[0];
  const canonicalUrl = `https://cathedradigital.com.br/biblioteca/escritos/${autor}/${obra}`;

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{`${work.title} — Biblioteca Patrística · Cathedra`}</title>
        <meta
          name="description"
          content={
            work.abstract?.slice(0, 155) ??
            `Leia ${work.title} — obra da tradição ${SAINT_WORK_CATEGORY_LABELS[work.category]} na Biblioteca Patrística Cathedra.`
          }
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <EditorialHero
        kicker={`${SAINT_WORK_CATEGORY_LABELS[work.category]}${work.year_written ? ` · c. ${work.year_written}` : ''}`}
        title={work.title}
        subtitle={work.original_title ? `«${work.original_title}»` : undefined}
        parchment
        size="lg"
      />

      <div className="max-w-3xl mx-auto px-spacing-md py-spacing-lg space-y-spacing-xl">
        {work.abstract && (
          <section className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-premium-md leading-relaxed text-foreground/90 font-serif italic">
              {work.abstract}
            </p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-spacing-sm text-premium-xs text-muted-foreground border-y border-border/50 py-spacing-sm">
          <span className="inline-flex items-center gap-1">
            <Icons.Book className="w-3.5 h-3.5" aria-hidden />
            {work.chapter_count} {work.chapter_count === 1 ? 'capítulo' : 'capítulos'}
          </span>
          {work.total_reading_minutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Icons.Clock className="w-3.5 h-3.5" aria-hidden />
              ~{work.total_reading_minutes} min de leitura
            </span>
          )}
          {work.is_public_domain && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              Domínio Público
            </span>
          )}
          {work.license && !work.is_public_domain && (
            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Licença: {work.license}
            </span>
          )}
        </div>

        {firstChapter && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() =>
                navigate(
                  `/biblioteca/escritos/${autor}/${obra}/capitulo/${firstChapter.order}`
                )
              }
              className="gap-spacing-xs"
            >
              <Icons.BookOpen className="w-4 h-4" aria-hidden />
              Iniciar leitura
            </Button>
          </div>
        )}

        {chapters.length > 0 && (
          <section className="space-y-spacing-md">
            <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary">
              Sumário
            </h2>
            <ol className="space-y-spacing-2xs">
              {chapters.map((ch) => (
                <li key={ch.id}>
                  <Link
                    to={`/biblioteca/escritos/${autor}/${obra}/capitulo/${ch.order}`}
                    className="flex items-baseline gap-spacing-sm py-spacing-sm px-spacing-sm rounded hover:bg-muted/50 transition-colors border-b border-border/30"
                  >
                    <span className="text-premium-xs font-mono text-muted-foreground w-8 flex-shrink-0 tabular-nums">
                      {String(ch.order).padStart(2, '0')}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-serif text-foreground">{ch.title}</span>
                      {ch.subtitle && (
                        <span className="block text-premium-xs text-muted-foreground italic mt-0.5">
                          {ch.subtitle}
                        </span>
                      )}
                    </span>
                    {ch.reading_minutes > 0 && (
                      <span className="text-premium-xs text-muted-foreground tabular-nums flex-shrink-0">
                        {ch.reading_minutes} min
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <EditorialCredits
          isPublicDomain={work.is_public_domain}
          license={work.license}
          translationCredit={work.translation_credit}
          sourceUrl={work.source_url}
        />
      </div>
    </main>
  );
};

export default SaintWorkOverviewPage;
