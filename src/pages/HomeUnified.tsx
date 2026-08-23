/**
 * HomeUnified — Sprint Visual 3.0, Turno 2.
 * Redesigned for "Mosteiro Digital" Premium Aesthetics.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  BookOpen,
  HandHeart,
  GraduationCap,
  SearchCode,
  Compass,
  Search as SearchIcon,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { Icons } from '@/constants';
import { EnvironmentRegistry, RouteRegistry } from '@/core/navigation';
import {
  useResume,
  useLiturgyToday,
  useAnnouncements,
  useFeaturedThemes,
  useSearchSuggestions,
} from '@/modules/atrium/hooks';
import { useSpiritualJourney } from '@/hooks/useSpiritualJourney';
import { useAuth } from '@/hooks/useAuth';

import { useAvatarUrl } from '@/lib/avatar';
import type { ResumeItem } from '@/modules/atrium/types';

// ─── Ícones dos 5 ambientes ──────────────────────────────────────────────────
const ENV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  HandHeart,
  GraduationCap,
  SearchCode,
  Compass,
};

// ─── Traduções e helpers ─────────────────────────────────────────────────────
const RESUME_KIND_LABEL: Record<ResumeItem['kind'], string> = {
  reading:   'Leitura',
  study:     'Estudo',
  formation: 'Formação',
  lectio:    'Lectio',
  note:      'Nota',
  prayer:    'Oração',
};

/** Formata uma data ISO em rótulo relativo curto ("Hoje", "Ontem", "3 dias"). */
function formatRelativeDate(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffDays = Math.floor((Date.now() - then) / 86_400_000);
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 30) return `${diffDays} dias`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
    return `${Math.floor(diffDays / 365)} anos`;
  } catch {
    return '';
  }
}

/** Capitaliza a primeira letra (para weekday minúsculo vindo do adapter). */
const rise: any = {
  hidden: { 
    opacity: 0, 
    y: 30,
  },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.15,
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};


function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}


// ─── Primitivas locais ───────────────────────────────────────────────────────
const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span
    className={`inline-block text-[10px] font-medium tracking-[0.28em] uppercase ${className}`}
    style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}
  >
    {children}
  </span>
);

