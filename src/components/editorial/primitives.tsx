/**
 * Editorial primitives — Sprint E1 (fundação, sem consumo ainda).
 *
 * Regras (mesmas de index.tsx):
 *  - Sem hooks de domínio, sem fetch, sem rotas.
 *  - Consumo apenas de tokens `stitch-*` + Tailwind base.
 *  - Wrappers puramente visuais e composicionais.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { EditorialDivider } from './index';

/* ------------------------------------------------------------------ */
/* Kicker — versalete dourado standalone                              */
/* ------------------------------------------------------------------ */

export interface EditorialKickerProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  as?: 'span' | 'p';
  tone?: 'gold' | 'muted';
}

export const EditorialKicker: React.FC<EditorialKickerProps> = ({
  as = 'span',
  tone = 'gold',
  className,
  children,
  ...rest
}) => {
  const Comp = as as React.ElementType;
  return (
    <Comp
      className={cn(
        'font-stitch-label text-stitch-label-sm uppercase tracking-[0.32em]',
        tone === 'gold' ? 'text-stitch-secondary' : 'text-stitch-on-surface-variant',
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
};

/* ------------------------------------------------------------------ */
/* Meta — linha contextual discreta                                   */
/* ------------------------------------------------------------------ */

export interface EditorialMetaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  dot?: boolean;
}

export const EditorialMeta: React.FC<EditorialMetaProps> = ({
  dot = true,
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'flex items-center gap-3 font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em]',
      'text-stitch-on-surface-variant/80',
      className,
    )}
    {...rest}
  >
    {dot && (
      <span
        aria-hidden="true"
        className="inline-block h-[6px] w-[6px] rounded-full bg-stitch-secondary/70"
      />
    )}
    <span>{children}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* GoldMarkerDivider — filete dourado com marcador central            */
/* ------------------------------------------------------------------ */

export interface EditorialGoldMarkerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  symbol?: React.ReactNode;
}

export const EditorialGoldMarker: React.FC<EditorialGoldMarkerProps> = ({
  symbol = '✦',
  className,
  ...rest
}) => (
  <div
    role="separator"
    aria-orientation="horizontal"
    className={cn('flex items-center gap-4 text-stitch-secondary', className)}
    {...rest}
  >
    <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,hsl(var(--stitch-secondary)),transparent)]" />
    <span aria-hidden="true" className="text-xs">
      {symbol}
    </span>
    <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,hsl(var(--stitch-secondary)),transparent)]" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Progress — barra dourada 2px + marcador                            */
/* ------------------------------------------------------------------ */

export interface EditorialProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number; // 0..100
  label?: React.ReactNode;
}

