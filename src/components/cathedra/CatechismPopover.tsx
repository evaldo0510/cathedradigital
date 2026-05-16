import { Button   } from '@/components/cathedra/Button';
import React from 'react';
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

const CatechismPopover: React.FC<CatechismPopoverProps> = ({
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
            ? "ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-secondary/10 text-[9px] font-black text-secondary border-b border-secondary/20 hover:bg-secondary/20 transition-all align-middle"
            : "inline-flex items-center gap-1 font-serif text-[15px] font-bold text-secondary/80 hover:text-secondary border-b border-secondary/10 hover:border-secondary transition-all px-0.5 leading-none"}
        >
          {variant === 'mini' ? '§' : `§${paragraph}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 max-h-64 overflow-y-auto p-0 rounded-full border-primary/20"
      >
        <div className="p-3 border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Cross className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              CIC §{paragraph}
            </span>
          </div>
          {onNavigate && (
            <Button
              onClick={() => onNavigate(paragraph)}
              className="text-premium-tiny font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Abrir completo
              <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
            </Button>
          )}
        </div>
        <div className="p-3">
          {isLoading && (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
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
};

export default CatechismPopover;
