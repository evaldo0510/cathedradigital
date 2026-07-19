/**
 * AtriumCatechismReader — Etapa 3 (reskin Stitch, tela 6 "Catecismo").
 *
 * Sem params → landing editorial com as 4 partes do CIC + prólogo.
 * Com ?p=N → delega ao Catechism existente (não duplica lógica).
 */

import React, { lazy, Suspense, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { BookMarked, ArrowRight, Search as SearchIcon } from 'lucide-react';
import { CIC_SECTIONS } from '@/data/catechism';
import { AppRoute } from '@/types';
import { CatechismSkeleton } from '@/components/cathedra/RouteSkeletons';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';

const Catechism = lazy(() => import('@/components/cathedra/Catechism'));

const PART_KICKERS: Record<string, string> = {
  'Introdução': 'Prólogo',
  'Parte I': 'Credo',
  'Parte II': 'Liturgia',
  'Parte III': 'Moral',
  'Parte IV': 'Oração',
};

function findPartByParagraph(p: number): { part: string; section?: string } | null {
  for (const part of CIC_SECTIONS) {
    for (const sec of part.sections) {
      const [start, end] = sec.paragraphs;
      if (p >= start && p <= end) return { part: part.part, section: sec.title };
    }
  }
  return null;
}

const AtriumCatechismReader: React.FC = () => {
  const [sp] = useSearchParams();
  const pParam = sp.get('p');
  const chrome = useMemo(() => {
    if (!pParam) return null;
    const n = parseInt(pParam, 10);
    const loc = Number.isFinite(n) ? findPartByParagraph(n) : null;
    const kicker = loc ? `${PART_KICKERS[loc.part] ?? loc.part}` : 'Depositum Fidei';
    const title = `§${pParam}`;
    const subtitle = loc?.section;
    return { kicker, title, subtitle };
  }, [pParam]);

  if (pParam && chrome) {
    return (
      <Suspense fallback={<CatechismSkeleton />}>
        <EditorialReaderChrome
          kicker={`Cathedra · ${chrome.kicker}`}
          title={chrome.title}
          subtitle={chrome.subtitle}
          backHref={AppRoute.CATECHISM}
        />
        <Catechism />
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

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-10 md:px-16 md:pt-14 animate-fade-in">
        {/* Hero */}
        <section className="border-b border-stitch-secondary/10 pb-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="mb-2 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
                Depositum Fidei
              </span>
              <h1 className="font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
                Catecismo
              </h1>
              <p className="mt-4 font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant">
                Dois mil e oitocentos e sessenta e cinco parágrafos que
                articulam a fé, os sacramentos, a vida moral e a oração da
                Igreja em um único fio de ouro.
              </p>
            </div>
            <Link
              to={AppRoute.BUSCAR}
              className="group relative flex w-full items-center gap-3 rounded-lg border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-4 py-2.5 text-[14px] font-medium text-stitch-on-surface-variant transition-all hover:border-stitch-secondary md:w-64"
            >
              <SearchIcon className="h-5 w-5 shrink-0" />
              <span className="font-stitch-body">Buscar §parágrafo…</span>
            </Link>
          </div>
        </section>

        {/* Partes do CIC */}
        <section className="pt-12 space-y-10">
          {CIC_SECTIONS.map((part, idx) => {
            const first = part.sections[0]?.paragraphs?.[0] ?? 1;
            return (
              <article
                key={part.part}
                className="grid grid-cols-1 gap-8 border-b border-stitch-outline-variant/20 pb-10 last:border-b-0 md:grid-cols-12"
              >
                <header className="md:col-span-4">
                  <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
                    {PART_KICKERS[part.part] ?? part.part}
                  </span>
                  <div className="mt-2 flex items-baseline gap-4">
                    <span className="font-stitch-display text-[48px] italic leading-none text-stitch-secondary/30">
                      {String(idx).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="font-stitch-display text-[24px] leading-tight text-stitch-primary">
                        {part.part}
                      </h2>
                      <p className="mt-1 font-stitch-body text-[14px] italic text-stitch-on-surface-variant">
                        {part.title}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`${AppRoute.CATECHISM}?p=${first}`}
                    className="mt-6 inline-flex items-center gap-2 border-b border-stitch-secondary/40 pb-0.5 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary transition-colors hover:border-stitch-secondary"
                  >
                    Abrir §{first}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </header>

                <div className="grid grid-cols-1 gap-4 md:col-span-8 md:grid-cols-2">
                  {part.sections.map((sec) => (
                    <Link
                      key={sec.id}
                      to={`${AppRoute.CATECHISM}?p=${sec.paragraphs[0]}`}
                      className="group flex flex-col justify-between border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest p-5 transition-all hover:border-stitch-secondary/50 hover:shadow-md"
                    >
                      <div>
                        <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                          §{sec.paragraphs[0]} – §{sec.paragraphs[1]}
                        </span>
                        <h3 className="mt-1 font-stitch-display text-[18px] leading-snug text-stitch-primary transition-colors group-hover:text-stitch-secondary">
                          {sec.title}
                        </h3>
                      </div>
                      <div className="mt-4 flex items-center justify-end text-stitch-secondary">
                        <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                      </div>
                    </Link>
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
      </main>
    </div>
  );
};

export default AtriumCatechismReader;
