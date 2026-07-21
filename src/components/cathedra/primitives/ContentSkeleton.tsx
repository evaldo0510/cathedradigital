import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ContentSkeleton — primitiva unificada de loading do Cathedra Design System.
 *
 * Consolidação (Sprint P2 Logos 2030):
 * - Substitui variantes ad-hoc de `animate-pulse` + `bg-muted/*` espalhadas.
 * - Usa `.cathedra-shimmer` (respeita `prefers-reduced-motion` via index.css).
 * - Tokens de tamanho, forma e espaçamento vinculados ao Design System.
 *
 * Uso:
 *   <ContentSkeleton variant="text" lines={3} />
 *   <ContentSkeleton variant="block" className="h-40" />
 *   <ContentSkeleton variant="circle" className="w-12 h-12" />
 *   <SkeletonCard />
 *   <SkeletonGrid count={6} />
 */

type Variant = 'block' | 'text' | 'circle' | 'pill';
type Tone = 'shimmer' | 'pulse';

interface ContentSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  tone?: Tone;
  lines?: number;
  lineGap?: string;
}

const shapeMap: Record<Variant, string> = {
  block: 'rounded-premium',
  text: 'rounded-premium-full h-spacing-md',
  circle: 'rounded-premium-full',
  pill: 'rounded-premium-full h-spacing-md',
};

const toneMap: Record<Tone, string> = {
  shimmer: 'cathedra-shimmer',
  pulse: 'animate-pulse bg-muted/30',
};

export const ContentSkeleton = React.forwardRef<HTMLDivElement, ContentSkeletonProps>(
  ({ variant = 'block', tone = 'shimmer', lines = 1, lineGap = 'space-y-spacing-xs', className, ...rest }, ref) => {
    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          aria-busy="true"
          className={cn('flex flex-col', lineGap, className)}
          {...rest}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                shapeMap.text,
                toneMap[tone],
                i === lines - 1 ? 'w-[72%]' : 'w-full',
              )}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-hidden="true"
        aria-busy="true"
        className={cn(shapeMap[variant], toneMap[tone], className)}
        {...rest}
      />
    );
  },
);
ContentSkeleton.displayName = 'ContentSkeleton';

/* -----------------------------------------------------------------------
 * Composições padrão — reduzem duplicação nas páginas.
 * ----------------------------------------------------------------------- */

export const SkeletonCard: React.FC<{ className?: string; withMedia?: boolean }> = ({
  className,
  withMedia = false,
}) => (
  <div
    className={cn(
      'premium-card p-spacing-lg space-y-spacing-md',
      className,
    )}
    aria-hidden="true"
    aria-busy="true"
  >
    {withMedia && <ContentSkeleton variant="block" className="h-[160px] w-full" />}
    <ContentSkeleton variant="text" className="w-[40%] h-spacing-sm" />
    <ContentSkeleton variant="text" lines={3} />
  </div>
);

export const SkeletonGrid: React.FC<{
  count?: number;
  cols?: 1 | 2 | 3 | 4;
  withMedia?: boolean;
  className?: string;
}> = ({ count = 6, cols = 3, withMedia = false, className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[cols];
  return (
    <div className={cn('grid gap-spacing-lg', gridCols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} withMedia={withMedia} />
      ))}
    </div>
  );
};

export const SkeletonHero: React.FC<{ className?: string }> = ({ className }) => (
  <div
    aria-hidden="true"
    aria-busy="true"
    className={cn('space-y-spacing-md py-spacing-2xl', className)}
  >
    <ContentSkeleton variant="pill" className="w-[120px]" />
    <ContentSkeleton variant="block" className="h-spacing-2xl w-[70%]" />
    <ContentSkeleton variant="text" lines={2} />
    <div className="flex gap-spacing-sm pt-spacing-sm">
      <ContentSkeleton variant="pill" className="w-[140px] h-spacing-2xl" />
      <ContentSkeleton variant="pill" className="w-[120px] h-spacing-2xl" />
    </div>
  </div>
);

export default ContentSkeleton;
