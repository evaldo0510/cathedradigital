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

// Sprint E1 — primitivas adicionais (fundação sem consumo ainda).
export * from './primitives';

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
  /**
   * Linha contextual discreta acima do kicker.
   * Uso: "Última atualização • Hoje" · "Mais de 2.000 textos interligados".
   * Atmosfera de acervo vivo, sem poluir a interface.
   */
  meta?: React.ReactNode;
  /** Renderiza filete dourado sob o título. Default: true. */
  rule?: boolean;
  /**
   * Textura de pergaminho atmosférica, contida no próprio Hero.
   * Opacidade ~4%, sem repetição evidente. Default: false.
   */
  parchment?: boolean;
  /**
   * Sprint E2 — preserva fidelidade visual de heros legados.
   * `editorial` (default) usa Cormorant Garamond + kicker dourado tracking-[0.28em].
   * `legacy` usa a tipografia atual da página (font-display + tracking mais estreito),
   * permitindo migração estrutural sem mudança visual.
   */
  variant?: 'editorial' | 'legacy';
  /** Alinhamento horizontal do conteúdo. Default: `left`. */
  align?: 'left' | 'center';
  /** Ícone opcional exibido acima do kicker (heros com selo visual). */
  icon?: React.ReactNode;
  /** Slot para badges/pills abaixo do subtítulo (Home, Jornadas, Formação). */
  badges?: React.ReactNode;
  /** Fundo do hero: `none`, `parchment` (mesmo que prop `parchment`) ou `gradient`. */
  background?: 'none' | 'parchment' | 'gradient';
  /** Escala vertical + tipográfica. Default: `md`. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Padrão de espaçamento superior/inferior do hero.
   * - `default`: usa a escala editorial completa (HERO_SIZE_PAD).
   * - `safe`: respiro seguro no mobile para heros que ficam logo abaixo do header
   *   (`pt-10 pb-0` no mobile, `md:pt-6 md:pb-0` no desktop). Default para `variant="legacy"`.
   * - `flush`: sem padding vertical (`py-0`), quando o container pai já controla ritmo.
   */
  topSpacing?: 'default' | 'safe' | 'flush';
  /** Escapes tipográficos por página. */
  titleClassName?: string;
  subtitleClassName?: string;
  kickerClassName?: string;
}

const HERO_SIZE_PAD: Record<NonNullable<EditorialHeroProps['size']>, string> = {
  sm: 'py-[calc(var(--stitch-editorial-stack)*0.75)] md:py-[calc(var(--stitch-editorial-stack)*1)]',
  md: 'py-[calc(var(--stitch-editorial-stack)*1.25)] md:py-[calc(var(--stitch-editorial-stack)*2)]',
  lg: 'py-[calc(var(--stitch-editorial-stack)*1.75)] md:py-[calc(var(--stitch-editorial-stack)*2.5)]',
};

const HERO_TOP_SPACING: Record<'safe' | 'flush', string> = {
  safe: 'pt-10 pb-0 md:pt-6 md:pb-0',
  flush: 'py-0',
};

