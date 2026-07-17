/**
 * HomeUnified — Sprint Visual 3.0, Turno 2.
 *
 * Home única (deslogado + logado) que substitui a landing bugada e o Átrio v2 como
 * porta de entrada visível. Composição: bandas full-width empilhadas, paleta noir & gold,
 * tipografia editorial (Playfair Display + Inter — ambas já carregadas no projeto).
 *
 * ✅ Turno 1: shell visual completo com dados estáticos.
 * ✅ Turno 2: dados reais via hooks do Átrio (useResume, useLiturgyToday, useAnnouncements,
 *             useFeaturedThemes, useSearchSuggestions). Regra do Átrio preservada:
 *             a página consome apenas hooks — adapters continuam sendo trocáveis (mock → real).
 * ⏳ Turno 3: polish, motion, SEO, mobile refinements.
 *
 * Rotas:
 *   /              → esta página
 *   /legacy-home   → Index antigo (rollback)
 *
 * Ambientes canônicos vêm do EnvironmentRegistry (fonte única de verdade).
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
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
import { EnvironmentRegistry } from '@/core/navigation';
import {
  useResume,
  useLiturgyToday,
  useAnnouncements,
  useFeaturedThemes,
  useSearchSuggestions,
} from '@/modules/atrium/hooks';
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

  // Primeiro tema como destaque; fallback silencioso se lista vazia.
  const featured = themes[0];



  return (
    <div className="cathedra-noir min-h-screen w-full">
      <Helmet>
        <title>Cathedra — Habite a profundidade do silêncio</title>
        <meta name="description" content="Cathedra: um espaço editorial e silencioso para estudar, rezar, formar-se, pesquisar e caminhar na tradição católica." />
        <meta property="og:title" content="Cathedra — Habite a profundidade do silêncio" />
        <meta property="og:description" content="Estudo, oração, formação e pesquisa em um só lugar. Uma catedral digital para a vida interior." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* ══════ HERO (100vh) ══════ */}
      <section className="relative flex min-h-[92vh] w-full flex-col items-center justify-center px-6 py-16 md:px-12">
        {/* Halo dourado sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 45%, rgba(201,168,76,0.08) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">
          <div data-rise><Eyebrow className="mb-6 md:mb-8">Sanctuarium Spiritus</Eyebrow></div>

          <h1
            data-rise="1"
            className="mb-6 leading-[0.95] tracking-[0.06em]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 'clamp(3.5rem, 12vw, 9rem)',
              color: 'var(--noir-text)',
            }}
          >
            CATHEDRA
          </h1>

          <p
            data-rise="2"
            className="mx-auto max-w-2xl px-4 text-lg italic leading-relaxed md:text-2xl"
            style={{ fontFamily: "var(--font-display)", color: 'var(--noir-text-muted)' }}
          >
            Habite a profundidade do silêncio,<br className="hidden md:inline" />
            {' '}contemple a clareza da Verdade.
          </p>

          {/* Busca Spotlight-like */}
          <div data-rise="3" className="mt-14 w-full max-w-2xl md:mt-20">
            <label htmlFor="home-search" className="sr-only">Pesquisar</label>
            <div
              className="group flex items-center gap-3 rounded-full border px-6 py-4 transition-colors md:py-5"
              style={{
                borderColor: 'var(--noir-line)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <SearchIcon className="h-5 w-5 shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
              <input
                id="home-search"
                type="text"
                placeholder="O que deseja estudar hoje?"
                className="w-full bg-transparent text-base outline-none placeholder:italic md:text-lg"
                style={{
                  color: 'var(--noir-text)',
                  fontFamily: "var(--font-display)",
                }}
              />
              <kbd
                className="hidden shrink-0 rounded border px-2 py-1 text-[10px] tracking-widest md:inline-block"
                style={{
                  borderColor: 'var(--noir-line)',
                  color: 'var(--noir-text-faint)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Sugestões (chips) — vindas do SearchAdapter */}
            {suggestions.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 6).map((s) => (
                  <Link
                    key={s.id}
                    to={`/buscar?q=${encodeURIComponent(s.label)}`}
                    className="rounded-full border px-3 py-1.5 text-xs tracking-wide transition-colors"
                    style={{ borderColor: 'var(--noir-line)', color: 'var(--noir-text-muted)', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--noir-line)'; e.currentTarget.style.color = 'var(--noir-text-muted)'; }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>


          {/* Chevron descend */}
          <div className="mt-16 opacity-40 md:mt-24">
            <div className="mx-auto h-16 w-px" style={{ background: 'linear-gradient(to bottom, var(--gold), transparent)' }} />
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
                to={`/${env.key === 'formar-se' ? 'formacao' : env.key === 'pesquisar' ? 'buscar' : env.key === 'minha-jornada' ? 'jornadas' : env.key === 'estudar' ? 'bible' : env.key}`}
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
