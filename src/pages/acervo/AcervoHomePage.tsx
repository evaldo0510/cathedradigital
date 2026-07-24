/**
 * AcervoHomePage — Hub unificado do conhecimento católico do Cathedra.
 *
 * Sprint Acervo Cathedra · Onda 3.
 * Antiga "Biblioteca Católica" evolui para hub central que agrupa
 * Escritos, Padres, Doutores, Magistério, Patrística, Espiritualidade,
 * História, Liturgia, Homilias, Clássicos e Favoritos — todos
 * convergindo para o mesmo ReaderShell, EditorialClosure e Nexus.
 *
 * Não altera banco. Só composição visual de primitivos existentes.
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
import AcervoContinueReadingPanel from './AcervoContinueReadingPanel';
import { LIBRARY_KIND_LABELS } from '@/types/library';

type CategoryStatus = 'live' | 'soon';

interface AcervoCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  countKey?: LibraryKind;
  status: CategoryStatus;
}

/**
 * 11 frentes do Acervo. As "live" já resolvem para superfícies existentes;
 * as "soon" ficam declaradas para não perder o mapa mental do usuário.
 */
const CATEGORIES: AcervoCategory[] = [
  {
    key: 'saint_work',
    label: 'Escritos dos Santos',
    description: 'Confissões, cartas, tratados e diários espirituais na voz de quem viveu.',
    icon: Icons.BookOpen,
    to: '/acervo/lista?kind=saint_work',
    countKey: 'saint_work',
    status: 'live',
  },
  {
    key: 'patristic',
    label: 'Padres da Igreja',
    description: 'A geração apostólica e patrística — Inácio, Ireneu, Cipriano, Basílio.',
    icon: Icons.ScrollText,
    to: '/acervo/lista?kind=patristic',
    countKey: 'patristic',
    status: 'live',
  },
  {
    key: 'doctor',
    label: 'Doutores da Igreja',
    description: '36 mestres reconhecidos pela Igreja — Agostinho, Tomás, Teresa, Teresinha.',
    icon: Icons.BookMarked,
    to: '/acervo/lista?kind=doctor',
    countKey: 'doctor',
    status: 'live',
  },
  {
    key: 'magisterium',
    label: 'Magistério',
    description: 'Concílios, encíclicas, exortações, constituições e cartas apostólicas.',
    icon: Icons.Building2,
    to: '/acervo/lista?kind=magisterium',
    countKey: 'magisterium',
    status: 'live',
  },
  {
    key: 'patristica-tag',
    label: 'Patrística',
    description: 'Os primeiros séculos: sacramentos, martírio, exegese e defesa da fé.',
    icon: Icons.History,
    to: '/acervo/lista?kind=patristic&era=antiga',
    status: 'live',
  },
  {
    key: 'espiritualidade',
    label: 'Espiritualidade',
    description: 'Oração, ascese, mística e caminhos interiores da tradição católica.',
    icon: Icons.Heart,
    status: 'soon',
  },
  {
    key: 'historia',
    label: 'História da Igreja',
    description: 'Concílios, cismas, ordens religiosas, missões — a Igreja no tempo.',
    icon: Icons.Church,
    status: 'soon',
  },
  {
    key: 'liturgia',
    label: 'Liturgia',
    description: 'Missal e Liturgia das Horas do dia, com leituras e comentários.',
    icon: Icons.Chalice,
    to: '/liturgia',
    status: 'live',
  },
  {
    key: 'homilias',
    label: 'Homilias',
    description: 'Homilias patrísticas, dominicais e do Magistério vivo.',
    icon: Icons.Message,
    status: 'soon',
  },
  {
    key: 'classic',
    label: 'Clássicos Católicos',
    description: 'Imitação de Cristo, Filotéia, Combate Espiritual e outros clássicos.',
    icon: Icons.Feather,
    to: '/acervo/lista?kind=classic',
    countKey: 'classic',
    status: 'live',
  },
  {
    key: 'favoritos',
    label: 'Favoritos',
    description: 'Suas obras, versículos, parágrafos e santos marcados.',
    icon: Icons.Star,
    to: '/conta/favoritos',
    status: 'live',
  },
];

const AcervoHomePage: React.FC = () => {
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
      .catch((e) => console.error('[Acervo] load', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen bg-background" data-space="biblioteca">
      <Helmet>
        <title>Acervo Cathedra — Biblioteca Católica</title>
        <meta
          name="description"
          content="O centro do conhecimento católico: Escritos dos Santos, Padres, Doutores, Magistério, Patrística, Liturgia e Clássicos em um só átrio, com ficha editorial e Nexus Theologicus."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/acervo" />
      </Helmet>

      <EditorialHero
        kicker="Cathedra · Acervo"
        title="Acervo Cathedra"
        subtitle="A tradição viva da Igreja em um só átrio — Escritura, Catecismo, Santos, Magistério e Clássicos com leitura, estudo e oração integrados."
        parchment
        size="lg"
      />

      <div className="max-w-6xl mx-auto px-spacing-md py-spacing-xl space-y-spacing-2xl">
        {/* Continue lendo — "Onde parei?" (Onda 3) */}
        <AcervoContinueReadingPanel />

        {/* CTA principal */}
        <section className="flex flex-col items-center gap-spacing-sm text-center">
          <p className="text-premium-md text-muted-foreground max-w-2xl leading-relaxed">
            {totalAll > 0
              ? `${totalAll} obras publicadas hoje — todas com ficha editorial, referências e fecho contemplativo.`
              : 'Acervo em contínua ampliação, com curadoria editorial e Nexus Theologicus.'}
          </p>
          <div className="flex flex-wrap justify-center gap-spacing-sm pt-spacing-xs">
            <Button asChild size="lg">
              <Link to="/acervo/lista" className="gap-spacing-2xs">
                <Icons.Search className="w-4 h-4" aria-hidden />
                Explorar todo o acervo
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

        {/* Categorias */}
        <section aria-labelledby="categorias-heading" className="space-y-spacing-md">
          <h2
            id="categorias-heading"
            className="text-premium-small font-black uppercase tracking-[0.2em] text-primary text-center"
          >
            Navegar pela Tradição
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = cat.countKey ? counts[cat.countKey] ?? 0 : null;
              const isLive = cat.status === 'live' && cat.to;

              const kicker = (
                <span className="inline-flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  {isLive
                    ? count !== null
                      ? `${count} ${count === 1 ? 'obra' : 'obras'}`
                      : 'Explorar'
                    : 'Em breve'}
                </span>
              );

              const card = (
                <EditorialCard
                  kicker={kicker}
                  title={cat.label}
                  description={cat.description}
                  className={`h-full transition-transform ${
                    isLive ? 'hover:-translate-y-0.5' : 'opacity-60'
                  }`}
                />
              );

              return isLive ? (
                <Link
                  key={cat.key}
                  to={cat.to!}
                  aria-label={`Abrir ${cat.label}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  {card}
                </Link>
              ) : (
                <div key={cat.key} aria-disabled="true" className="cursor-not-allowed">
                  {card}
                </div>
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
                to="/acervo/lista"
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
    </main>
  );
};

export default AcervoHomePage;
