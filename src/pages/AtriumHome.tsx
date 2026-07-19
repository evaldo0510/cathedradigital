/**
 * AtriumHome — Etapa 6 (reskin Stitch, tela 4 "Átrio" — versão completa).
 *
 * Diferenças vs Etapa 1:
 *  - Barra de busca universal (P1) no hero + chips de sugestões.
 *  - Bloco "Cinco Ambientes" (P4) — navegação canônica do Cathedra.
 *  - Recomendações personalizadas (P5).
 *  - Avisos recentes (P6).
 *  - Verso litúrgico de encerramento.
 *
 * Regras mantidas:
 *  - Só consome hooks oficiais do módulo `@/modules/atrium/hooks`.
 *  - Nada de fetch, Supabase ou React Query direto.
 *  - Somente tokens `stitch-*` no CSS.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Network as Hub,
  ArrowRight as ArrowForward,
  BookOpen as MenuBook,
  BookMarked as AutoStories,
  PlusCircle as AddCircle,
  Sparkles as AutoAwesome,
  Search as SearchIcon,
  Compass,
  Heart,
  GraduationCap,
  Route as RouteIcon,
  Megaphone,
} from 'lucide-react';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import {
  useResume,
  useLiturgyToday,
  useFeaturedThemes,
  useSearchSuggestions,
  useRecommendations,
  useAnnouncements,
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

// ─── 5 Ambientes (P4) — navegação canônica ──────────────────────────────────
const ENVIRONMENTS: {
  key: string;
  label: string;
  latin: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { key: 'estudar', label: 'Estudar', latin: 'Studium', to: '/biblioteca', Icon: MenuBook, hint: 'Escritura, Catecismo, Magistério' },
  { key: 'rezar', label: 'Rezar', latin: 'Oratio', to: '/rezar', Icon: Heart, hint: 'Liturgia, Lectio, oração diária' },
  { key: 'formar-se', label: 'Formar-se', latin: 'Formatio', to: '/jornadas', Icon: GraduationCap, hint: 'Trilhas guiadas de formação' },
  { key: 'pesquisar', label: 'Pesquisar', latin: 'Quaerere', to: '/buscar', Icon: SearchIcon, hint: 'Busca universal no acervo' },
  { key: 'minha-jornada', label: 'Minha Jornada', latin: 'Iter Meum', to: '/minha-jornada', Icon: RouteIcon, hint: 'Progresso, favoritos, notas' },
];

const AtriumHome: React.FC = () => {
  const navigate = useNavigate();
  const resume = useResume().slice(0, 2);
  const liturgy = useLiturgyToday();
  const themes = useFeaturedThemes().slice(0, 3);
  const suggestions = useSearchSuggestions().slice(0, 5);
  const recs = useRecommendations().slice(0, 3);
  const announcements = useAnnouncements().slice(0, 3);

  const [q, setQ] = useState('');

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const saintOfDay =
    liturgy?.saintOfDay?.name ?? 'Natividade de São João Batista';
  const saintQuote = '"Ele deve crescer, eu devo diminuir."';

  const submitSearch = (value: string) => {
    const v = value.trim();
    if (v.length < 2) return;
    navigate(`/buscar?q=${encodeURIComponent(v)}`);
  };

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

      <MobileTopBar kicker="Cathedra" title="Átrio" transparent />

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+2rem)] pt-6 md:px-16 md:pt-14 md:pb-16 animate-fade-in">
        {/* ─── Hero editorial ─────────────────────────────────────────── */}
        <section className="text-center md:text-left">
          <div className="mb-8 hidden h-px w-full bg-stitch-secondary/30 md:block" />
          <p className="mb-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
            {HERO_KICKER}
          </p>
          <h1 className="mb-3 font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
            {HERO_TITLE}
          </h1>
          <p className="mb-8 max-w-2xl font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant md:mx-0 mx-auto">
            {HERO_SUBTITLE}
          </p>

          {/* Busca universal (P1) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(q);
            }}
            className="mx-auto flex max-w-2xl items-center gap-3 border-b-2 border-stitch-primary/80 pb-3 text-left focus-within:border-stitch-secondary md:mx-0"
          >
            <SearchIcon className="h-5 w-5 shrink-0 text-stitch-on-surface-variant" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que buscais nesta hora?"
              aria-label="Pesquisa universal"
              className="w-full bg-transparent font-stitch-display text-[18px] italic text-stitch-primary placeholder:text-stitch-on-surface-variant/60 focus:outline-none md:text-[22px]"
            />
            <button
              type="submit"
              className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary hover:text-stitch-primary"
            >
              Buscar
            </button>
          </form>

          {suggestions.length > 0 && (
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center gap-2 text-left md:mx-0">
              <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                Sugestões
              </span>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => submitSearch(s.label)}
                  className="rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-low px-3 py-1 font-stitch-body text-[12px] text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary hover:text-stitch-primary"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Bento: Nexus + Liturgia */}
          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 md:grid-cols-12">
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
                <h3 className="mb-4 font-stitch-display text-[28px] italic leading-tight text-stitch-primary-foreground">
                  {saintOfDay}
                </h3>
                <p className="font-stitch-body text-[16px] italic leading-relaxed text-stitch-primary-foreground/90">
                  {saintQuote}
                </p>
                {liturgy?.season && (
                  <p className="mt-4 font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-secondary-fixed/80">
                    {liturgy.season} · {liturgy.weekday}
                  </p>
                )}
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

        {/* ─── Cinco Ambientes (P4) ──────────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-8 flex items-center gap-4">
            <Compass className="h-5 w-5 text-stitch-secondary" />
            <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
              Cinco Ambientes
            </h2>
            <div className="h-px flex-1 bg-stitch-secondary/20" />
            <span className="hidden font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant md:inline">
              Quinque Loca
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
            {ENVIRONMENTS.map((env, i) => (
              <Link
                key={env.key}
                to={env.to}
                className="group relative flex flex-col border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest p-5 transition-all hover:border-stitch-secondary/40 hover:shadow-lg hover:shadow-black/[0.05]"
              >
                <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-stitch-secondary transition-transform group-hover:scale-y-100" />
                <div className="mb-4 flex items-center justify-between">
                  <env.Icon className="h-6 w-6 text-stitch-secondary" />
                  <span className="font-stitch-display text-[24px] italic text-stitch-secondary/25">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <span className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                  {env.latin}
                </span>
                <h3 className="mt-0.5 font-stitch-display text-[20px] leading-tight text-stitch-primary transition-colors group-hover:text-stitch-secondary">
                  {env.label}
                </h3>
                <p className="mt-2 font-stitch-body text-[12px] leading-snug text-stitch-on-surface-variant">
                  {env.hint}
                </p>
              </Link>
            ))}
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

        {/* ─── Recomendações (P5) ─────────────────────────────────────── */}
        {recs.length > 0 && (
          <section className="mt-16">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                Para você contemplar hoje
              </h2>
              <div className="h-px flex-1 bg-stitch-secondary/20" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {recs.map((r, i) => (
                <Link
                  key={r.id}
                  to={r.targetPath}
                  className="group flex flex-col border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest p-6 transition-all hover:border-stitch-secondary/40 hover:shadow-xl hover:shadow-black/[0.04]"
                >
                  <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                    {r.kind}
                  </span>
                  <h3 className="mt-2 font-stitch-display text-[20px] leading-tight text-stitch-primary transition-colors group-hover:text-stitch-secondary">
                    {r.label}
                  </h3>
                  <div className="mt-6 flex items-center justify-between text-stitch-secondary">
                    <span className="font-stitch-display text-[24px] italic text-stitch-secondary/25">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <ArrowForward className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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

        {/* ─── Avisos (P6) ────────────────────────────────────────────── */}
        {announcements.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center gap-4">
              <Megaphone className="h-5 w-5 text-stitch-secondary" />
              <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                Avisos Recentes
              </h2>
              <div className="h-px flex-1 bg-stitch-secondary/20" />
            </div>
            <ul className="divide-y divide-stitch-outline-variant/20 border-y border-stitch-outline-variant/20">
              {announcements.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-4">
                  <span className="font-stitch-body text-[15px] text-stitch-primary">
                    {a.label}
                  </span>
                  <span className="shrink-0 font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                    {new Date(a.publishedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─── Verso de encerramento ──────────────────────────────────── */}
        <p className="mt-16 border-t border-stitch-secondary/10 pt-8 text-center font-stitch-body text-[14px] italic text-stitch-on-surface-variant">
          "Uma coisa peço ao Senhor, e a buscarei: habitar na Casa do Senhor
          todos os dias da minha vida." — Sl 27,4
        </p>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AtriumHome;
