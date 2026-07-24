/**
 * SaintWorksSection — Seção "Biblioteca Patrística" na ficha do santo.
 *
 * Sprint SW-1.1 — Aba Escritos funcional:
 * - Lê `saint_works` publicadas para o santo.
 * - Renderiza cards com badge de acesso (Interno / Vaticano / Domínio Público).
 * - Roteia para o leitor Cathedra quando `access_type = 'internal'`;
 *   caso contrário, abre `external_url` em nova aba (rel="noopener").
 *
 * Regra Reader Architecture: NÃO renderiza corpo aqui — apenas listagem.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';
import { listWorksBySaint } from '@/services/saintWorksService';
import type { SaintWork, SaintWorkAccessType } from '@/types/saintWorks';
import {
  SAINT_WORK_ACCESS_LABELS,
  SAINT_WORK_CATEGORY_LABELS,
} from '@/types/saintWorks';

interface Props {
  saintId: string;
  saintSlug?: string;
}

const ACCESS_BADGE_STYLE: Record<SaintWorkAccessType, string> = {
  internal: 'bg-primary/10 text-primary',
  official_external: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  public_domain: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  licensed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

const SaintWorksSection: React.FC<Props> = ({ saintId, saintSlug }) => {
  const [works, setWorks] = useState<SaintWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listWorksBySaint(saintId)
      .then((rows) => {
        if (!alive) return;
        setWorks(rows);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [saintId]);

  if (loading) return null;
  if (!works.length) return null;

  const authorRef = saintSlug ?? saintId;

  return (
    <section className="space-y-spacing-md" aria-labelledby="biblioteca-patristica-heading">
      <div className="flex items-center gap-spacing-xs text-primary">
        <Icons.BookOpen className="w-spacing-md h-spacing-md" aria-hidden />
        <h3
          id="biblioteca-patristica-heading"
          className="text-premium-small font-black uppercase tracking-[0.2em]"
        >
          Biblioteca · Escritos completos
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
        {works.map((work) => {
          const isInternal = work.access_type === 'internal';
          const accessLabel =
            work.external_source_label ?? SAINT_WORK_ACCESS_LABELS[work.access_type];
          const badgeClass = ACCESS_BADGE_STYLE[work.access_type];
          const commonInner = (
            <div className="flex items-start justify-between gap-spacing-sm">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-1">
                  {SAINT_WORK_CATEGORY_LABELS[work.category]}
                  {work.year_written ? ` · ${work.year_written}` : ''}
                </p>
                <h4 className="text-premium-md font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {work.title}
                </h4>
                {work.abstract && (
                  <p className="mt-spacing-xs text-premium-sm text-muted-foreground line-clamp-2">
                    {work.abstract}
                  </p>
                )}
                <div className="mt-spacing-sm flex flex-wrap items-center gap-spacing-sm text-premium-xs text-muted-foreground">
                  {isInternal && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Icons.Book className="w-3 h-3" aria-hidden />
                        {work.chapter_count}{' '}
                        {work.chapter_count === 1 ? 'capítulo' : 'capítulos'}
                      </span>
                      {work.total_reading_minutes > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Icons.Clock className="w-3 h-3" aria-hidden />
                          ~{work.total_reading_minutes} min
                        </span>
                      )}
                    </>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded font-semibold ${badgeClass}`}
                    title={SAINT_WORK_ACCESS_LABELS[work.access_type]}
                  >
                    {accessLabel}
                  </span>
                  {work.is_public_domain && work.access_type !== 'public_domain' && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      Domínio Público
                    </span>
                  )}
                </div>
              </div>
              {isInternal ? (
                <Icons.ArrowRight
                  className="w-spacing-md h-spacing-md text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-hidden
                />
              ) : (
                <Icons.ExternalLink
                  className="w-spacing-md h-spacing-md text-primary opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-hidden
                />
              )}
            </div>
          );

          const cardClass =
            'group block p-spacing-md bg-card border border-border rounded-premium hover:border-primary/40 hover:shadow-md transition-all';

          if (isInternal) {
            return (
              <Link
                key={work.id}
                to={`/biblioteca/escritos/${encodeURIComponent(authorRef)}/${encodeURIComponent(work.slug)}`}
                className={cardClass}
                aria-label={`Ler ${work.title} no leitor Cathedra`}
              >
                {commonInner}
              </Link>
            );
          }

          // External: só renderiza se houver URL (trigger de banco garante, mas guarda no cliente).
          if (!work.external_url) return null;
          return (
            <a
              key={work.id}
              href={work.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClass}
              aria-label={`Abrir ${work.title} em ${accessLabel} (nova aba)`}
            >
              {commonInner}
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default SaintWorksSection;