const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px w-full ${className}`} style={{ background: 'var(--noir-line)' }} />
);

// ─── Componente principal ────────────────────────────────────────────────────
const HomeUnified: React.FC = () => {
  const environments = EnvironmentRegistry.all();
  const resume = useResume();
  const liturgy = useLiturgyToday();
  const news = useAnnouncements();
  const themes = useFeaturedThemes();
  const suggestions = useSearchSuggestions();
  const { lastRead, dailySteps } = useSpiritualJourney();
  const { profile, authenticated } = useAuth();
  const avatarDisplay = useAvatarUrl(profile?.avatar_url || null, 160);

  // Primeiro tema como destaque; fallback silencioso se lista vazia.
  const featured = themes[0];
  
  



  return (
    <div className="cathedra-noir min-h-screen w-full selection:bg-gold/30 selection:text-noir-bg">
      <Helmet>
        <title>Cathedra — Onde a Tradição Encontra o Silêncio</title>
        <meta name="description" content="Sanctuarium Digital: o ecossistema espiritual vivo para sua caminhada cristã." />

        <meta property="og:title" content="Cathedra — Ecossistema Espiritual Vivo" />
        <meta property="og:description" content="Mais que um aplicativo, um mosteiro digital onde cada leitura conduz a uma nova descoberta espiritual." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* ══════ HERO (100vh) — O Companheiro Espiritual ══════ */}
      <section className="relative flex min-h-[95vh] w-full flex-col items-center justify-center px-6 py-16 md:px-12">
        {/* Halo dourado sutil com movimento orgânico */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 50%, var(--gold) 0%, transparent 70%)',
              filter: 'blur(80px)',
              transform: 'scale(1.2)',
            }}
          />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, transparent, var(--gold), transparent)',
              filter: 'blur(100px)',
              animation: 'spin 60s linear infinite',
            }}
          />
        </div>

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">
          <motion.div variants={rise} initial="hidden" animate="show" custom={0} className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-gold/20 scale-150 animate-pulse" />
              <Icons.Logo className="w-24 h-24 text-gold relative z-10 drop-shadow-[0_0_15px_rgba(201,168,76,0.5)]" />
            </div>
          </motion.div>
          
          <motion.div variants={rise} initial="hidden" animate="show" custom={1} className="mb-6 flex flex-col items-center">
            <Eyebrow className="mb-4 text-gold-light brightness-125">Sanctuarium Digital</Eyebrow>
            <h1
              className="leading-[0.9] tracking-[-0.02em]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 'clamp(4rem, 15vw, 11rem)',
                color: 'var(--noir-text)',
                textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              CATHEDRA
            </h1>
          </motion.div>

          <motion.p
            variants={rise} initial="hidden" animate="show" custom={2}
            className="mx-auto max-w-2xl px-4 text-xl italic leading-relaxed md:text-3xl text-balance"
            style={{ 
              fontFamily: "var(--font-display)", 
              color: 'var(--noir-text-muted)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            "Onde a Tradição encontra o silêncio e o conhecimento se torna contemplação."
          </motion.p>

          {/* Busca Premium */}
          <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-16 w-full max-w-3xl md:mt-24">

            <div
              className="group relative flex items-center gap-4 rounded-premium border px-8 py-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(201,168,76,0.2)]"
              style={{
                borderColor: 'var(--noir-line-strong)',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <SearchIcon className="h-6 w-6 shrink-0 transition-transform group-focus-within:scale-110" style={{ color: 'var(--gold)' }} aria-hidden />
              <input
                id="home-search"
                type="text"
                placeholder="O que deseja descobrir hoje?"
                className="w-full bg-transparent text-lg md:text-2xl outline-none placeholder:italic"
                style={{
                  color: 'var(--noir-text)',
                  fontFamily: "var(--font-display)",
                }}
              />
              <div className="flex items-center gap-2">
                <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-noir-line px-2 py-1 text-[10px] tracking-widest text-noir-text-faint">
                  <span>⌘</span><span>K</span>
                </kbd>
                <button className="bg-gold hover:bg-gold-light text-noir-bg px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all">
                  Explorar
                </button>
              </div>
            </div>

            {/* Sugestões Contextuais */}
            {suggestions.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {suggestions.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    to={`/buscar?q=${encodeURIComponent(s.label)}`}
                    className="rounded-full border border-noir-line bg-noir-surface/50 px-5 py-2 text-xs tracking-widest transition-all hover:border-gold hover:text-gold hover:bg-gold/5"
                    style={{ color: 'var(--noir-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>


          <div className="mt-20 md:mt-32 flex flex-col items-center gap-4 animate-bounce opacity-40">
            <span className="text-[10px] tracking-[0.4em] uppercase text-gold">Descender</span>
            <div className="h-24 w-px bg-gradient-to-b from-gold via-gold/50 to-transparent" />
          </div>
        </div>
      </section>


      {/* ══════ FASE 8: COMPANHEIRO ESPIRITUAL — O Plano de Hoje ══════ */}
      <section className="relative w-full border-t px-6 py-20 md:px-12 md:py-32" style={{ borderColor: 'var(--noir-line)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col items-center text-center">
            <Eyebrow className="mb-4">Sua caminhada</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-display text-noir-text">Sua Caminhada Espiritual</h2>
            <p className="mt-4 text-noir-text-muted font-serif italic">"In te, Domine, speravi; non confundar in aeternum."</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Coluna Principal: O Itinerário de Hoje */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailySteps.map((step, idx) => (
                  <Link 
                    key={idx} 
                    to={step.href}
                    className="group relative overflow-hidden rounded-premium border border-primary/5 bg-card/40 p-6 shadow-premium-sm transition-all hover:border-gold/20 hover:shadow-premium"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl" aria-hidden="true">{step.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold">{step.category}</span>
                          <ArrowUpRight className="h-3 w-3 text-gold/20 group-hover:text-gold transition-colors" />
                        </div>
                        <h3 className="text-lg font-medium text-noir-text group-hover:text-gold-light transition-colors">{step.label}</h3>
                        <p className="mt-1 text-xs text-noir-text-muted leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Nexus Insight — O Bibliotecário Monástico */}
              <div className="rounded-premium bg-gold/5 border border-gold/10 p-8 flex gap-6 items-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Icons.Logo className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">Nexus Intelligence</p>
                  <p className="text-sm italic font-serif leading-relaxed text-noir-text-muted">
                    "Este trecho aparece porque São João Paulo II cita diretamente Santo Agostinho em sua encíclica sobre a fé. A ligação entre eles explica a profundidade do parágrafo do Catecismo que você leu ontem."
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna Lateral: Memória da Caminhada */}
            <aside className="lg:col-span-4 space-y-8">
              {lastRead ? (
                <div className="border border-gold/10 rounded-premium bg-noir-surface p-6 shadow-premium">
                  <Eyebrow className="mb-4">Retomar Leitura</Eyebrow>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-noir-text-faint uppercase tracking-widest">Vovê parou em:</p>
                      <h3 className="text-base font-medium text-noir-text truncate">{lastRead.label || 'Última leitura'}</h3>
                    </div>
                  </div>
                  <Link 
                    to={lastRead.url || '#'} 
                    className="flex items-center justify-center w-full py-3 bg-gold text-noir-bg rounded-premium-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Abrir agora
                  </Link>
                </div>
              ) : (
                <div className="border border-primary/5 rounded-premium bg-card/40 p-6 text-center">
                  <Icons.History className="w-8 h-8 text-gold/20 mx-auto mb-3" />
                  <p className="text-xs text-noir-text-muted">Inicie uma nova leitura para que possamos guardar seu progresso.</p>
                </div>
              )}

              <div className="p-6 border border-primary/5 rounded-premium bg-card/40">
                <div className="flex items-center justify-between mb-6">
                  <Eyebrow>Sua Ofensiva</Eyebrow>
                  <span className="text-lg">🔥</span>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-display font-medium text-noir-text">{profile?.streak || 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold mt-2">Dias consecutivos</p>
                </div>
              </div>

              <div className="p-6 border border-gold/10 rounded-premium bg-noir-surface">
                <div className="flex items-center gap-3 mb-4">
                  <Icons.Star className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-noir-text">Destaque Monástico</span>
                </div>
                <p className="text-sm italic font-serif text-gold-light leading-relaxed">
                  "O hábito de orar é o hábito de estar na presença de Deus."
                </p>
                <Link to="/itineraria" className="mt-4 block text-[10px] uppercase tracking-widest text-noir-text-faint hover:text-gold transition-colors">
                  Iniciar novo Itinerário →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ══════ 5 AMBIENTES CANÔNICOS ══════ */}
      <section className="relative w-full border-t px-0 py-24 md:py-32" style={{ borderColor: 'var(--noir-line)' }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="mb-16 flex flex-col items-center text-center">
            <Eyebrow className="mb-4">Os cinco ambientes</Eyebrow>
            <h2
              className="text-3xl md:text-5xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                color: 'var(--noir-text)',
                letterSpacing: '0.01em',
              }}
            >
              Por onde deseja entrar?
            </h2>
          </div>
        </div>

        {/* Grade full-width com hairlines douradas */}
        <div
          className="mx-auto grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          style={{ borderTop: '1px solid var(--noir-line)', borderBottom: '1px solid var(--noir-line)' }}
        >
          {environments.map((env, i) => {
            const Icon = ENV_ICONS[env.iconToken] ?? BookOpen;
            const roman = ['I', 'II', 'III', 'IV', 'V'][i];
            return (
              <Link
                key={env.key}
                to={RouteRegistry.resolve(env.route)}
                data-testid="atrium-block"
                data-atrium-key={env.key}
                className="group relative flex min-h-[280px] flex-col justify-between p-8 transition-colors duration-500 md:min-h-[360px] md:p-10 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--gold)] focus-visible:z-10 hover:bg-[var(--noir-surface)] active:bg-[var(--noir-surface)] active:brightness-110"
                style={{
                  borderRight: '1px solid var(--noir-line)',
                  borderBottom: '1px solid var(--noir-line)',
                }}
              >
                <div className="flex items-start justify-between">
                  <Icon className="h-7 w-7 transition-colors" style={{ color: 'var(--gold)' }} aria-hidden />
                  <span
                    className="text-xs tracking-[0.3em]"
                    style={{ color: 'var(--noir-text-faint)', fontFamily: "var(--font-display)" }}
                  >
                    {roman}
                  </span>
                </div>

                <div>
                  <h3
                    className="mb-3 text-2xl md:text-3xl"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      color: 'var(--noir-text)',
                    }}
                  >
                    {env.label}
                  </h3>
                  <p
                    className="mb-6 text-sm leading-relaxed"
                    style={{ color: 'var(--noir-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {env.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] transition-transform group-hover:translate-x-1"
                    style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}
                  >
                    Entrar <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════ TEMA EM DESTAQUE ══════ */}
      {featured && (
        <section className="relative w-full px-6 py-28 md:px-12 md:py-40" style={{ background: 'var(--noir-surface)' }}>
          <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
            <Eyebrow className="mb-6">Tema em destaque</Eyebrow>
            <h2
              className="mb-8"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                lineHeight: 1.05,
                color: 'var(--noir-text)',
                letterSpacing: '0.01em',
              }}
            >
              {featured.label}
            </h2>
            {featured.short && (
              <p
                className="mb-12 max-w-2xl text-lg italic md:text-2xl"
                style={{ fontFamily: "var(--font-display)", color: 'var(--noir-text-muted)' }}
              >
                {featured.short}
              </p>
            )}
            <Link
              to={`/buscar?q=${encodeURIComponent(featured.label)}`}
              className="group inline-flex items-center gap-3 border px-8 py-4 text-xs uppercase tracking-[0.28em] transition-all hover:gap-5"
              style={{
                borderColor: 'var(--gold)',
                color: 'var(--gold)',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#0a0a0a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--gold)';
              }}
            >
              Começar Estudo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>

            {/* Chips com outros temas em destaque (se houver) */}
            {themes.length > 1 && (
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {themes.slice(1, 6).map((t) => (
                  <Link
                    key={t.slug}
                    to={`/buscar?q=${encodeURIComponent(t.label)}`}
                    className="rounded-full border px-4 py-2 text-xs tracking-widest transition-colors"
                    style={{ borderColor: 'var(--noir-line)', color: 'var(--noir-text-muted)', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--noir-line)'; e.currentTarget.style.color = 'var(--noir-text-muted)'; }}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}



      {/* ══════ CONTINUAR CAMINHADA ══════ */}
      {/* ══════ CONTINUAR CAMINHADA ══════ */}
      {resume.length > 0 && (
        <section className="w-full border-t px-6 py-24 md:px-12 md:py-32" style={{ borderColor: 'var(--noir-line)' }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 flex items-baseline justify-between">
              <div>
                <Eyebrow className="mb-3">Continuar minha caminhada</Eyebrow>
                <h2
                  className="text-3xl md:text-4xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    color: 'var(--noir-text)',
                  }}
                >
                  Onde você parou.
                </h2>
              </div>
            </div>

            <ol className="space-y-0">
              {resume.slice(0, 3).map((item, i) => (
                <li key={item.id}>
                  {i > 0 && <Divider />}
                  <Link
                    to={item.targetPath}
                    className="group flex items-center justify-between gap-6 py-7 transition-colors md:py-8"
                  >
                    <div className="flex items-center gap-6 md:gap-10">
                      <span
                        className="text-xs tracking-[0.28em]"
                        style={{ color: 'var(--noir-text-faint)', fontFamily: 'var(--font-body)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div
                          className="mb-1 text-[10px] uppercase tracking-[0.28em]"
                          style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}
                        >
                          {RESUME_KIND_LABEL[item.kind] ?? item.kind}
                          {typeof item.progressPct === 'number' && (
                            <span style={{ color: 'var(--noir-text-faint)' }}> · {item.progressPct}%</span>
                          )}
                        </div>
                        <div
                          className="text-xl transition-colors md:text-2xl"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: 'var(--noir-text)',
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                      style={{ color: 'var(--gold)' }}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ══════ NOVIDADES + LITURGIA ══════ */}
      {(news.length > 0 || liturgy) && (
        <section
          className="w-full border-t px-6 py-20 md:px-12 md:py-24"
          style={{ borderColor: 'var(--noir-line)', background: 'var(--noir-surface)' }}
        >
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 md:grid-cols-2 md:gap-24">
            {news.length > 0 && (
              <div>
                <Eyebrow className="mb-6">Novidades</Eyebrow>
                <ul className="space-y-6">
                  {news.slice(0, 4).map((n) => (
                    <li key={n.id}>
                      <div
                        className="mb-1 text-[10px] uppercase tracking-[0.28em]"
                        style={{ color: 'var(--noir-text-faint)', fontFamily: 'var(--font-body)' }}
                      >
                        {formatRelativeDate(n.publishedAt)}
                      </div>
                      <div
                        className="text-lg leading-snug md:text-xl"
                        style={{ fontFamily: "var(--font-display)", color: 'var(--noir-text)' }}
                      >
                        {n.label}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {liturgy && (
              <div>
                <Eyebrow className="mb-6">Liturgia do dia</Eyebrow>
                <div
                  className="text-lg italic leading-relaxed md:text-xl"
                  style={{ fontFamily: "var(--font-display)", color: 'var(--noir-text-muted)' }}
                >
                  {capitalize(liturgy.weekday)} · {liturgy.season}
                </div>
                {liturgy.saintOfDay && (
                  <>
                    <div
                      className="mt-4 text-2xl md:text-3xl"
                      style={{ fontFamily: "var(--font-display)", color: 'var(--noir-text)' }}
                    >
                      {liturgy.saintOfDay.name}
                    </div>
                    {liturgy.saintOfDay.title && (
                      <div
                        className="mt-2 text-sm"
                        style={{ color: 'var(--noir-text-muted)', fontFamily: 'var(--font-body)' }}
                      >
                        {liturgy.saintOfDay.title}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}


      {/* ══════ FOOTER ══════ */}
      <footer className="w-full border-t px-6 py-12 md:px-12" style={{ borderColor: 'var(--noir-line)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-[0.32em] md:flex-row" style={{ color: 'var(--noir-text-faint)', fontFamily: 'var(--font-body)' }}>
          <span>Ad Maiorem Dei Gloriam</span>
          <span>Cathedra · MMXXVI</span>
        </div>
      </footer>
    </div>
  );
};

export default HomeUnified;
