/**
 * SaintWorksSection — Seção "Biblioteca Patrística" na ficha do santo.
 *
 * Lê `saint_works` publicadas para o santo e renderiza cards com link
 * para o leitor canônico (`/biblioteca/escritos/:autor/:obra`).
 *
 * Regra Reader Architecture: NÃO renderiza corpo aqui — apenas listagem.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';
import { listWorksBySaint } from '@/services/saintWorksService';
import type { SaintWork } from '@/types/saintWorks';
import { SAINT_WORK_CATEGORY_LABELS } from '@/types/saintWorks';

interface Props {
  saintId: string;
  saintSlug?: string;
}

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
          Biblioteca Patrística · Leitor completo
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
        {works.map((work) => (
          <Link
            key={work.id}
            to={`/biblioteca/escritos/${encodeURIComponent(authorRef)}/${encodeURIComponent(work.slug)}`}
            className="group block p-spacing-md bg-card border border-border rounded-premium hover:border-primary/40 hover:shadow-md transition-all"
            aria-label={`Ler ${work.title}`}
          >
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
                <div className="mt-spacing-sm flex items-center gap-spacing-sm text-premium-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Icons.Book className="w-3 h-3" aria-hidden />
                    {work.chapter_count} {work.chapter_count === 1 ? 'capítulo' : 'capítulos'}
                  </span>
                  {work.total_reading_minutes > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Icons.Clock className="w-3 h-3" aria-hidden />
                      ~{work.total_reading_minutes} min
                    </span>
                  )}
                  {work.is_public_domain && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      Domínio Público
                    </span>
                  )}
                </div>
              </div>
              <Icons.ArrowRight
                className="w-spacing-md h-spacing-md text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                aria-hidden
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SaintWorksSection;
