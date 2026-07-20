import { Icons } from '@/constants';
/**
 * SearchResultCard — shared card for fuzzy-search results across all modules.
 *
 * Provides a consistent look for search results in GlobalSearchPage,
 * Saints, Glossary, Community, and Journeys.
 */
import React from 'react';

import { motion } from 'framer-motion';
import { CathedraCard } from './CathedraCard';
import { RelevanceBadge } from './RelevanceBadge';
import { cn } from '@/lib/utils';

export interface SearchResultCardProps {
  /** Primary label (saint name, glossary term, post title, etc.). */
  title: string;
  /** Optional secondary line (subtitle, definition snippet, etc.). */
  subtitle?: string | null;
  /** Optional rich subtitle (e.g. with highlighted matches). Falls back to `subtitle`. */
  subtitleNode?: React.ReactNode;
  /** Similarity score in [0, 1]. Passed to RelevanceBadge. */
  score?: number | null;
  /** Optional leading icon or emoji element. */
  icon?: React.ReactNode;
  /** Click handler — typically navigates to the detail view. */
  onClick?: () => void;
  /** Show a trailing chevron arrow. Defaults to true. */
  showArrow?: boolean;
  /** Extra wrapper classes. */
  className?: string;
  /** Animation stagger index (used for staggered entry). */
  index?: number;
  /**
   * Slot para ações contextuais (ex.: <PassageActions />).
   * Renderizado como rodapé do card, isolado do onClick principal.
   */
  actions?: React.ReactNode;
}



export const SearchResultCard = React.forwardRef<HTMLDivElement, SearchResultCardProps>(({
  title,
  subtitle,
  subtitleNode,
  score,
  icon,
  onClick,
  showArrow = true,
  className,
  index = 0,
  actions,
}, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <CathedraCard
      ref={ref}
      variant="interactive"
      padding="none"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        delay: Math.min(index * 0.03, 0.3),
      }}
      role="button"
      tabIndex={0}
      aria-label={`${title}${subtitle ? `. ${subtitle}` : ''}. Clique para ver detalhes.`}
      className={cn(
        'border border-border/20 group',
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
    <div className="p-spacing-sm flex items-center gap-spacing-sm">
      {icon && (
        <div className="flex-shrink-0 w-spacing-xl h-spacing-xl rounded-premium bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-spacing-0">
        <p className="editorial-display text-lg text-foreground truncate leading-snug">{title}</p>
        {(subtitleNode ?? subtitle) && (
          <p className="font-serif italic text-premium-xs text-muted-foreground line-clamp-spacing-2xs mt-spacing-2xs">{subtitleNode ?? subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-spacing-xs flex-shrink-0">
        <RelevanceBadge score={score} size="xs" />
        {showArrow && (
          <Icons.ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </div>
    {actions && (
      <div className="px-spacing-sm pb-spacing-sm pt-0 -mt-1 border-t border-border/10">
        <div className="pt-spacing-sm">
          {actions}
        </div>
      </div>
    )}
    </CathedraCard>
  );
});

SearchResultCard.displayName = 'SearchResultCard';

export default SearchResultCard;