const HERO_TITLE_SIZE: Record<NonNullable<EditorialHeroProps['size']>, string> = {
  sm: 'text-stitch-display-md-mobile md:text-stitch-display-md',
  md: 'text-stitch-display-lg-mobile md:text-stitch-display-lg',
  lg: 'text-stitch-display-lg-mobile md:text-stitch-display-lg',
};

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  kicker,
  title,
  subtitle,
  action,
  meta,
  rule = true,
  parchment = false,
  variant = 'editorial',
  align = 'left',
  icon,
  badges,
  background,
  size = 'md',
  topSpacing,
  titleClassName,
  subtitleClassName,
  kickerClassName,
  className,
  ...rest
}) => {
  const bg = background ?? (parchment ? 'parchment' : 'none');
  const centered = align === 'center';
  const isLegacy = variant === 'legacy';
  const resolvedTopSpacing = topSpacing ?? (isLegacy ? 'safe' : 'default');
  const paddingClass =
    resolvedTopSpacing === 'default'
      ? HERO_SIZE_PAD[size]
      : HERO_TOP_SPACING[resolvedTopSpacing];

  return (
    <section
      data-editorial-hero
      data-variant={variant}
      data-top-spacing={resolvedTopSpacing}
      className={cn(
        'relative overflow-hidden',
        paddingClass,
        className,
      )}
      {...rest}
    >
      {bg === 'parchment' && (
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
      {bg === 'gradient' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--stitch-surface))_0%,transparent_100%)]"
        />
      )}
      <div className={cn('relative', centered && 'text-center flex flex-col items-center')}>
        {meta && (
          <div
            className={cn(
              'mb-8 flex items-center gap-3 font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant/80 uppercase tracking-[0.24em]',
              centered && 'justify-center',
            )}
          >
            <span
              aria-hidden="true"
              className="inline-block h-[6px] w-[6px] rounded-full bg-stitch-secondary/70"
            />
            <span>{meta}</span>
          </div>
        )}
        {icon && (
          <div className={cn('mb-4 text-stitch-secondary', centered && 'mx-auto')}>{icon}</div>
        )}
        {kicker && (
          <p
            className={cn(
              'font-stitch-label text-stitch-label-sm uppercase mb-6',
              isLegacy
                ? 'text-stitch-secondary/80 tracking-[0.18em] font-semibold'
                : 'text-stitch-secondary tracking-[0.28em]',
              kickerClassName,
            )}
          >
            {kicker}
          </p>
        )}
        <h1
          className={cn(
            isLegacy
              ? 'font-stitch-sans font-light not-italic text-stitch-on-background'
              : 'font-stitch-display text-stitch-on-background',
            HERO_TITLE_SIZE[size],
            centered ? 'max-w-3xl mx-auto' : 'max-w-3xl',
            titleClassName,
          )}
        >
          {title}
        </h1>
        {rule && (
          <EditorialDivider
            variant="gold-fade"
            className={cn('mt-8 max-w-[240px]', centered && 'mx-auto')}
          />
        )}
        {subtitle && (
          <p
            className={cn(
              'font-stitch-body text-stitch-body-lg text-stitch-on-surface-variant mt-6',
              centered ? 'max-w-2xl mx-auto' : 'max-w-2xl',
              isLegacy && 'italic',
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        )}
        {badges && <div className={cn('mt-6 flex flex-wrap gap-2', centered && 'justify-center')}>{badges}</div>}
        {action && <div className="mt-10">{action}</div>}
      </div>
    </section>
  );
};



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

/* ------------------------------------------------------------------ */
/* ReaderHeader — cabeçalho editorial dos Readers (R2)                */
/* ------------------------------------------------------------------ */

export interface EditorialReaderHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Kicker versalete dourado (ex: "Sagrada Escritura · Evangelho"). */
  kicker?: React.ReactNode;
  /** Título editorial em serif italic (ex: "João · Capítulo 6"). */
  title: React.ReactNode;
  /** Subtítulo em Karla, discreto (ex: "Novo Testamento · São João Apóstolo"). */
  subtitle?: React.ReactNode;
  /** Metadados marginais opcionais (autor/data/categoria). */
  meta?: React.ReactNode;
  /** Alinhamento do bloco. Default: center. */
  align?: 'center' | 'left';
}

export const EditorialReaderHeader: React.FC<EditorialReaderHeaderProps> = ({
  kicker,
  title,
  subtitle,
  meta,
  align = 'center',
  className,
  ...rest
}) => (
  <header
    className={cn(
      'relative py-spacing-2xl',
      align === 'center' ? 'text-center' : 'text-left',
      className,
    )}
    {...rest}
  >
    {kicker && (
      <p className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium mb-spacing-md">
        {kicker}
      </p>
    )}
    <h1 className="font-serif italic text-primary text-4xl md:text-5xl leading-tight">
      {title}
    </h1>
    {subtitle && (
      <p className="font-sans text-primary/60 text-sm md:text-base mt-spacing-md max-w-xl mx-auto">
        {subtitle}
      </p>
    )}
    <div
      aria-hidden
      className={cn(
        'h-px w-16 bg-secondary/40 mt-spacing-lg',
        align === 'center' && 'mx-auto',
      )}
    />
    {meta && (
      <div className="mt-spacing-md text-[10px] uppercase tracking-[0.28em] text-primary/50">
        {meta}
      </div>
    )}
  </header>
);
