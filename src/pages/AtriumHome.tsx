/**
 * AtriumHome — Etapa 1 (reskin Stitch, tela 4 "Átrio").
 *
 * Regras:
 *  - Não substitui lógica: consome os mesmos hooks do Átrio (useResume, useLiturgyToday,
 *    useFeaturedThemes) para preservar dados reais.
 *  - Reaproveita o header/footer globais renderizados pelo App shell.
 *  - Usa somente tokens `stitch-*` (design system oficial do reskin).
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Hub, ArrowForward, MenuBook, AutoStories, AddCircle, AutoAwesome } from '@/components/editorial/Icon';
import {
  useResume,
  useLiturgyToday,
  useFeaturedThemes,
} from '@/modules/atrium/hooks';
import type { ResumeItem } from '@/modules/atrium/types';

// ─── Copy oficial ────────────────────────────────────────────────────────────
const HERO_KICKER = 'Sanctuarium Digital';
const HERO_TITLE = 'Entrai no Silêncio';
const HERO_SUBTITLE =
  'A biblioteca viva da Tradição. Um espaço sagrado para contemplar a Verdade através dos séculos.';

const RESUME_ICON: Record<ResumeItem['kind'], React.ComponentType<{ className?: string }>> = {
  reading: MenuBook,
  study: AutoStories,
  formation: AutoStories,
  lectio: MenuBook,
  note: MenuBook,
  prayer: MenuBook,
};

const AtriumHome: React.FC = () => {
  const resume = useResume().slice(0, 2);
  const liturgy = useLiturgyToday();
  const themes = useFeaturedThemes().slice(0, 3);

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const saintOfDay =
    liturgy?.saintOfDay?.name ?? 'Natividade de São João Batista';
  const saintQuote = '"Ele deve crescer, eu devo diminuir."';

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Cathedra — Átrio</title>
        <meta
          name="description"
          content="Entrai no silêncio. A biblioteca viva da Tradição: leitura, oração, formação e pesquisa em um só lugar."
        />
        <meta property="og:title" content="Cathedra — Átrio" />
        <meta
          property="og:description"
          content="Um espaço sagrado para contemplar a Verdade através dos séculos."
        />
      </Helmet>

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-10 md:px-16 md:pt-14 animate-fade-in">
        {/* ─── Hero editorial ─────────────────────────────────────────── */}
        <section className="text-center md:text-left">
          <div className="mb-8 hidden h-px w-full bg-stitch-secondary/30 md:block" />
          <p className="mb-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
            {HERO_KICKER}
          </p>
          <h1 className="mb-3 font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
            {HERO_TITLE}
          </h1>
          <p className="mb-12 max-w-2xl font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant md:mx-0 mx-auto">
            {HERO_SUBTITLE}
          </p>

          {/* Bento: Nexus + Liturgia */}
          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-12">
            {/* Nexus */}
            <article className="group relative flex h-96 flex-col justify-between overflow-hidden border border-[hsl(var(--stitch-secondary)/0.25)] bg-stitch-surface-container-lowest p-8 transition-all hover:bg-stitch-surface-container-low md:col-span-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'url("https://www.transparenttextures.com/patterns/parchment.png")',
                }}
              />
              <div className="relative z-10 text-left">
                <span className="mb-4 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                  Symmetry of Truth
                </span>
                <h2 className="mb-4 font-stitch-display text-[32px] leading-[40px] text-stitch-primary">
                  The Nexus Map
                </h2>
                <p className="max-w-md font-stitch-body text-[18px] leading-[28px] text-stitch-on-surface-variant">
                  Visualize as conexões invisíveis entre a Patrística e o
                  Magistério contemporâneo através da nossa rede semântica
                  inteligente.
                </p>
              </div>
              <div className="relative z-10 flex justify-end">
                <Link
                  to="/buscar"
                  className="inline-flex items-center gap-3 rounded-lg bg-stitch-secondary-container px-8 py-3 font-stitch-body text-[14px] font-medium uppercase tracking-[0.05em] text-stitch-secondary-on-container transition-transform hover:scale-105 active:scale-95"
                  style={{
                    boxShadow:
                      '0 0 25px -5px hsl(var(--stitch-secondary-fixed-dim) / 0.4)',
                  }}
                >
                  <Hub className="h-5 w-5" />
                  Explorar o Nexus
                </Link>
              </div>
              <div className="absolute left-0 top-0 h-0 w-1 bg-stitch-secondary transition-all duration-500 group-hover:h-full" />
            </article>

            {/* Liturgia */}
            <article className="relative flex h-96 flex-col justify-between overflow-hidden border border-stitch-primary-container bg-stitch-primary p-8 text-stitch-primary-foreground md:col-span-4">
              <div className="relative z-10 text-left">
                <div className="mb-6 flex items-start justify-between">
                  <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary-fixed">
                    Liturgia Diária
                  </span>
                  <span className="text-xs opacity-60">{today}</span>
                </div>
                <h3 className="mb-4 font-stitch-display text-[28px] italic leading-tight">
                  {saintOfDay}
                </h3>
                <p className="font-stitch-body text-[16px] italic leading-relaxed opacity-80">
                  {saintQuote}
                </p>
              </div>
              <div className="relative z-10">
                <div className="mb-6 h-px w-full bg-white/10" />
                <Link
                  to="/rezar"
                  className="flex items-center justify-between font-stitch-body text-[14px] font-medium uppercase tracking-[0.05em] transition-colors hover:text-stitch-secondary-fixed"
                >
                  <span>Ver leituras</span>
                  <ArrowForward className="h-5 w-5" />
                </Link>
              </div>
              <AutoAwesome className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rotate-12 opacity-10" />
            </article>
          </div>
        </section>

        {/* ─── Continuar Caminhada ────────────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="mb-1 font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                Continuar Caminhada
              </h2>
              <div className="h-1 w-12 bg-stitch-secondary/30" />
            </div>
            <Link
              to="/minha-jornada"
              className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant transition-colors hover:text-stitch-primary"
            >
              Ver Histórico
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {resume.map((item) => {
              const Icon = RESUME_ICON[item.kind] ?? MenuBook;
              const pct = Math.max(0, Math.min(100, item.progressPct ?? 0));
              return (
                <Link
                  key={item.id}
                  to={item.targetPath}
                  className="group border border-[hsl(var(--stitch-secondary)/0.25)] bg-stitch-surface-container-low p-6 transition-all hover:shadow-xl hover:shadow-black/[0.04]"
                >
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-stitch-outline-variant/30 bg-white text-stitch-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-stitch-body text-[14px] font-medium text-stitch-primary">
                        {item.label}
                      </h4>
                      <p className="text-xs text-stitch-on-surface-variant">
                        {item.kind}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 h-1 w-full bg-stitch-surface-container-highest">
                    <div
                      className="h-full bg-stitch-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter text-stitch-on-surface-variant/70">
                    <span>{pct}%</span>
                    <span className="transition-colors group-hover:text-stitch-primary">
                      Retomar
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Nova meditação — sempre presente */}
            <Link
              to="/rezar"
              className="group flex cursor-pointer flex-col items-center justify-center border border-dashed border-[hsl(var(--stitch-secondary)/0.35)] p-6 text-center transition-colors hover:bg-stitch-surface-container-low"
            >
              <AddCircle className="mb-2 h-8 w-8 text-stitch-on-surface-variant/40 transition-colors group-hover:text-stitch-secondary" />
              <p className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                Nova Meditação
              </p>
            </Link>
          </div>
        </section>

        {/* ─── Temas em Destaque ──────────────────────────────────────── */}
        {themes.length > 0 && (
          <section className="mt-16 overflow-hidden">
            <div className="mb-10 flex items-center gap-4">
              <h2 className="shrink-0 font-stitch-display text-[32px] leading-[40px] text-stitch-primary">
                Temas em Destaque
              </h2>
              <div className="h-px flex-1 bg-stitch-secondary/30" />
            </div>

            <div className="flex snap-x gap-8 overflow-x-auto pb-8 [&::-webkit-scrollbar]:hidden">
              {themes.map((theme, i) => (
                <Link
                  key={theme.slug}
                  to={`/buscar?tema=${encodeURIComponent(theme.slug)}`}
                  className="group min-w-[320px] shrink-0 snap-start cursor-pointer"
                >
                  <div className="relative mb-4 flex h-80 w-full items-center justify-center overflow-hidden bg-stitch-surface-container-high">
                    <span className="font-stitch-display text-[96px] italic text-stitch-primary/20">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute inset-0 bg-stitch-primary/10 transition-colors group-hover:bg-transparent" />
                  </div>
                  <h3 className="mb-1 font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                    {theme.label}
                  </h3>
                  {theme.short && (
                    <p className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                      {theme.short}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AtriumHome;
