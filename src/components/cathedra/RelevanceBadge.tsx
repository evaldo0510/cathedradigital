/**
 * RelevanceBadge — shared visual indicator for fuzzy-search relevance.
 *
 * Used by Saints, Glossary and Community search results so the UX stays
 * consistent and the score-to-color mapping lives in one place
 * (see `scoreToTone` in `@/lib/similarity`).
 */
import React from 'react';
import { Target } from 'lucide-react';
import { scoreToTone } from '@/lib/similarity';
import { cn } from '@/lib/utils';

export interface RelevanceBadgeProps {
  /** Similarity score in [0, 1]. Renders nothing when missing or ≤ 0. */
  score: number | null | undefined;
  /**
   * Visual size preset. `xs` matches the tighter Community list,
   * `sm` matches Saints/Glossary cards. Defaults to `sm`.
   */
  size?: 'xs' | 'sm';
  /** Extra classes for positioning (e.g. absolute placement on a card). */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<RelevanceBadgeProps['size']>, string> = {
  xs: 'px-spacing-2xs py-spacing-3xs text-xs',
  sm: 'px-spacing-xs py-spacing-3xs text-xs',
};

export const RelevanceBadge: React.FC<RelevanceBadgeProps> = ({
  score,
  size = 'sm',
  className,
}) => {
  const tone = scoreToTone(score);
  if (!tone) return null;

  return (
    <span
      title={`Relevância: ${tone.pct}%`}
      aria-label={`Relevância da busca: ${tone.pct} por cento`}
      className={cn(
        'inline-flex items-center gap-spacing-2xs rounded-full border font-black uppercase tracking-widest',
        SIZE_CLASSES[size],
        tone.classes,
        className,
      )}
    >
      <Target className="w-spacing-xs h-spacing-xs" />
      {tone.pct}%
    </span>
  );
};

export default RelevanceBadge;
