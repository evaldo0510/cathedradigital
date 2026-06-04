import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icons } from '@/constants';
import { Skeleton } from '@/components/ui/skeleton';

interface BibleDictionaryPopoverProps {
  term: string;
  children: React.ReactNode;
}

const BibleDictionaryPopover: React.FC<BibleDictionaryPopoverProps> = ({ term, children }) => {
  const { data: entry, isLoading } = useQuery({
    queryKey: ['glossary-term', term],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary')
        .select('*')
        .ilike('term', term)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="underline decoration-primary/20 decoration-dotted underline-offset-4 hover:decoration-primary transition-all cursor-help text-left">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-spacing-lg rounded-premium-lg border-primary/10 shadow-premium-hover bg-background/95 backdrop-blur-xl">
        {isLoading ? (
          <div className="space-y-spacing-sm">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : entry ? (
          <div className="space-y-spacing-md">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-premium-md text-primary">{entry.term}</h4>
              <Icons.Glossary className="w-spacing-md h-spacing-md text-primary/20" />
            </div>
            <p className="text-premium-xs leading-relaxed text-muted-foreground italic">
              {entry.definition}
            </p>
            {entry.deep_interpretation && (
              <div className="pt-spacing-sm border-t border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-spacing-xs">Contexto Teológico</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {entry.deep_interpretation}
                </p>
              </div>
            )}
            {entry.reference && (
              <p className="text-[9px] text-primary/30 text-right italic">— {entry.reference}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-spacing-md space-y-spacing-sm">
            <Icons.Info className="w-spacing-lg h-spacing-lg text-primary/10 mx-auto" />
            <p className="text-premium-xs text-muted-foreground italic">Termo em catalogação nos arquivos da Cathedra.</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default BibleDictionaryPopover;