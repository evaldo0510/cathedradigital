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
        stiffness: 380,
        damping: 30,
        delay: Math.min(index * 0.04, 0.4),
      }}
      layout
      role="button"
      tabIndex={0}
      aria-label={`${title}${subtitle ? `: ${subtitle}` : ''}`}
      className={cn(
        'cursor-pointer hover:bg-muted/30 transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
    <CardContent className="p-3 flex items-center gap-3">
      {icon && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <RelevanceBadge score={score} size="xs" />
        {showArrow && (
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </CardContent>
  </MotionCard>
));

SearchResultCard.displayName = 'SearchResultCard';

export default SearchResultCard;
