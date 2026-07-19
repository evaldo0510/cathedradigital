/**
 * AtriumBibliotecaPage — Etapa 2 (reskin Stitch, tela 3 "Biblioteca").
 *
 * Regras:
 *  - Reaproveita hooks reais (useBibliotecaRecents) — não duplica dados.
 *  - Usa somente tokens `stitch-*`.
 *  - Header/footer globais vêm do App shell.
 *  - A página completa antiga (tabs/favoritos/pesquisa avançada) fica em /biblioteca-legacy.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  BookMarked,
  BookOpen,
  Gavel,
  Sparkles,
  Network,
  ArrowRight,
  Search as SearchIcon,
} from 'lucide-react';
import { AppRoute } from '@/types';
import { useBibliotecaRecents } from '@/hooks/useBibliotecaState';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

type Collection = {
  title: string;
  meta: string;
  description: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const COLLECTIONS: Collection[] = [
  {
    title: 'Sagrada Escritura',
    meta: '73 Livros',
    description: 'Antigo e Novo Testamento, com anotações e Nexus contextual.',
    to: AppRoute.BIBLE,
    Icon: BookOpen,
  },
  {
    title: 'Catecismo',
    meta: '2865 Parágrafos',
    description: 'A doutrina da Igreja organizada e interconectada.',
    to: AppRoute.CATECHISM,
    Icon: BookMarked,
  },
  {
    title: 'Magistério',
    meta: 'Encíclicas e Constituições',
    description: 'Documentos pontifícios que definem o dogma através dos séculos.',
    to: AppRoute.MAGISTERIUM,
    Icon: Gavel,
  },
  {
    title: 'Santos & Padres',
    meta: 'Vida e Escritos',
    description: 'Testemunhos e obras dos Padres e Doutores da Igreja.',
    to: AppRoute.SAINTS,
    Icon: Sparkles,
  },
];

const AtriumBibliotecaPage: React.FC = () => {
  const recents = useBibliotecaRecents().recents.slice(0, 2);

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Cathedra — Biblioteca</title>
        <meta
          name="description"
          content="Navegue pelos ecos sagrados de dois milênios: dos Padres Apostólicos ao Magistério contemporâneo, a sabedoria curada da Igreja."
        />
        <meta property="og:title" content="Cathedra — Biblioteca" />
      </Helmet>

      <MobileTopBar kicker="Cathedra" title="Biblioteca" transparent />

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+2rem)] pt-6 md:px-16 md:pt-14 md:pb-16 animate-fade-in">
        {/* ─── Hero editorial ─────────────────────────────────────────── */}
        <section className="border-b border-stitch-secondary/10 pb-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="mb-2 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
                Archival Collection
              </span>
              <h1 className="font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
                Biblioteca
              </h1>
              <p className="mt-4 font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant">
                Navegue pelos ecos sagrados de dois milênios. Dos Padres
                Apostólicos ao Magistério contemporâneo, explore a sabedoria
                curada da Igreja.
              </p>
            </div>
            <Link
              to={AppRoute.BUSCAR}
              className="group relative flex w-full items-center gap-3 rounded-lg border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-4 py-2.5 text-[14px] font-medium text-stitch-on-surface-variant transition-all hover:border-stitch-secondary md:w-64"
            >
              <SearchIcon className="h-5 w-5 shrink-0" />
              <span className="font-stitch-body">Pesquisar o acervo…</span>
            </Link>
          </div>
        </section>

        {/* ─── Continue Reading ───────────────────────────────────────── */}
        {recents.length > 0 && (
          <section className="pt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                Continuar Leitura
              </h2>
              <Link
                to="/biblioteca-legacy"
                className="border-b border-stitch-secondary/30 pb-0.5 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary transition-colors hover:border-stitch-secondary"
              >
                Histórico
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {recents.map((r) => (
                <Link
                  key={r.id}
                  to={r.path}
                  className="group relative flex gap-6 overflow-hidden rounded border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-stitch-secondary transition-transform group-hover:scale-y-100" />
                  <div className="flex h-32 w-24 shrink-0 items-center justify-center bg-stitch-primary text-stitch-primary-foreground shadow-lg">
                    <BookOpen className="h-8 w-8 opacity-70" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                        {r.subtitle ?? 'Leitura'}
                      </span>
                      <h3 className="mt-1 font-stitch-display text-[20px] leading-tight text-stitch-primary">
                        {r.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 font-stitch-body text-[15px] text-stitch-on-surface-variant">
                        Retome de onde parou.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-stitch-surface-container-highest">
                        <div className="h-full w-1/3 bg-stitch-secondary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-stitch-secondary transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Coleções (museum cards) ─────────────────────────────── */}
        <section className="pt-16">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
              Coleções
            </h2>
            <div className="hidden h-px flex-1 bg-stitch-secondary/20 md:mx-8 md:block" />
            <span className="hidden font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant md:inline">
              04 Acervos
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {COLLECTIONS.map((c, i) => (
              <Link
                key={c.title}
                to={c.to}
                className="group flex cursor-pointer flex-col border border-stitch-outline-variant/10 bg-stitch-surface-container-lowest p-6 transition-all hover:border-stitch-secondary/40 hover:shadow-xl hover:shadow-black/[0.04]"
              >
                <div className="mb-6 flex aspect-[3/4] w-full items-center justify-center overflow-hidden border border-stitch-outline-variant/20 bg-stitch-surface">
                  <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-stitch-primary to-stitch-primary/70 text-stitch-primary-foreground transition-transform duration-700 group-hover:scale-105">
                    <span className="font-stitch-display text-[64px] italic text-stitch-secondary-fixed/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <c.Icon className="absolute h-10 w-10 opacity-80" />
                  </div>
                </div>
                <h3 className="font-stitch-display text-[20px] leading-tight text-stitch-primary transition-colors group-hover:text-stitch-secondary">
                  {c.title}
                </h3>
                <p className="mt-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                  {c.meta}
                </p>
                <p className="mt-4 font-stitch-body text-[14px] leading-relaxed text-stitch-on-surface-variant">
                  {c.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Weekly Discoveries — bento assimétrico ─────────────── */}
        <section className="pt-16">
          <h2 className="mb-10 font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
            Descobertas da Semana
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Featured */}
            <Link
              to={AppRoute.BUSCAR}
              className="group relative flex h-[400px] items-end overflow-hidden bg-stitch-primary p-10 md:col-span-8"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    'url("https://www.transparenttextures.com/patterns/parchment.png")',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stitch-primary via-stitch-primary/40 to-transparent" />
              <div className="relative z-10 max-w-xl text-stitch-primary-foreground">
                <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-secondary-fixed">
                  Tema em Destaque
                </span>
                <h3 className="mt-2 font-stitch-display text-[32px] italic leading-tight md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
                  A Arquitetura do Silêncio
                </h3>
                <p className="mt-4 font-stitch-body text-[18px] leading-[28px] opacity-80">
                  Como os espaços monásticos espelham a paisagem interior da
                  oração contemplativa.
                </p>
                <span className="mt-8 inline-block border border-stitch-secondary-fixed px-6 py-2 font-stitch-body text-[14px] font-medium uppercase tracking-[0.1em] text-stitch-secondary-fixed transition-all group-hover:bg-stitch-secondary-fixed group-hover:text-stitch-primary">
                  Explorar Série
                </span>
              </div>
            </Link>

            {/* Secondary column */}
            <div className="flex flex-col gap-8 md:col-span-4">
              <Link
                to={AppRoute.SAINTS}
                className="group flex flex-1 cursor-pointer flex-col justify-between border border-stitch-outline-variant/30 bg-stitch-surface-container p-8 transition-colors hover:border-stitch-secondary"
              >
                <div>
                  <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary">
                    Autor em Foco
                  </span>
                  <h4 className="mt-2 font-stitch-display text-[20px] leading-tight text-stitch-primary">
                    Santa Teresa d'Ávila
                  </h4>
                </div>
                <p className="font-stitch-body text-[14px] italic text-stitch-on-surface-variant">
                  "Nada te turbe, nada te espante..."
                </p>
                <div className="mt-4 flex items-center justify-end text-stitch-secondary">
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                to={AppRoute.MAGISTERIUM}
                className="group relative flex flex-1 cursor-pointer flex-col justify-between overflow-hidden border border-white/10 bg-stitch-tertiary p-8 text-white"
              >
                <div className="relative z-10">
                  <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary-fixed">
                    Arquivo Visual
                  </span>
                  <h4 className="mt-2 font-stitch-display text-[20px] leading-tight text-stitch-secondary-fixed">
                    Iluminuras Sacras
                  </h4>
                </div>
                <p className="relative z-10 font-stitch-body text-[14px] text-white/70">
                  Manuscritos litúrgicos do século XIV digitalizados.
                </p>
                <div className="relative z-10 mt-4 flex items-center justify-end text-stitch-secondary-fixed">
                  <Network className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AtriumBibliotecaPage;
