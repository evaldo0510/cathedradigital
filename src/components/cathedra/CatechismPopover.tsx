import { Button } from '@/components/ui/button';
import React, { memo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icons } from '../../constants';
import { useCatechismParagraph } from '@/hooks/useCatechismParagraph';

interface CatechismPopoverProps {
  paragraph: number;
  onNavigate?: (paragraph: number) => void;
  variant?: 'default' | 'mini';
}

const CatechismPopover: React.FC<CatechismPopoverProps> = memo(({
  paragraph,
  onNavigate,
  variant = 'default',
}) => {
  const { data, isLoading, isFetched } = useCatechismParagraph(paragraph);

  const content = data?.content || '';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={variant === 'mini' 
            ? "ml-2xs inline-flex h-md w-md items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all align-middle"
            : "px-xs py-2xs rounded-full bg-card border border-border text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"}
        >
          {variant === 'mini' ? '§' : `§${paragraph}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-4xl max-h-4xl overflow-y-auto p-0 rounded-premium border-primary/20 bg-card shadow-premium"
      >
        <div className="p-sm border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <Icons.Cross className="w-sm h-sm text-primary" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              CIC §{paragraph}
            </span>
          </div>
          {onNavigate && (
            <Button
              onClick={() => onNavigate(paragraph)}
              className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2xs"
            >
              Abrir completo
              <Icons.ArrowDown className="w-sm h-sm -rotate-90" />
            </Button>
          )}
        </div>
        <div className="p-sm">
          {isLoading && (
            <div className="space-y-xs py-xs">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-sm bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
              ))}
            </div>
          )}
          {!isLoading && isFetched && content && (
            <p className="text-xs leading-relaxed text-foreground/90 font-serif">
              {content.length > 300 ? content.slice(0, 300) + '…' : content}
            </p>
          )}
          {!isLoading && isFetched && !content && (
            <p className="text-xs text-muted-foreground italic">Texto não disponível.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default CatechismPopover;
