/**
 * BibliotecaEscritosPage — Índice da Biblioteca Patrística.
 *
 * Rota: /biblioteca/escritos
 * Lista todas as obras publicadas agrupadas por escola espiritual.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { listAllPublishedWorks } from '@/services/saintWorksService';
import type { SaintWork, SaintWorkCategory } from '@/types/saintWorks';
import { SAINT_WORK_CATEGORY_LABELS } from '@/types/saintWorks';
import { EditorialHero } from '@/components/editorial';
import { supabase } from '@/integrations/supabase/client';
import { Icons } from '../../constants';

const BibliotecaEscritosPage: React.FC = () => {
  const [works, setWorks] = useState<SaintWork[]>([]);
  const [saintNames, setSaintNames] = useState<Record<string, { name: string; slug: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const rows = await listAllPublishedWorks();
      if (!alive) return;
      setWorks(rows);
      const ids = Array.from(new Set(rows.map((w) => w.saint_id)));
      if (ids.length) {
        const { data } = await supabase
          .from('saints')
          .select('id, name')
          .in('id', ids);
        if (!alive) return;
        const map: Record<string, { name: string; slug: string }> = {};
        (data ?? []).forEach((s: any) => {
          map[s.id] = { name: s.name, slug: s.id };
        });
        setSaintNames(map);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const byCategory = useMemo(() => {
    const grouped: Partial<Record<SaintWorkCategory, SaintWork[]>> = {};
    for (const w of works) {
      (grouped[w.category] ??= []).push(w);
    }
    return grouped;
  }, [works]);

  const categories = Object.keys(byCategory) as SaintWorkCategory[];

  return (
    <section className="min-h-screen bg-background">
      <Helmet>
        <title>Biblioteca Patrística — Obras dos Santos · Cathedra</title>
        <meta
          name="description"
          content="Leia as obras completas dos Padres, Doutores e Místicos da Igreja. Biblioteca Patrística Cathedra: Confissões, Suma Teológica, História de uma Alma e mais."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/biblioteca/escritos" />
      </Helmet>

      <EditorialHero
        kicker="Cathedra · Biblioteca Viva"
        title="Biblioteca Patrística"
        subtitle="Os escritos dos santos, lidos como eles escreveram."
        parchment
        size="lg"
      />

      <div className="max-w-4xl mx-auto px-spacing-md pt-spacing-md">
        <Link
          to="/biblioteca/escritos/busca"
          className="flex items-center gap-2 w-full p-3 bg-card border border-border rounded-premium hover:border-primary/40 hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
        >
          <Icons.Search className="w-4 h-4" aria-hidden />
          <span className="text-premium-sm">Buscar por autor, obra ou palavras dentro dos capítulos…</span>
        </Link>
      </div>


      <div className="max-w-4xl mx-auto px-spacing-md py-spacing-xl space-y-spacing-2xl">
        {loading && (
          <p className="text-center text-muted-foreground">Carregando obras...</p>
        )}

        {!loading && works.length === 0 && (
          <div className="text-center py-spacing-2xl space-y-spacing-sm">
            <Icons.BookOpen className="w-12 h-12 mx-auto text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">
              Nenhuma obra publicada ainda. As primeiras obras da Fase Piloto serão liberadas em breve.
            </p>
          </div>
        )}

        {categories.map((cat) => (
          <section key={cat} className="space-y-spacing-md">
            <div className="flex items-baseline justify-between border-b border-border pb-spacing-xs">
              <h2 className="text-premium-lg font-serif font-bold text-foreground">
                {SAINT_WORK_CATEGORY_LABELS[cat]}
              </h2>
              <span className="text-premium-xs text-muted-foreground tabular-nums">
                {byCategory[cat]!.length} {byCategory[cat]!.length === 1 ? 'obra' : 'obras'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
              {byCategory[cat]!.map((work) => {
                const author = saintNames[work.saint_id];
                const authorRef = author?.slug ?? work.saint_id;
                return (
                  <Link
                    key={work.id}
                    to={`/biblioteca/escritos/${encodeURIComponent(authorRef)}/${encodeURIComponent(work.slug)}`}
                    className="group block p-spacing-md bg-card border border-border rounded-premium hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    {author && (
                      <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-1">
                        {author.name}
                        {work.year_written ? ` · ${work.year_written}` : ''}
                      </p>
                    )}
                    <h3 className="text-premium-md font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {work.title}
                    </h3>
                    {work.abstract && (
                      <p className="mt-spacing-xs text-premium-sm text-muted-foreground line-clamp-2">
                        {work.abstract}
                      </p>
                    )}
                    <div className="mt-spacing-sm flex items-center gap-spacing-sm text-premium-xs text-muted-foreground">
                      <span>{work.chapter_count} cap.</span>
                      {work.total_reading_minutes > 0 && (
                        <span>~{work.total_reading_minutes} min</span>
                      )}
                      {work.is_public_domain && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          DP
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
};

export default BibliotecaEscritosPage;
