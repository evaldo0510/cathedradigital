/**
 * BibliotecaCatolicaPage — Landing da frente unificada.
 *
 * Sprint Biblioteca Católica · Onda 1.
 * Reúne Escritos, Padres, Doutores, Clássicos e Magistério
 * num único átrio, cada um filtrando o acervo unificado.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { EditorialHero, EditorialCard } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
import {
  countLibraryByKind,
  fetchLibraryFeatured,
} from '@/services/libraryService';
import type { LibraryItem, LibraryKind } from '@/types/library';
import {
  LIBRARY_KIND_LABELS,
  LIBRARY_KIND_DESCRIPTIONS,
} from '@/types/library';

const KIND_ORDER: LibraryKind[] = [
  'saint_work',
  'patristic',
  'doctor',
  'classic',
  'magisterium',
];

const KIND_ICONS: Record<LibraryKind, React.ComponentType<{ className?: string }>> = {
  saint_work: Icons.BookOpen,
  patristic: Icons.ScrollText,
  doctor: Icons.BookMarked,
  classic: Icons.Feather,
  magisterium: Icons.Building2,
};

const BibliotecaCatolicaPage: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [featured, setFeatured] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([countLibraryByKind(), fetchLibraryFeatured(6)])
      .then(([c, f]) => {
        if (!alive) return;
        setCounts(c);
        setFeatured(f);
      })
      .catch((e) => console.error('[BibliotecaCatolica] load', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section className="min-h-screen bg-background" data-space="biblioteca">
      <Helmet>
        <title>Biblioteca Católica — Cathedra</title>
        <meta
          name="description"
          content="A tradição viva da Igreja em um só lugar: Escritos dos Santos, Padres, Doutores, Clássicos e Magistério com fichas editoriais, leitura contínua e Nexus Theologicus."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/biblioteca/catolica" />
      </Helmet>

      <EditorialHero
        kicker="Cathedra · Biblioteca"
        title="Biblioteca Católica"
        subtitle="A tradição viva da Igreja — Escritos, Padres, Doutores, Clássicos e Magistério em um só átrio."
        parchment
        size="lg"
      />

      <div className="max-w-6xl mx-auto px-spacing-md py-spacing-xl space-y-spacing-2xl">
        {/* CTA principal */}
        <section className="flex flex-col items-center gap-spacing-sm text-center">
          <p className="text-premium-md text-muted-foreground max-w-2xl leading-relaxed">
            {totalAll > 0
              ? `${totalAll} obras publicadas, todas com ficha editorial, referências e fecho contemplativo.`
              : 'Acervo em contínua ampliação, com curadoria editorial e Nexus Theologicus.'}
          </p>
          <div className="flex flex-wrap justify-center gap-spacing-sm pt-spacing-xs">
            <Button asChild size="lg">
              <Link to="/biblioteca/catolica/acervo" className="gap-spacing-2xs">
                <Icons.Search className="w-4 h-4" aria-hidden />
                Explorar o acervo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/biblioteca/escritos" className="gap-spacing-2xs">
                <Icons.BookOpen className="w-4 h-4" aria-hidden />
                Ir aos Escritos
              </Link>
            </Button>
          </div>
        </section>

        {/* Cards por tipo */}
        <section aria-labelledby="tipos-heading" className="space-y-spacing-md">
          <h2
            id="tipos-heading"
            className="text-premium-small font-black uppercase tracking-[0.2em] text-primary text-center"
          >
            Cinco frentes, uma só Tradição
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
            {KIND_ORDER.map((kind) => {
              const Icon = KIND_ICONS[kind];
              const count = counts[kind] ?? 0;
              return (
                <Link
                  key={kind}
                  to={`/biblioteca/catolica/acervo?kind=${kind}`}
                  aria-label={`Explorar ${LIBRARY_KIND_LABELS[kind]}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <EditorialCard
                    kicker={
                      <span className="inline-flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" aria-hidden />
                        {count} {count === 1 ? 'obra' : 'obras'}
                      </span>
                    }
                    title={LIBRARY_KIND_LABELS[kind]}
                    description={LIBRARY_KIND_DESCRIPTIONS[kind]}
                    className="h-full transition-transform hover:-translate-y-0.5"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Destaques */}
        {!loading && featured.length > 0 && (
          <section aria-labelledby="destaques-heading" className="space-y-spacing-md">
            <div className="flex items-baseline justify-between">
              <h2
                id="destaques-heading"
                className="text-premium-small font-black uppercase tracking-[0.2em] text-primary"
              >
                Destaques editoriais
              </h2>
              <Link
                to="/biblioteca/catolica/acervo"
                className="text-premium-xs text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
              {featured.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  aria-label={`Abrir ${item.title}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <EditorialCard
                    kicker={`${LIBRARY_KIND_LABELS[item.library_kind]}${item.year ? ` · c. ${item.year}` : ''}`}
                    title={item.title}
                    meta={item.author_label}
                    description={item.synopsis ?? undefined}
                    className="h-full transition-transform hover:-translate-y-0.5"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
};

export default BibliotecaCatolicaPage;
