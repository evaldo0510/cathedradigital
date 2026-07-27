/**
 * SaintWorkCard — Ficha editorial mínima de uma obra na Biblioteca Patrística.
 *
 * Sprint SW-1.3 (2026-07-24).
 *
 * Exibe:
 *  - Cabeçalho: título + categoria + badges (acesso, nível de leitura)
 *  - Sinopse (150-300 palavras)
 *  - Chips dos temas principais
 *  - Contexto histórico (acordeão)
 *  - Por que esta obra importa (destaque)
 *  - Público recomendado
 *  - CTA duplo: "Ler no Cathedra" (interno) OU "Ler na fonte oficial" (externo)
 *
 * Zero domínio: recebe o row `SaintWork` e o `authorRef` já resolvido.
 * Compatível com obras legadas (campos opcionais renderizam vazio).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';
import type {
  SaintWork,
  SaintWorkAccessType,
  SaintWorkReadingLevel,
} from '@/types/saintWorks';
import {
  SAINT_WORK_ACCESS_LABELS,
  SAINT_WORK_CATEGORY_LABELS,
  SAINT_WORK_READING_LEVEL_LABELS,
} from '@/types/saintWorks';

interface Props {
  work: SaintWork;
  authorRef: string;
}

const ACCESS_BADGE_STYLE: Record<SaintWorkAccessType, string> = {
  internal: 'bg-primary/10 text-primary',
  official_external: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  public_domain: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  licensed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

const LEVEL_BADGE_STYLE: Record<SaintWorkReadingLevel, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  advanced: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

const SaintWorkCard: React.FC<Props> = ({ work, authorRef }) => {
  const [showContext, setShowContext] = useState(false);
  const isInternal = work.access_type === 'internal';
  const accessLabel =
    work.external_source_label ?? SAINT_WORK_ACCESS_LABELS[work.access_type];
  const accessBadgeClass = ACCESS_BADGE_STYLE[work.access_type];
  const themes = (work.main_themes ?? []).filter((t) => t && t.trim().length > 0);

  const internalHref = `/biblioteca/escritos/${encodeURIComponent(authorRef)}/${encodeURIComponent(work.slug)}`;

  return (
    <article
      className="group flex flex-col gap-spacing-md p-spacing-md bg-card border border-border rounded-premium hover:border-primary/40 hover:shadow-md transition-all"
      data-space="biblioteca"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-spacing-sm">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-1">
            {SAINT_WORK_CATEGORY_LABELS[work.category]}
            {work.year_written ? ` · ${work.year_written}` : ''}
          </p>
          <h4 className="text-premium-md font-serif font-bold text-foreground leading-tight">
            {work.title}
          </h4>
          {work.original_title && (
            <p className="mt-0.5 text-premium-xs italic text-muted-foreground">
              «{work.original_title}»
            </p>
          )}
        </div>
      </header>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-spacing-xs text-premium-xs">
        <span
          className={`px-2 py-0.5 rounded font-semibold ${accessBadgeClass}`}
          title={SAINT_WORK_ACCESS_LABELS[work.access_type]}
        >
          {accessLabel}
        </span>
        {work.reading_level && (
          <span
            className={`px-2 py-0.5 rounded font-semibold ${LEVEL_BADGE_STYLE[work.reading_level]}`}
          >
            {SAINT_WORK_READING_LEVEL_LABELS[work.reading_level]}
          </span>
        )}
        {isInternal && work.chapter_count > 0 && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icons.Book className="w-3 h-3" aria-hidden />
            {work.chapter_count} {work.chapter_count === 1 ? 'capítulo' : 'capítulos'}
          </span>
        )}
        {isInternal && work.total_reading_minutes > 0 && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icons.Clock className="w-3 h-3" aria-hidden />
            ~{work.total_reading_minutes} min
          </span>
        )}
      </div>

      {/* Sinopse */}
      {(work.synopsis || work.abstract) && (
        <p className="text-premium-sm text-foreground/90 leading-relaxed">
          {work.synopsis ?? work.abstract}
        </p>
      )}

      {/* Temas */}
      {themes.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Temas principais">
          {themes.map((theme) => (
            <li
              key={theme}
              className="px-2 py-0.5 rounded-full bg-muted text-premium-xs text-muted-foreground"
            >
              {theme}
            </li>
          ))}
        </ul>
      )}

      {/* Por que importa */}
      {work.why_it_matters && (
        <blockquote className="border-l-2 border-primary/60 pl-spacing-sm py-1 text-premium-sm text-foreground/85 italic">
          <span className="not-italic text-[10px] uppercase tracking-widest text-primary/70 font-bold block mb-0.5">
            Por que importa
          </span>
          {work.why_it_matters}
        </blockquote>
      )}

      {/* Contexto histórico (acordeão) */}
      {work.historical_context && (
        <div>
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            className="flex items-center gap-1 text-premium-xs uppercase tracking-widest font-bold text-primary/80 hover:text-primary"
            aria-expanded={showContext}
          >
            <Icons.ChevronDown
              className={`w-3 h-3 transition-transform ${showContext ? 'rotate-180' : ''}`}
              aria-hidden
            />
            Contexto histórico
          </button>
          {showContext && (
            <p className="mt-spacing-xs text-premium-sm text-muted-foreground leading-relaxed">
              {work.historical_context}
            </p>
          )}
        </div>
      )}

      {/* Público recomendado */}
      {work.recommended_audience && (
        <p className="text-premium-xs text-muted-foreground">
          <span className="font-semibold text-foreground/70">Para quem: </span>
          {work.recommended_audience}
        </p>
      )}

      {/* Proveniência: hospedagem, atribuição e licença */}
      <div
        className="rounded-md border border-border/60 bg-muted/30 px-spacing-sm py-spacing-xs space-y-1 text-premium-xs"
        aria-label="Proveniência do texto"
      >
        <p className="flex items-center gap-1 font-semibold text-foreground/80">
          {isInternal ? (
            <>
              <Icons.BookOpen className="w-3 h-3 text-primary" aria-hidden />
              Hospedado no Cathedra
            </>
          ) : (
            <>
              <Icons.ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden />
              Conteúdo linkado
              {work.external_source_label && (
                <span className="font-normal text-muted-foreground">
                  {' · '}
                  {work.external_source_label}
                </span>
              )}
            </>
          )}
        </p>
        {work.translation_credit && (
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground/70">Atribuição: </span>
            {work.translation_credit}
          </p>
        )}
        {(work.is_public_domain || work.license) && (
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground/70">Licença: </span>
            {work.is_public_domain ? 'Domínio público' : work.license}
            {work.is_public_domain && work.license ? ` · ${work.license}` : ''}
          </p>
        )}
        {work.source_url && (
          <p className="truncate">
            <a
              href={work.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary underline decoration-dotted underline-offset-2"
            >
              Fonte canônica
            </a>
          </p>
        )}
      </div>

      {/* CTA */}
      <footer className="mt-auto pt-spacing-sm border-t border-border/50 flex flex-wrap items-center gap-spacing-sm">
        <Link
          to={internalHref}
          className="inline-flex items-center gap-1 text-premium-sm font-semibold text-primary hover:underline"
          aria-label={`Abrir ficha editorial de ${work.title} no Cathedra`}
        >
          <Icons.BookOpen className="w-4 h-4" aria-hidden />
          {isInternal ? 'Ler no Cathedra' : 'Ficha editorial'}
        </Link>
        {!isInternal && work.external_url && (
          <a
            href={work.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-premium-sm text-muted-foreground hover:text-foreground"
            aria-label={`Abrir ${work.title} em ${accessLabel} (nova aba)`}
          >
            <Icons.ExternalLink className="w-4 h-4" aria-hidden />
            Ler na fonte oficial
          </a>
        )}
      </footer>

    </article>
  );
};

export default SaintWorkCard;
