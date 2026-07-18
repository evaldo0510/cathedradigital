/**
 * Editorial primitives — Sprint R1 (reskin Stitch → Cathedra).
 *
 * Wrappers puramente visuais. NENHUM destes componentes pode:
 *  - importar hooks de domínio (Bíblia, CIC, Nexus, Jornada, etc.)
 *  - fazer fetch / consumir services / registries
 *  - conhecer rotas específicas ou regras de negócio
 *
 * Consomem apenas tokens `stitch-*` já registrados em `src/index.css`
 * e Tailwind (`stitch.*`, `font-stitch-*`, `text-stitch-*`).
 *
 * Usados em R1 (Biblioteca) e reutilizados em R2..R7.
 * Ver docs/reskin/README.md.
 */

import React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Shell — canvas base editorial                                      */
/* ------------------------------------------------------------------ */

export interface EditorialShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Aplica textura de pergaminho sutil por cima (opacity 0.05). */
  parchment?: boolean;
}

export const EditorialShell = React.forwardRef<HTMLDivElement, EditorialShellProps>(
  ({ className, parchment, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative w-full bg-stitch-background text-stitch-on-background',
        'px-[var(--stitch-margin-mobile)] md:px-[var(--stitch-margin-edge)]',
        className,
      )}
      {...rest}
    >
      {parchment && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] mix-blend-multiply"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/parchment.png')",
          }}
        />
      )}
      <div className="relative z-10 mx-auto w-full max-w-[var(--stitch-container-max)]">
        {children}
      </div>
    </div>
  ),
);
EditorialShell.displayName = 'EditorialShell';

/* ------------------------------------------------------------------ */
/* Divider — filete horizontal                                         */
/* ------------------------------------------------------------------ */

export interface EditorialDividerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'hair' | 'gold' | 'gold-fade';
}

export const EditorialDivider: React.FC<EditorialDividerProps> = ({
  variant = 'hair',
  className,
  ...rest
}) => (
  <div
    role="separator"
    aria-orientation="horizontal"
    className={cn(
      'w-full',
      variant === 'hair' && 'h-px bg-stitch-outline-variant/60',
      variant === 'gold' && 'h-px bg-stitch-secondary',
      variant === 'gold-fade' &&
        'h-px bg-[linear-gradient(90deg,transparent,hsl(var(--stitch-secondary)),transparent)]',
      className,
    )}
    {...rest}
  />
);

/* ------------------------------------------------------------------ */
/* Hero — abertura editorial                                          */
/* ------------------------------------------------------------------ */

export interface EditorialHeroProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Renderiza filete dourado sob o título. Default: true. */
  rule?: boolean;
  /**
   * Textura de pergaminho atmosférica, contida no próprio Hero.
   * Opacidade ~4%, sem repetição evidente. Default: false.
   */
  parchment?: boolean;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  kicker,
  title,
  subtitle,
  action,
  rule = true,
  parchment = false,
  className,
  ...rest
}) => (
  <section
    className={cn(
      'relative overflow-hidden py-[calc(var(--stitch-editorial-stack)*1.25)] md:py-[calc(var(--stitch-editorial-stack)*2)]',
      className,
    )}
    {...rest}
  >
    {parchment && (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/parchment.png')",
          backgroundSize: '520px 520px',
          maskImage:
            'radial-gradient(ellipse at 30% 40%, black 0%, black 55%, transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 30% 40%, black 0%, black 55%, transparent 90%)',
        }}
      />
    )}
    <div className="relative">
      {kicker && (
        <p className="font-stitch-label text-stitch-label-sm text-stitch-secondary uppercase mb-6 tracking-[0.28em]">
          {kicker}
        </p>
      )}
      <h1 className="font-stitch-display text-stitch-display-lg-mobile md:text-stitch-display-lg text-stitch-on-background max-w-3xl">
        {title}
      </h1>
      {rule && <EditorialDivider variant="gold-fade" className="mt-8 max-w-[240px]" />}
      {subtitle && (
        <p className="font-stitch-body text-stitch-body-lg text-stitch-on-surface-variant mt-6 max-w-2xl">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-10">{action}</div>}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Section — bloco tipográfico com kicker + título                    */
/* ------------------------------------------------------------------ */

export interface EditorialSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  kicker?: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
}

export const EditorialSection: React.FC<EditorialSectionProps> = ({
  kicker,
  title,
  action,
  className,
  children,
  ...rest
}) => (
  <section
    className={cn('py-[var(--stitch-editorial-stack)]', className)}
    {...rest}
  >
    {(kicker || title || action) && (
      <EditorialHeader kicker={kicker} title={title} action={action} className="mb-10" />
    )}
    {children}
  </section>
);

/* ------------------------------------------------------------------ */
/* Header — cabeçalho compacto de seção                               */
/* ------------------------------------------------------------------ */

export interface EditorialHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  kicker?: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
}

