/**
 * SaintWorkReaderPage — Leitor canônico da Biblioteca Patrística.
 *
 * Rota: /biblioteca/escritos/:autor/:obra/capitulo/:ordem
 * Usa o ReaderShell (Reader Architecture Rule) com EditorialHero e navegação.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getWorkBySlug,
  getChapter,
  listChapters,
} from '@/services/saintWorksService';
import type { SaintWork, SaintWorkChapter } from '@/types/saintWorks';
import { SAINT_WORK_CATEGORY_LABELS } from '@/types/saintWorks';
import { ReaderShell } from '@/components/reader';
import { EditorialHero } from '@/components/editorial';
import { EditorialCredits } from '@/components/biblioteca/EditorialCredits';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';

type ChapterSummary = Pick<SaintWorkChapter, 'id' | 'order' | 'title' | 'subtitle' | 'reading_minutes'>;

const SaintWorkReaderPage: React.FC = () => {
  const { autor, obra, ordem } = useParams<{ autor: string; obra: string; ordem: string }>();
  const navigate = useNavigate();
  const currentOrder = Math.max(1, parseInt(ordem ?? '1', 10) || 1);

  const [work, setWork] = useState<SaintWork | null>(null);
  const [chapter, setChapter] = useState<SaintWorkChapter | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!autor || !obra) return;
    setLoading(true);
    setNotFound(false);

    (async () => {
      const w = await getWorkBySlug(autor, obra);
      if (!alive) return;
      if (!w) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setWork(w);
      const [ch, chs] = await Promise.all([
        getChapter(w.id, currentOrder),
        listChapters(w.id),
      ]);
      if (!alive) return;
      if (!ch) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setChapter(ch);
      setChapters(chs);
      setLoading(false);
      // Scroll to top on chapter change
      window.scrollTo({ top: 0, behavior: 'auto' });
    })();

    return () => {
      alive = false;
    };
  }, [autor, obra, currentOrder]);

  const { prev, next } = useMemo(() => {
    if (!chapters.length) return { prev: null, next: null };
    const idx = chapters.findIndex((c) => c.order === currentOrder);
    return {
      prev: idx > 0 ? chapters[idx - 1] : null,
      next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null,
    };
  }, [chapters, currentOrder]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando capítulo...</p>
      </main>
    );
  }

  if (notFound || !work || !chapter) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-spacing-md p-spacing-lg">
        <h1 className="text-premium-lg font-serif">Capítulo não encontrado</h1>
        <Button asChild variant="outline">
          <Link to={`/biblioteca/escritos/${autor}/${obra}`}>Voltar à obra</Link>
        </Button>
      </main>
    );
  }

  const canonicalUrl = `https://cathedradigital.com.br/biblioteca/escritos/${autor}/${obra}/capitulo/${chapter.order}`;

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{`${chapter.title} — ${work.title} · Cathedra`}</title>
        <meta
          name="description"
          content={
            chapter.body_plain
              ?.replace(/\s+/g, ' ')
              .slice(0, 155) ??
            `Capítulo ${chapter.order} de ${work.title}.`
          }
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="mb-2 px-spacing-md pt-spacing-sm max-w-4xl mx-auto">
        <Link
          to={`/biblioteca/escritos/${autor}/${obra}`}
          className="inline-flex items-center gap-1 text-premium-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Icons.ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          {work.title}
        </Link>
      </div>

      <ReaderShell
        ariaLabel={`${work.title} — Capítulo ${chapter.order}: ${chapter.title}`}
        hero={
          <EditorialHero
            kicker={`${SAINT_WORK_CATEGORY_LABELS[work.category]} · Capítulo ${chapter.order}`}
            title={chapter.title}
            subtitle={chapter.subtitle ?? undefined}
            size="md"
          />
        }
        continuation={
          <div className="max-w-[68ch] mx-auto flex items-center justify-between gap-spacing-md">
            {prev ? (
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(`/biblioteca/escritos/${autor}/${obra}/capitulo/${prev.order}`)
                }
                className="gap-spacing-xs flex-1 justify-start min-w-0"
              >
                <Icons.ArrowLeft className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span className="flex flex-col items-start min-w-0">
                  <span className="text-premium-xs uppercase text-muted-foreground">
                    Anterior
                  </span>
                  <span className="text-premium-sm truncate max-w-[16ch] md:max-w-none">
                    {prev.title}
                  </span>
                </span>
              </Button>
            ) : (
              <span aria-hidden />
            )}
            {next ? (
              <Button
                onClick={() =>
                  navigate(`/biblioteca/escritos/${autor}/${obra}/capitulo/${next.order}`)
                }
                className="gap-spacing-xs flex-1 justify-end min-w-0"
              >
                <span className="flex flex-col items-end min-w-0">
                  <span className="text-premium-xs uppercase opacity-80">Próximo</span>
                  <span className="text-premium-sm truncate max-w-[16ch] md:max-w-none">
                    {next.title}
                  </span>
                </span>
                <Icons.ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden />
              </Button>
            ) : (
              <Link
                to={`/biblioteca/escritos/${autor}/${obra}`}
                className="ml-auto text-premium-xs text-primary hover:underline"
              >
                Fim da obra · Voltar ao sumário
              </Link>
            )}
          </div>
        }
      >
        <article
          className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.body_html }}
        />
        <div className="max-w-[68ch] mx-auto">
          <EditorialCredits
            isPublicDomain={work.is_public_domain}
            license={work.license}
            translationCredit={work.translation_credit}
            sourceUrl={work.source_url}
            compact
          />
        </div>
      </ReaderShell>
    </main>
  );
};

export default SaintWorkReaderPage;