export const EditorialProgress: React.FC<EditorialProgressProps> = ({
  value,
  label,
  className,
  ...rest
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)} {...rest}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="relative h-[2px] w-full bg-stitch-outline-variant/40"
      >
        <span
          className="absolute inset-y-0 left-0 bg-stitch-secondary"
          style={{ width: `${clamped}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute -top-[3px] h-2 w-2 rounded-full bg-stitch-secondary"
          style={{ left: `calc(${clamped}% - 4px)` }}
        />
      </div>
      {label && (
        <div className="mt-2 font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-on-surface-variant/80">
          {label}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Quote — citação editorial                                          */
/* ------------------------------------------------------------------ */

export interface EditorialQuoteProps
  extends React.HTMLAttributes<HTMLQuoteElement> {
  cite?: React.ReactNode;
}

export const EditorialQuote: React.FC<EditorialQuoteProps> = ({
  cite,
  className,
  children,
  ...rest
}) => (
  <blockquote
    className={cn(
      'relative pl-6 border-l border-stitch-secondary/60',
      'font-stitch-display italic text-stitch-headline-sm text-stitch-on-background',
      className,
    )}
    {...rest}
  >
    <p className="leading-relaxed">{children}</p>
    {cite && (
      <footer className="mt-3 font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-on-surface-variant not-italic">
        — {cite}
      </footer>
    )}
  </blockquote>
);

/* ------------------------------------------------------------------ */
/* Marginalia — numeração marginal dourada (versículo / §CIC)         */
/* ------------------------------------------------------------------ */

export interface EditorialMarginaliaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  marker: React.ReactNode;
  markerAriaLabel?: string;
}

export const EditorialMarginalia: React.FC<EditorialMarginaliaProps> = ({
  marker,
  markerAriaLabel,
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'grid grid-cols-[3rem,1fr] gap-3 md:gap-4 items-baseline',
      className,
    )}
    {...rest}
  >
    <span
      aria-label={markerAriaLabel}
      className="text-right font-stitch-label text-stitch-label-sm uppercase tracking-[0.2em] text-stitch-secondary select-none"
    >
      {marker}
    </span>
    <div className="font-stitch-body text-stitch-body-lg text-stitch-on-background leading-relaxed">
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* EmptyState — vazio contemplativo                                    */
/* ------------------------------------------------------------------ */

export interface EditorialEmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  symbol?: React.ReactNode;
}

export const EditorialEmptyState: React.FC<EditorialEmptyStateProps> = ({
  kicker,
  title,
  description,
  action,
  symbol = '✦',
  className,
  ...rest
}) => (
  <div
    role="status"
    className={cn(
      'flex flex-col items-center text-center py-16 px-4',
      className,
    )}
    {...rest}
  >
    <span
      aria-hidden="true"
      className="text-2xl text-stitch-secondary/80 mb-6"
    >
      {symbol}
    </span>
    {kicker && (
      <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.32em] text-stitch-secondary mb-3">
        {kicker}
      </p>
    )}
    <h2 className="font-stitch-display italic text-stitch-headline-md text-stitch-on-background max-w-md">
      {title}
    </h2>
    {description && (
      <p className="mt-4 font-stitch-body text-stitch-body-md text-stitch-on-surface-variant max-w-md">
        {description}
      </p>
    )}
    {action && <div className="mt-8">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Breadcrumb — trilha em versalete dourado                            */
/* ------------------------------------------------------------------ */

export interface EditorialBreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  current?: boolean;
}

export interface EditorialBreadcrumbProps
  extends React.HTMLAttributes<HTMLElement> {
  items: EditorialBreadcrumbItem[];
  separator?: React.ReactNode;
}

export const EditorialBreadcrumb: React.FC<EditorialBreadcrumbProps> = ({
  items,
  separator = '·',
  className,
  ...rest
}) => (
  <nav
    aria-label="Trilha"
    className={cn(
      'font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-on-surface-variant',
      className,
    )}
    {...rest}
  >
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const content =
          item.href || item.onClick ? (
            <a
              href={item.href}
              onClick={item.onClick}
              aria-current={item.current || isLast ? 'page' : undefined}
              className={cn(
                'transition-colors focus-visible:outline-none focus-visible:text-stitch-secondary',
                item.current || isLast
                  ? 'text-stitch-secondary'
                  : 'hover:text-stitch-secondary',
              )}
            >
              {item.label}
            </a>
          ) : (
            <span
              aria-current={item.current || isLast ? 'page' : undefined}
              className={cn(
                item.current || isLast ? 'text-stitch-secondary' : undefined,
              )}
            >
              {item.label}
            </span>
          );
        return (
          <li key={i} className="flex items-center gap-2">
            {content}
            {!isLast && (
              <span aria-hidden="true" className="text-stitch-outline-variant">
                {separator}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

/* ------------------------------------------------------------------ */
/* CTA — botão editorial (fio inferior dourado)                       */
/* ------------------------------------------------------------------ */

type CTAOwnProps = {
  as?: 'button' | 'a';
  variant?: 'inline' | 'block';
  href?: string;
};

export type EditorialCTAProps = CTAOwnProps &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement> &
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof CTAOwnProps
  >;

export const EditorialCTA = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  EditorialCTAProps
>(({ as = 'button', variant = 'inline', className, children, ...rest }, ref) => {
  const Comp = (as === 'a' ? 'a' : 'button') as React.ElementType;
  return (
    <Comp
      ref={ref as never}
      type={as === 'button' ? 'button' : undefined}
      className={cn(
        'group inline-flex items-center gap-3 font-stitch-label uppercase tracking-[0.28em] text-stitch-label-md',
        'text-stitch-on-background',
        'pb-1 border-b border-stitch-secondary',
        'transition-[letter-spacing,color] duration-300',
        'hover:tracking-[0.34em] hover:text-stitch-secondary',
        'focus-visible:outline-none focus-visible:text-stitch-secondary focus-visible:tracking-[0.34em]',
        variant === 'block' && 'w-full justify-center',
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </Comp>
  );
});
EditorialCTA.displayName = 'EditorialCTA';

/* ------------------------------------------------------------------ */
/* Panel — painel editorial para Nexus / popovers                     */
/* ------------------------------------------------------------------ */

export interface EditorialPanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  footer?: React.ReactNode;
}

export const EditorialPanel: React.FC<EditorialPanelProps> = ({
  kicker,
  title,
  subtitle,
  onClose,
  closeLabel = 'Fechar',
  footer,
  className,
  children,
  ...rest
}) => (
  <div
    role="dialog"
    aria-label={typeof title === 'string' ? title : undefined}
    className={cn(
      'flex flex-col bg-stitch-surface-container-lowest text-stitch-on-surface',
      'border border-stitch-outline-variant/40 rounded-[var(--stitch-radius-xl)]',
      'overflow-hidden',
      className,
    )}
    {...rest}
  >
    <header className="px-6 pt-6 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {kicker && (
            <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.32em] text-stitch-secondary mb-2">
              {kicker}
            </p>
          )}
          <h2 className="font-stitch-display italic text-stitch-headline-sm text-stitch-on-background leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 font-stitch-body text-stitch-body-sm text-stitch-on-surface-variant">
              {subtitle}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full text-stitch-on-surface-variant hover:text-stitch-secondary hover:bg-stitch-surface-container transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stitch-secondary"
          >
            ×
          </button>
        )}
      </div>
      <EditorialDivider variant="gold-fade" className="mt-5" />
    </header>
    <div className="px-6 py-4 flex-1 overflow-y-auto font-stitch-body text-stitch-body-md text-stitch-on-surface">
      {children}
    </div>
    {footer && (
      <footer className="px-6 py-4 border-t border-stitch-outline-variant/40 bg-stitch-surface-container-low/40">
        {footer}
      </footer>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* BookCover — capa 3D com textura de linho                            */
/* ------------------------------------------------------------------ */

export interface EditorialBookCoverProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  author?: React.ReactNode;
  /** URL da imagem de capa. Se ausente, usa capa tipográfica. */
  image?: string;
  /** Cor de fundo quando não há imagem (var CSS ou hsl). Default: burgundy. */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COVER_SIZE: Record<NonNullable<EditorialBookCoverProps['size']>, string> = {
  sm: 'w-24 h-36',
  md: 'w-36 h-52',
  lg: 'w-48 h-72',
};

export const EditorialBookCover: React.FC<EditorialBookCoverProps> = ({
  title,
  author,
  image,
  color = 'hsl(var(--stitch-primary))',
  size = 'md',
  className,
  ...rest
}) => (
  <div
    className={cn(
      'relative shrink-0 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.35),inset_-2px_0_4px_rgba(0,0,0,0.15),inset_2px_0_1px_rgba(255,255,255,0.06)]',
      'rounded-sm overflow-hidden',
      COVER_SIZE[size],
      className,
    )}
    style={{ backgroundColor: image ? undefined : color }}
    {...rest}
  >
    {image ? (
      <img
        src={image}
        alt={typeof title === 'string' ? title : ''}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
        <span className="font-stitch-display italic text-stitch-on-primary text-sm md:text-base leading-tight">
          {title}
        </span>
        {author && (
          <span className="mt-2 font-stitch-label uppercase tracking-[0.28em] text-stitch-on-primary/70 text-[10px]">
            {author}
          </span>
        )}
      </div>
    )}
    {/* Textura de linho */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
      style={{
        backgroundImage:
          "url('https://www.transparenttextures.com/patterns/lined-paper.png')",
      }}
    />
    {/* Lombada (highlight à esquerda) */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-[6px] bg-[linear-gradient(90deg,rgba(0,0,0,0.25),transparent)]"
    />
  </div>
);

/* ------------------------------------------------------------------ */
/* Timeline — trilha vertical com marcadores dourados                  */
/* ------------------------------------------------------------------ */

export interface EditorialTimelineProps
  extends React.HTMLAttributes<HTMLOListElement> {}

export const EditorialTimeline: React.FC<EditorialTimelineProps> = ({
  className,
  children,
  ...rest
}) => (
  <ol
    className={cn(
      'relative pl-8 md:pl-10',
      'before:absolute before:left-3 md:before:left-4 before:top-2 before:bottom-2',
      'before:w-px before:bg-[linear-gradient(180deg,transparent,hsl(var(--stitch-secondary))/0.5,transparent)]',
      className,
    )}
    {...rest}
  >
    {children}
  </ol>
);

/* ------------------------------------------------------------------ */
/* ChapterCard — item da Timeline (numeral romano dourado)             */
/* ------------------------------------------------------------------ */

export interface EditorialChapterCardProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> {
  numeral: React.ReactNode;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  state?: 'default' | 'current' | 'done';
}

export const EditorialChapterCard: React.FC<EditorialChapterCardProps> = ({
  numeral,
  kicker,
  title,
  description,
  meta,
  action,
  state = 'default',
  className,
  ...rest
}) => (
  <li className={cn('relative py-6', className)} {...rest}>
    <span
      aria-hidden="true"
      className={cn(
        'absolute left-0 top-8 -translate-x-[calc(50%+0px)] md:-translate-x-[calc(50%+2px)]',
        'flex items-center justify-center h-6 w-6 rounded-full',
        'font-stitch-label uppercase tracking-widest text-[10px]',
        state === 'current' &&
          'bg-stitch-secondary text-stitch-on-primary shadow-[0_0_0_4px_hsl(var(--stitch-background))]',
        state === 'done' &&
          'bg-stitch-surface-container border border-stitch-secondary/60 text-stitch-secondary',
        state === 'default' &&
          'bg-stitch-background border border-stitch-outline-variant text-stitch-on-surface-variant',
      )}
      style={{ left: '0.75rem' }}
    >
      {numeral}
    </span>
    <div className="ml-4 md:ml-6 flex flex-col gap-2">
      {kicker && (
        <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.28em] text-stitch-secondary">
          {kicker}
        </p>
      )}
      <h3 className="font-stitch-display italic text-stitch-headline-sm text-stitch-on-background leading-tight">
        {title}
      </h3>
      {description && (
        <p className="font-stitch-body text-stitch-body-md text-stitch-on-surface-variant">
          {description}
        </p>
      )}
      {meta && (
        <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-on-surface-variant/80">
          {meta}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  </li>
);