export const EditorialHeader: React.FC<EditorialHeaderProps> = ({
  kicker,
  title,
  action,
  className,
  ...rest
}) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4',
      className,
    )}
    {...rest}
  >
    <div>
      {kicker && (
        <p className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant uppercase mb-2">
          {kicker}
        </p>
      )}
      {title && (
        <h2 className="font-stitch-display text-stitch-headline-md text-stitch-on-background">
          {title}
        </h2>
      )}
      <EditorialDivider variant="gold" className="mt-3 max-w-[80px]" />
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Surface — superfície-cartão base                                   */
/* ------------------------------------------------------------------ */

export interface EditorialSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tier?: 'lowest' | 'low' | 'base' | 'high' | 'highest';
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
}

const TIER_BG: Record<NonNullable<EditorialSurfaceProps['tier']>, string> = {
  lowest: 'bg-stitch-surface-container-lowest',
  low: 'bg-stitch-surface-container-low',
  base: 'bg-stitch-surface-container',
  high: 'bg-stitch-surface-container-high',
  highest: 'bg-stitch-surface-container-highest',
};

export const EditorialSurface = React.forwardRef<HTMLDivElement, EditorialSurfaceProps>(
  ({ tier = 'low', interactive, as = 'div', className, children, ...rest }, ref) => {
    const Comp = as as React.ElementType;
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          TIER_BG[tier],
          'border border-stitch-outline-variant/40',
          'rounded-[var(--stitch-radius-xl)]',
          'text-stitch-on-surface',
          interactive &&
            'transition-colors hover:border-stitch-secondary/60 focus-within:border-stitch-secondary',
          className,
        )}
        {...rest}
      >
        {children}
      </Comp>
    );
  },
);
EditorialSurface.displayName = 'EditorialSurface';

/* ------------------------------------------------------------------ */
/* Card — cartão de conteúdo (com variantes)                          */
/* ------------------------------------------------------------------ */

export interface EditorialCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  cover?: React.ReactNode;
  variant?: 'plain' | 'book' | 'wide';
}

