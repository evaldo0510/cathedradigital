/**
 * SaintWorkOverviewPage — Ficha editorial da obra na Biblioteca Patrística.
 *
 * Sprint SW-1.3 (2026-07-24) — Ficha editorial mínima + EditorialClosure em obras externas.
 *
 * Rota: /biblioteca/escritos/:autor/:obra
 *
 * Conteúdo:
 *  - Hero editorial (categoria + título + título original)
 *  - Badges: acesso, nível de leitura, capítulos, minutos, domínio público
 *  - Sinopse (150–300 palavras)
 *  - Temas principais (chips)
 *  - Por que esta obra importa
 *  - Contexto histórico
 *  - Público recomendado
 *  - CTA: "Iniciar leitura" (interno) OU "Ler na fonte oficial" (externo)
 *  - Sumário de capítulos (só quando interno)
 *  - EditorialClosure (reflexão + oração + nexus) — inclusive em obras externas
 *  - Créditos editoriais
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getWorkBySlug,
  listChapters,
} from '@/services/saintWorksService';
import type { SaintWork, SaintWorkChapter } from '@/types/saintWorks';
import {
  SAINT_WORK_CATEGORY_LABELS,
  SAINT_WORK_ACCESS_LABELS,
  SAINT_WORK_READING_LEVEL_LABELS,
} from '@/types/saintWorks';
import { EditorialHero } from '@/components/editorial';
import { EditorialCredits } from '@/components/biblioteca/EditorialCredits';
import { EditorialClosure } from '@/components/reader';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';
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
        if (w.access_type === 'internal') {
          const chs = await listChapters(w.id);
          if (!alive) return;
          setChapters(chs);
        } else {
          setChapters([]);
        }
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
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando obra...</p>
      </section>
    );
  }

  if (notFound || !work) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-spacing-md p-spacing-lg">
        <h2 className="text-premium-lg font-serif">Obra não encontrada</h2>
        <p className="text-muted-foreground text-center max-w-md">
          A obra "{obra}" de "{autor}" não está disponível na Biblioteca Patrística.
        </p>
        <Button asChild variant="outline">
          <Link to="/biblioteca/escritos">Voltar à Biblioteca</Link>
        </Button>
      </section>
    );
  }

  const isInternal = work.access_type === 'internal';
  const firstChapter = chapters[0];
  const canonicalUrl = `https://cathedradigital.com.br/biblioteca/escritos/${autor}/${obra}`;
  const accessLabel = work.external_source_label ?? SAINT_WORK_ACCESS_LABELS[work.access_type];
  const themes = (work.main_themes ?? []).filter((t) => t && t.trim().length > 0);
  const closureProps = resolveEditorialClosure({ editorial_closure: work.editorial_closure });
  const metaDescription = (work.synopsis ?? work.abstract ?? '').slice(0, 155) ||
    `Leia ${work.title} — obra da tradição ${SAINT_WORK_CATEGORY_LABELS[work.category]} na Biblioteca Patrística Cathedra.`;

  return (
    <section className="min-h-screen bg-background" data-space="biblioteca">
      <Helmet>
        <title>{`${work.title} — Biblioteca Patrística · Cathedra`}</title>
        <meta name="description" content={metaDescription} />
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
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-spacing-sm text-premium-xs border-y border-border/50 py-spacing-sm">
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              isInternal
                ? 'bg-primary/10 text-primary'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
            }`}
          >
            {accessLabel}
          </span>
          {work.reading_level && (
            <span className="px-2 py-0.5 rounded font-semibold bg-muted text-foreground/80">
              Nível: {SAINT_WORK_READING_LEVEL_LABELS[work.reading_level]}
            </span>
          )}
          {isInternal && work.chapter_count > 0 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Icons.Book className="w-3.5 h-3.5" aria-hidden />
              {work.chapter_count} {work.chapter_count === 1 ? 'capítulo' : 'capítulos'}
            </span>
          )}
          {isInternal && work.total_reading_minutes > 0 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Icons.Clock className="w-3.5 h-3.5" aria-hidden />
              ~{work.total_reading_minutes} min de leitura
            </span>
          )}
          {work.is_public_domain && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
              Domínio Público
            </span>
          )}
        </div>

        {/* Sinopse (ou abstract legado) */}
        {(work.synopsis || work.abstract) && (
          <section className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-premium-md leading-relaxed text-foreground/90 font-serif">
              {work.synopsis ?? work.abstract}
            </p>
          </section>
        )}

        {/* Temas */}
        {themes.length > 0 && (
          <section aria-labelledby="temas-heading" className="space-y-spacing-xs">
            <h2
              id="temas-heading"
              className="text-premium-small font-black uppercase tracking-[0.2em] text-primary"
            >
              Principais temas
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {themes.map((theme) => (
                <li
                  key={theme}
                  className="px-2.5 py-1 rounded-full bg-muted text-premium-xs text-muted-foreground"
                >
                  {theme}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Por que importa */}
        {work.why_it_matters && (
          <section aria-labelledby="why-heading" className="space-y-spacing-xs">
            <h2
              id="why-heading"
              className="text-premium-small font-black uppercase tracking-[0.2em] text-primary"
            >
              Por que esta obra importa
            </h2>
            <blockquote className="border-l-2 border-primary/60 pl-spacing-md py-spacing-xs text-premium-md text-foreground/90 leading-relaxed italic">
              {work.why_it_matters}
            </blockquote>
          </section>
        )}

        {/* Contexto histórico */}
        {work.historical_context && (
          <section aria-labelledby="context-heading" className="space-y-spacing-xs">
            <h2
              id="context-heading"
              className="text-premium-small font-black uppercase tracking-[0.2em] text-primary"
            >
              Contexto histórico
            </h2>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">
              {work.historical_context}
            </p>
          </section>
        )}

        {/* Público recomendado */}
        {work.recommended_audience && (
          <section aria-labelledby="audience-heading" className="space-y-spacing-xs">
            <h2
              id="audience-heading"
              className="text-premium-small font-black uppercase tracking-[0.2em] text-primary"
            >
              Para quem
            </h2>
            <p className="text-premium-sm text-foreground/85 leading-relaxed">
              {work.recommended_audience}
            </p>
          </section>
        )}

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-spacing-sm">
          {isInternal && firstChapter && (
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
          )}
          {!isInternal && work.external_url && (
            <Button
              size="lg"
              asChild
              variant="outline"
              className="gap-spacing-xs"
            >
              <a
                href={work.external_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${work.title} em ${accessLabel} (nova aba)`}
              >
                <Icons.ExternalLink className="w-4 h-4" aria-hidden />
                Ler na fonte oficial ({accessLabel})
              </a>
            </Button>
          )}
        </div>

        {/* Sumário (só interno) */}
        {isInternal && chapters.length > 0 && (
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

        {/* EditorialClosure — inclusive em obras externas */}
        {closureProps && <EditorialClosure {...closureProps} />}

        <EditorialCredits
          isPublicDomain={work.is_public_domain}
          license={work.license}
          translationCredit={work.translation_credit}
          sourceUrl={work.source_url ?? work.external_url}
        />
      </div>
    </section>
  );
};

export default SaintWorkOverviewPage;
