/**
 * SpaceLayout — primitivos de layout dos "espaços" do Mosteiro Digital.
 *
 * Padroniza a anatomia de todo espaço (Átrio, Biblioteca, Sacrário/Orações,
 * Capelas, Claustro, Igreja Viva):
 *
 *   1. Título (kicker + h1)
 *   2. Descrição
 *   3. Entrada (busca / ação principal)
 *   4. Portas (grid de acessos internos)
 *   5. Footer (para onde continuar)
 *
 * Estilo herdado do Átrio (`AtriumHome`), porém escrito somente com tokens
 * semânticos do Design System — nada de cores hardcoded.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Container do espaço ────────────────────────────────────────────────── */

interface SpaceLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const SpaceLayout: React.FC<SpaceLayoutProps> = ({ children, className }) => (
  <section
    data-space-layout="true"
    className={cn(
      'mx-auto w-full max-w-[1120px] px-5 pt-6 pb-24 md:px-16 md:pt-14 md:pb-16 animate-fade-in',
      className,
    )}
  >
    {children}
  </section>
);

/* ── 1 + 2. Título e descrição ──────────────────────────────────────────── */

interface SpaceHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({
  kicker,
  title,
  description,
  align = 'left',
  className,
}) => (
  <header
    className={cn(
      'border-b border-secondary/15 pb-8',
      align === 'center' && 'text-center',
      className,
    )}
  >
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
      <p className="mb-2 font-reader text-[12px] font-bold uppercase tracking-[0.32em] text-secondary">
        {kicker}
      </p>
      <h1 className="font-display text-[32px] italic leading-[40px] text-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
        {title}
      </h1>
      {description && (
        <p className="mt-4 font-reader text-[18px] leading-[30px] text-muted-foreground md:text-[20px] md:leading-[32px]">
          {description}
        </p>
      )}
    </div>
  </header>
);

/* ── 3. Entrada ─────────────────────────────────────────────────────────── */

export const SpaceEntrance: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <section className={cn('pt-8', className)}>{children}</section>;

/* ── Cabeçalho de seção (mesma régua do Átrio) ──────────────────────────── */

export const SpaceSectionTitle: React.FC<{
  title: string;
  aside?: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ title, aside, icon: Icon = Compass }) => (
  <div className="mb-8 flex items-center gap-4">
    <Icon className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
    <h2 className="font-display text-[24px] font-semibold leading-[32px] text-primary">{title}</h2>
    <div className="h-px flex-1 bg-secondary/20" />
    {aside && (
      <span className="hidden font-reader text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground md:inline">
        {aside}
      </span>
    )}
  </div>
);

/* ── 4. Portas ──────────────────────────────────────────────────────────── */

export interface SpaceDoor {
  key: string;
  label: string;
  /** Legenda curta em versalete (latim ou categoria). */
  overline?: string;
  hint?: string;
  to: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

interface SpaceDoorsProps {
  title?: string;
  aside?: string;
  doors: SpaceDoor[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
};

export const SpaceDoors: React.FC<SpaceDoorsProps> = ({
  title,
  aside,
  doors,
  columns = 4,
  className,
}) => (
  <section className={cn('pt-16', className)}>
    {title && <SpaceSectionTitle title={title} aside={aside} />}
    <div className={cn('grid grid-cols-2 gap-4 md:gap-6', COLS[columns])}>
      {doors.map((door, i) => (
        <Link
          key={door.key}
          to={door.to}
          aria-label={`Entrar em ${door.label}`}
          className="group relative flex flex-col border border-border/20 bg-card p-5 transition-all hover:border-secondary/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-secondary transition-transform group-hover:scale-y-100" />
          <div className="mb-4 flex items-center justify-between">
            {door.Icon ? (
              <door.Icon className="h-6 w-6 text-secondary" aria-hidden />
            ) : (
              <span className="h-6 w-6" />
            )}
            <span className="font-display text-[24px] italic text-secondary/70">
              {String(i + 1).padStart(2, '0')}
            </span>
          </div>
          {door.overline && (
            <p className="font-reader text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {door.overline}
            </p>
          )}
          <h3 className="mt-0.5 font-display text-[20px] leading-tight text-primary transition-colors group-hover:text-secondary">
            {door.label}
          </h3>
          {door.hint && (
            <p className="mt-2 font-reader text-[12px] leading-snug text-muted-foreground">
              {door.hint}
            </p>
          )}
        </Link>
      ))}
    </div>
  </section>
);

/* ── 5. Footer do espaço ────────────────────────────────────────────────── */

interface SpaceFooterProps {
  /** Frase contemplativa de fechamento. */
  note?: string;
  title?: string;
  links: { label: string; to: string; hint?: string }[];
  className?: string;
}

export const SpaceFooter: React.FC<SpaceFooterProps> = ({
  note,
  title = 'Para onde continuar',
  links,
  className,
}) => (
  <footer className={cn('mt-16 border-t border-secondary/20 pt-8', className)}>
    <h2 className="font-reader text-[12px] font-bold uppercase tracking-[0.2em] text-secondary">
      {title}
    </h2>
    {note && (
      <p className="mt-3 max-w-2xl font-display text-[20px] italic leading-[30px] text-muted-foreground">
        {note}
      </p>
    )}
    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <li key={l.to + l.label}>
          <Link
            to={l.to}
            className="group flex items-center justify-between gap-4 border border-border/20 bg-card px-4 py-3 transition-colors hover:border-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <span className="min-w-0">
              <span className="block font-display text-[16px] leading-tight text-primary group-hover:text-secondary">
                {l.label}
              </span>
              {l.hint && (
                <span className="mt-0.5 block font-reader text-[12px] text-muted-foreground">
                  {l.hint}
                </span>
              )}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-secondary transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  </footer>
);

export default SpaceLayout;