export const EditorialCard: React.FC<EditorialCardProps> = ({
  kicker,
  title,
  meta,
  description,
  cover,
  variant = 'plain',
  className,
  ...rest
}) => {
  if (variant === 'book') {
    return (
      <EditorialSurface
        interactive
        tier="lowest"
        className={cn('flex flex-col overflow-hidden', className)}
        {...rest}
      >
        {cover && (
          <div className="relative w-full aspect-[2/3] overflow-hidden bg-stitch-surface-container-high">
            {cover}
          </div>
        )}
        <div className="p-4 flex flex-col gap-1">
          {kicker && (
            <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant uppercase">
              {kicker}
            </span>
          )}
          <h3 className="font-stitch-display text-stitch-headline-sm text-stitch-on-background leading-tight">
            {title}
          </h3>
          {meta && (
            <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant">
              {meta}
            </span>
          )}
        </div>
      </EditorialSurface>
    );
  }

  if (variant === 'wide') {
    return (
      <EditorialSurface
        interactive
        tier="low"
        className={cn(
          'grid grid-cols-1 md:grid-cols-[2fr,3fr] overflow-hidden',
          className,
        )}
        {...rest}
      >
        {cover && (
          <div className="relative w-full h-full min-h-[220px] bg-stitch-surface-container-high">
            {cover}
          </div>
        )}
        <div className="p-8 flex flex-col gap-3 justify-center">
          {kicker && (
            <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant uppercase">
              {kicker}
            </span>
          )}
          <h3 className="font-stitch-display text-stitch-headline-md text-stitch-on-background leading-tight">
            {title}
          </h3>
          {description && (
            <p className="font-stitch-body text-stitch-body-md text-stitch-on-surface-variant">
              {description}
            </p>
          )}
          {meta && (
            <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant mt-2">
              {meta}
            </span>
          )}
        </div>
      </EditorialSurface>
    );
  }

  return (
    <EditorialSurface
      interactive
      tier="low"
      className={cn('p-6 flex flex-col gap-2', className)}
      {...rest}
    >
      {kicker && (
        <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant uppercase">
          {kicker}
        </span>
      )}
      <h3 className="font-stitch-display text-stitch-headline-sm text-stitch-on-background leading-tight">
        {title}
      </h3>
      {description && (
        <p className="font-stitch-body text-stitch-body-md text-stitch-on-surface-variant">
          {description}
        </p>
      )}
      {meta && (
        <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant mt-1">
          {meta}
        </span>
      )}
    </EditorialSurface>
  );
};

/* ------------------------------------------------------------------ */
/* Grid — layout responsivo neutro                                    */
/* ------------------------------------------------------------------ */

export interface EditorialGridProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  cols?: 1 | 2 | 3 | 4;
}

const COL_CLASS: Record<NonNullable<EditorialGridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

export const EditorialGrid: React.FC<EditorialGridProps> = ({
  cols = 3,
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'grid gap-[var(--stitch-gutter)]',
      COL_CLASS[cols],
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Shelf — carrossel horizontal (estante)                             */
/* ------------------------------------------------------------------ */

export interface EditorialShelfProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Largura mínima de cada item na estante. */
  itemMinWidth?: string;
}

export const EditorialShelf: React.FC<EditorialShelfProps> = ({
  itemMinWidth = '220px',
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      '-mx-[var(--stitch-margin-mobile)] md:-mx-[var(--stitch-margin-edge)]',
      'px-[var(--stitch-margin-mobile)] md:px-[var(--stitch-margin-edge)]',
      'overflow-x-auto snap-x snap-mandatory scroll-smooth',
      '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      className,
    )}
    {...rest}
  >
    <div
      className="grid grid-flow-col auto-cols-[var(--shelf-item)] gap-[var(--stitch-gutter)] pb-4"
      style={
        {
          ['--shelf-item' as string]: itemMinWidth,
        } as React.CSSProperties
      }
    >
      {React.Children.map(children, (child) => (
        <div className="snap-start">{child}</div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Footer — rodapé minimalista                                        */
/* ------------------------------------------------------------------ */

export interface EditorialFooterProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  kicker?: React.ReactNode;
  note?: React.ReactNode;
  action?: React.ReactNode;
}

export const EditorialFooter: React.FC<EditorialFooterProps> = ({
  kicker,
  note,
  action,
  className,
  ...rest
}) => (
  <footer
    className={cn(
      'mt-[calc(var(--stitch-editorial-stack)*2)] py-[var(--stitch-editorial-stack)]',
      'border-t border-stitch-outline-variant/40',
      className,
    )}
    {...rest}
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-col gap-1">
        {kicker && (
          <span className="font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant uppercase">
            {kicker}
          </span>
        )}
        {note && (
          <span className="font-stitch-body text-stitch-body-md text-stitch-on-surface-variant">
            {note}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  </footer>
);
