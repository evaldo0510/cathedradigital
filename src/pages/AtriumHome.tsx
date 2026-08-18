/**
 * AtriumHome — Etapa 6 (reskin Stitch, tela 4 "Átrio" — versão completa).
 *
 * ONDA 1 — CERTIFIED (Design System Harmony Integration).
 * Substituídos tokens stitch-* por equivalentes semânticos do Design System
 * para garantir consistência visual e acessibilidade.
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
  Sparkles,
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
import { useAuth } from '@/hooks/useAuth';
import AtriumReception from '@/components/cathedra/AtriumReception';
import { SpaceDoors, type SpaceDoor, SpaceLayout, SpaceFooter } from '@/components/cathedra/space/SpaceLayout';


// ─── Copy oficial ────────────────────────────────────────────────────────────
const HERO_KICKER = 'Sanctuarium Digital';
const HERO_TITLE = 'Seu companheiro espiritual para a vida interior.';
const HERO_SUBTITLE =
  'Leia, reze, estude e descubra a riqueza da fé católica.';

const RESUME_ICON: Record<ResumeItem['kind'], React.ComponentType<{ className?: string }>> = {
  reading: MenuBook,
  study: AutoStories,
  formation: AutoStories,
  lectio: MenuBook,
  note: MenuBook,
  prayer: MenuBook,
};

// ─── 5 Ambientes (P4) — navegação canônica ──────────────────────────────────
const MAIN_DOORS: SpaceDoor[] = [
  { 
    key: 'orar', 
    label: 'ORAR', 
    overline: 'Oratio', 
    to: '/oracao', 
    Icon: Heart, 
    hint: 'Um espaço para silenciar e rezar.' 
  },
  { 
    key: 'estudar', 
    label: 'ESTUDAR', 
    overline: 'Studium', 
    to: '/biblioteca', 
    Icon: MenuBook, 
    hint: 'Conheça os tesouros da fé.' 
  },
  { 
    key: 'conhecer', 
    label: 'CONHECER', 
    overline: 'Cognoscere', 
    to: '/santos', 
    Icon: Sparkles, 
    hint: 'Descubra testemunhas da fé e da Igreja.' 
  },
  { 
    key: 'igreja', 
    label: 'IGREJA', 
    overline: 'Ecclesia', 
    to: '/igreja', 
    Icon: GraduationCap, 
    hint: 'Acompanhe a vida da Igreja.' 
  },
  { 
    key: 'minha-jornada', 
    label: 'MINHA JORNADA', 
    overline: 'Iter Meum', 
    to: '/minha-jornada', 
    Icon: RouteIcon, 
    hint: 'Veja por onde você passou e continue.' 
  },
];

const AtriumHome: React.FC = () => {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
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
    <SpaceLayout>
      <div
        className="w-full bg-background text-foreground"
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
        <link rel="canonical" href="https://www.cathedradigital.com.br/" />
        <meta property="og:title" content="Cathedra — Átrio" />
        <meta property="og:url" content="https://www.cathedradigital.com.br/" />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content="Um espaço sagrado para contemplar a Verdade através dos séculos."
        />
      </Helmet>

      <MobileTopBar kicker="Cathedra" title="Átrio" transparent />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(var(--bottom-nav-height)+var(--spacing-md)+2rem)] pt-6 md:px-16 md:pt-14 md:pb-16 animate-fade-in">
        {authenticated && <AtriumReception />}
        {/* ─── Hero editorial (visitantes) ─────────────────────────────── */}
        {!authenticated && (
        <section className="text-center md:text-left">
          <div className="mb-8 hidden h-px w-full bg-gold-text/30 md:block" />
          <h2 className="mb-3 font-reader text-[12px] font-bold uppercase tracking-[0.32em] text-gold-text">
            Pergunte sobre a fé.
          </h2>
          <h1 className="mb-3 font-display text-[32px] italic leading-[40px] text-primary md:text-[56px] md:leading-[64px] md:tracking-[-0.02em]">
            Seu companheiro espiritual para a vida interior.
          </h1>
          <p className="mb-8 max-w-2xl font-reader text-[20px] leading-[32px] text-muted-foreground md:mx-0 mx-auto">
            {HERO_SUBTITLE}
          </p>

          {/* Busca universal (P1) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(q);
            }}
            className="mx-auto flex max-w-2xl items-center gap-3 border-b-2 border-primary/80 pb-3 text-left focus-within:border-gold-text md:mx-0"
          >
            <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Digite sua pergunta..."
              aria-label="Pesquisa universal"
              className="w-full bg-transparent font-display text-[18px] italic text-primary placeholder:text-muted-foreground/60 focus:outline-none md:text-[22px]"
            />
            <button
              type="submit"
              className="font-reader text-[12px] font-bold uppercase tracking-[0.15em] text-gold-text hover:text-primary"
            >
              Buscar
            </button>
          </form>

          {suggestions.length > 0 && (
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center gap-2 text-left md:mx-0">
              <span className="font-reader text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Sugestões
              </span>
              {["O que a Igreja ensina sobre...?", "Encontre na Bíblia...", "Explique este parágrafo...", "Quem foi este santo?"].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => submitSearch(s)}
                  className="rounded-full border border-border/40 bg-accent px-3 py-1 font-reader text-[12px] text-muted-foreground transition-colors hover:border-gold-text hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Bento: Nexus + Liturgia */}
          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 md:grid-cols-12">
            {/* Nexus */}
            <article className="group relative flex h-96 flex-col justify-between overflow-hidden border border-gold-text/25 bg-accentest p-8 transition-all hover:bg-accent md:col-span-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'url("https://www.transparenttextures.com/patterns/parchment.png")',
                }}
              />
              <div className="relative z-10 text-left">
                <h2 className="mb-4 block font-reader text-[12px] font-bold uppercase tracking-[0.2em] text-gold-text">
                  NEXUS
                </h2>
                <h3 className="mb-4 font-display text-[32px] leading-[40px] text-primary">
                  "Por que isso está conectado?"
                </h3>
                <p className="max-w-md font-reader text-[18px] leading-[28px] text-muted-foreground">
                  O que está conectado, por que está conectado e para onde pode continuar.
                </p>
              </div>
              <div className="relative z-10 flex justify-end">
                <Link
                  to="/buscar"
                  className="inline-flex items-center gap-3 rounded-lg bg-gold px-8 py-3 font-reader text-[14px] font-medium uppercase tracking-[0.05em] text-gold-text-on-container transition-transform hover:scale-105 active:scale-95"
                  style={{
                    boxShadow:
                      '0 0 25px -5px hsl(var(--secondary) / 0.4)',
                  }}
                >
                  <Hub className="h-5 w-5" />
                  Explorar o Nexus
                </Link>
              </div>
              <div className="absolute left-0 top-0 h-0 w-1 bg-gold-text transition-all duration-500 group-hover:h-full" />
            </article>

            {/* Liturgia */}
            <article className="relative flex h-96 flex-col justify-between overflow-hidden border border-primary bg-primary p-8 text-primary-foreground md:col-span-4">
              <div className="relative z-10 text-left">
                <div className="mb-6 flex items-start justify-between">
                  <h2 className="font-reader text-[12px] font-bold uppercase tracking-[0.15em] text-gold-text-fixed">
                    Liturgia Diária
                  </h2>
                  <span className="text-xs opacity-60">{today}</span>
                </div>
                <h3 className="mb-4 font-display text-[28px] italic leading-tight text-primary-foreground">
                  {saintOfDay}
                </h3>
                <p className="font-reader text-[16px] italic leading-relaxed text-primary-foreground/90">
                  {saintQuote}
                </p>
                {liturgy?.season && (
                  <h2 className="mt-4 font-reader text-[11px] font-bold uppercase tracking-[0.15em] text-gold-text-fixed/80">
                    {liturgy.season} · {liturgy.weekday}
                  </h2>
                )}
              </div>
              <div className="relative z-10">
                <div className="mb-6 h-px w-full bg-card/10" />
                <Link
                  to="/liturgia"
                  className="flex items-center justify-between font-reader text-[14px] font-medium uppercase tracking-[0.05em] transition-colors hover:text-gold-text-fixed"
                >
                  <span>Ver Evangelho</span>
                  <ArrowForward className="h-5 w-5" />
                </Link>
              </div>
              <Sparkles className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rotate-12 opacity-10" />
            </article>
          </div>
        </section>
        )}

        {/* ─── Cinco Ambientes (Portas Principais) ────────────────────── */}
        <section className="mt-16">
          <SpaceDoors 
            title="ONDE VOCÊ QUER CAMINHAR HOJE?" 
            aside="Quinque Loca"
            doors={MAIN_DOORS}
            columns={5}
          />
        </section>

        {/* ─── Continuar Caminhada ────────────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="mb-1 font-display text-[24px] font-semibold leading-[32px] text-primary">
                Continuar Caminhada
              </h2>
              <div className="h-1 w-12 bg-gold-text/30" />
            </div>
            <Link
              to="/minha-jornada"
              className="font-reader text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
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
                  className="group border border-gold-text/25 bg-accent p-6 transition-all hover:shadow-xl hover:shadow-black/[0.04]"
                >
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-stitch-outline-variant/30 bg-card text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-reader text-[14px] font-medium text-primary">
                        {item.label}
                      </h3>
                      <h4 className="text-xs text-muted-foreground">
                        {item.kind}
                      </h4>
                    </div>
                  </div>
                  <div className="mb-4 h-1 w-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/95">
                    <span>{pct}%</span>
                    <span className="transition-colors group-hover:text-primary">
                      Retomar
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Nova meditação — sempre presente */}
            <Link
              to="/oracao"
              className="group flex cursor-pointer flex-col items-center justify-center border border-dashed border-gold-text/35 p-6 text-center transition-colors hover:bg-accent"
            >
              <AddCircle className="mb-2 h-8 w-8 text-muted-foreground/40 transition-colors group-hover:text-gold-text" />
              <p className="font-reader text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Nova Meditação
              </p>
            </Link>
          </div>
        </section>

        {/* ─── Recomendações (P5) ─────────────────────────────────────── */}
        {recs.length > 0 && (
          <section className="mt-16">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="font-display text-[24px] font-semibold leading-[32px] text-primary">
                Para você contemplar hoje
              </h2>
              <div className="h-px flex-1 bg-gold-text/20" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {recs.map((r, i) => (
                <Link
                  key={r.id}
                  to={r.targetPath}
                  className="group flex flex-col border border-border/20 bg-accentest p-6 transition-all hover:border-gold-text/40 hover:shadow-xl hover:shadow-black/[0.04]"
                >
                  <h3 className="font-reader text-[11px] font-bold uppercase tracking-[0.2em] text-gold-text">
                    {r.kind}
                  </h3>
                  <h3 className="mt-2 font-display text-[20px] leading-tight text-primary transition-colors group-hover:text-gold-text">
                    {r.label}
                  </h3>
                  <div className="mt-6 flex items-center justify-between text-gold-text">
                    <span className="font-display text-[24px] italic text-gold-text/75">
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
              <h2 className="shrink-0 font-display text-[32px] leading-[40px] text-primary">
                Temas em Destaque
              </h2>
              <div className="h-px flex-1 bg-gold-text/30" />
            </div>

            <div className="flex snap-x gap-8 overflow-x-auto pb-8 [&::-webkit-scrollbar]:hidden">
              {themes.map((theme, i) => (
                <Link
                  key={theme.slug}
                  to={`/buscar?tema=${encodeURIComponent(theme.slug)}`}
                  className="group min-w-[320px] shrink-0 snap-start cursor-pointer"
                >
                  <div className="relative mb-4 flex h-80 w-full items-center justify-center overflow-hidden bg-stitch-surface-container-high">
                    <span className="font-display text-[96px] italic text-primary/20">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute inset-0 bg-primary/10 transition-colors group-hover:bg-transparent" />
                  </div>
                  <h3 className="mb-1 font-display text-[24px] font-semibold leading-[32px] text-primary">
                    {theme.label}
                  </h3>
                  {theme.short && (
                    <p className="font-reader text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {theme.short}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <div className="flex items-center gap-spacing-lg mb-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40 whitespace-nowrap">
              IGREJA VIVA
            </h2>
            <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.08] to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 border border-border/20 bg-accent rounded-premium text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold-text block mb-2">SANTO DO DIA</span>
              <p className="font-display text-lg italic text-primary">{saintOfDay}</p>
            </div>
            <div className="p-6 border border-border/20 bg-accent rounded-premium text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold-text block mb-2">PAPA ATUAL</span>
              <p className="font-display text-lg italic text-primary">Francisco</p>
            </div>
            <div className="p-6 border border-border/20 bg-accent rounded-premium text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold-text block mb-2">LITURGIA</span>
              <p className="font-display text-lg italic text-primary">{liturgy?.weekday || 'Féria'}</p>
            </div>
            <div className="p-6 border border-border/20 bg-accent rounded-premium text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold-text block mb-2">CALENDÁRIO</span>
              <p className="font-display text-lg italic text-primary">{today}</p>
            </div>
          </div>
        </section>

        <SpaceFooter 
          note="O Mosteiro é um organismo vivo onde cada pedra conta uma história de santidade."
          links={[
            { label: 'Biblioteca', to: '/biblioteca', hint: 'Mosteiro do Conhecimento' },
            { label: 'Sacrário', to: '/oracao', hint: 'Silenciar e rezar' },
            { label: 'Capelas', to: '/santos', hint: 'Vidas dos santos' },
          ]}
        />
      </section>
    </div>

    <MobileBottomNav />
  </SpaceLayout>
);
};

export default AtriumHome;
