/**
 * SearchResultCard — shared card for fuzzy-search results across all modules.
 *
 * Provides a consistent look for search results in GlobalSearchPage,
 * Saints, Glossary, Community, and Journeys.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { RelevanceBadge } from './RelevanceBadge';
import { cn } from '@/lib/utils';

export interface SearchResultCardProps {
  /** Primary label (saint name, glossary term, post title, etc.). */
  title: string;
  /** Optional secondary line (subtitle, definition snippet, etc.). */
  subtitle?: string | null;
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
}

const MotionCard = motion.create(Card);

export const SearchResultCard = React.forwardRef<HTMLDivElement, SearchResultCardProps>(({
  title,
  subtitle,
  score,
  icon,
  onClick,
  showArrow = true,
  className,
  index = 0,
}, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <MotionCard
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        delay: Math.min(index * 0.03, 0.3),
      }}
      layout="position"
      role="button"
      tabIndex={0}
      aria-label={`${title}${subtitle ? `. ${subtitle}` : ''}. Clique para ver detalhes.`}
      className={cn(
        'premium-card bg-card border border-border/20 cursor-pointer hover:shadow-premium-hover transition-all group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none rounded-sm',
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
    <CardContent className="p-sm flex items-center gap-sm">
      {icon && (
        <div className="flex-shrink-0 w-xl h-xl rounded-premium bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-xs flex-shrink-0">
        <RelevanceBadge score={score} size="xs" />
        {showArrow && (
          <ChevronRight className="w-md h-md text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </CardContent>
    </MotionCard>
  );
});

SearchResultCard.displayName = 'SearchResultCard';

export default SearchResultCard;
