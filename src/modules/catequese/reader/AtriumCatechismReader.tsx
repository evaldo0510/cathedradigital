/**
 * AtriumCatechismReader — Etapa 3 (reskin Stitch, tela 6 "Catecismo").
 *
 * Sem params → landing editorial com as 4 partes do CIC + prólogo.
 * Com ?p=N → delega ao Catechism existente (não duplica lógica).
 */

import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { BookMarked, ArrowRight, Search as SearchIcon } from 'lucide-react';
import { CIC_SECTIONS } from '@/data/catechism';
import { AppRoute } from '@/types';
import { CatechismSkeleton } from '@/components/cathedra/RouteSkeletons';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { EditorialHero, EditorialCard } from '@/components/editorial/harmony';

const Catechism = lazy(() => import('./Catechism'));

const PART_KICKERS: Record<string, string> = {
  'Introdução': 'Prólogo',
  'Parte I': 'Credo',
  'Parte II': 'Liturgia',
  'Parte III': 'Moral',
  'Parte IV': 'Oração',
};

const AtriumCatechismReader: React.FC = () => {
  const [sp] = useSearchParams();
  const pParam = sp.get('p');

  // Reader Template Master (COS §10 / Regra 11):
  // Quando há `?p=`, o próprio Catechism renderiza a cadeia canônica
  // ReaderShell → EditorialHero → HeaderContext → NexusPanel → ReaderContinuation.
  // Não envolver com chrome paralelo (EditorialReaderChrome removido).
  if (pParam) {
    return (
      <Suspense fallback={<CatechismSkeleton />}>
        <MobileTopBar
          kicker="Cathedra · Depositum Fidei"
          title={`§${pParam}`}
          showBack
        />
        <Catechism />
        <MobileBottomNav />
      </Suspense>
    );
  }
  return <CatechismLanding />;
};


const CatechismLanding: React.FC = () => {
  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Cathedra — Catecismo da Igreja Católica</title>
        <meta
          name="description"
          content="Os 2865 parágrafos do CIC organizados em Credo, Liturgia, Moral e Oração — com Nexus contextual e leitura contemplativa."
        />
        <meta property="og:title" content="Cathedra — Catecismo da Igreja Católica" />
      </Helmet>

      <MobileTopBar
        transparent
        kicker="Cathedra"
        title="Catecismo"
      />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+2rem)] pt-10 md:px-16 md:pb-16 md:pt-14 animate-fade-in">
        {/* CAT-SP4 · Onda B.1 — Hero universal (Harmony) */}
        <EditorialHero density="balanced" rule={false}>
          <EditorialHero.Eyebrow>Depositum Fidei</EditorialHero.Eyebrow>
          <EditorialHero.Title>Catecismo</EditorialHero.Title>
          <EditorialHero.Subtitle>
            Dois mil e oitocentos e sessenta e cinco parágrafos que articulam a fé,
            os sacramentos, a vida moral e a oração da Igreja em um único fio de ouro.
          </EditorialHero.Subtitle>
          <EditorialHero.Context>
            <Link
              to={AppRoute.BUSCAR}
              className="group relative flex w-full items-center gap-3 rounded-lg border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-4 py-2.5 text-[14px] font-medium text-stitch-on-surface-variant transition-all hover:border-stitch-secondary md:w-64"
            >
              <SearchIcon className="h-5 w-5 shrink-0" />
              <span className="font-stitch-body">Buscar §parágrafo…</span>
            </Link>
          </EditorialHero.Context>
        </EditorialHero>

        {/* Partes do CIC — sumário editorial */}
        <section className="pt-[var(--sp-xl)] space-y-[var(--sp-xl)]">
          {CIC_SECTIONS.map((part, idx) => {
            const first = part.sections[0]?.paragraphs?.[0] ?? 1;
            return (
              <article
                key={part.part}
                className="grid grid-cols-1 gap-[var(--sp-l)] border-b border-stitch-outline-variant/20 pb-[var(--sp-xl)] last:border-b-0 md:grid-cols-12"
              >
                <header className="md:col-span-4">
                  <span className="type-rubrica">
                    {PART_KICKERS[part.part] ?? part.part}
                  </span>
                  <div className="mt-[var(--sp-s)] flex items-baseline gap-4">
                    <span className="font-stitch-display text-[48px] italic leading-none text-stitch-secondary/75">
                      {String(idx).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="type-h3 text-foreground">{part.part}</h2>
                      <p className="mt-1 type-caption italic">{part.title}</p>
                    </div>
                  </div>
                  <Link
                    to={`${AppRoute.CATECHISM}?p=${first}`}
                    className="mt-[var(--sp-l)] inline-flex min-h-[44px] items-center gap-2 border-b border-stitch-secondary/40 pb-0.5 type-rubrica text-stitch-secondary transition-colors hover:border-stitch-secondary"
                  >
                    Abrir §{first}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </header>

                <div className="grid grid-cols-1 gap-[var(--sp-m)] md:col-span-8 md:grid-cols-2">
                  {part.sections.map((sec) => (
                    <EditorialCard
                      key={sec.id}
                      as="a"
                      href={`${AppRoute.CATECHISM}?p=${sec.paragraphs[0]}`}
                      density="dense"
                    >
                      <EditorialCard.Eyebrow>
                        §{sec.paragraphs[0]} – §{sec.paragraphs[1]}
                      </EditorialCard.Eyebrow>
                      <EditorialCard.Title>{sec.title}</EditorialCard.Title>
                      <EditorialCard.CTA>
                        <span className="inline-flex items-center gap-2 type-rubrica text-stitch-secondary">
                          Abrir <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </EditorialCard.CTA>
                    </EditorialCard>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-12 flex items-center gap-4 border-t border-stitch-secondary/10 pt-8 text-stitch-on-surface-variant">
          <BookMarked className="h-5 w-5 text-stitch-secondary" />
          <p className="font-stitch-body text-[14px] italic">
            "A fé que professamos, os sacramentos que celebramos, a vida que
            vivemos, a oração que rezamos." — CIC, Prólogo.
          </p>
        </section>
      </section>

      <MobileBottomNav />
    </div>
  );
};

export default AtriumCatechismReader;
