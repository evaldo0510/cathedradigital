import { Button } from '@/components/ui/button';
import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icons } from '../../constants';
import { buildBibleUrl } from '@/lib/bibleUrl';

interface BibleVersePopoverProps {
  abbr: string;
  chapter: number;
  verse?: number;
  label: string;
  /** Optional override; defaults to navigating to /bible?book=&ch=&v= */
  onNavigate?: (abbr: string, chapter: number, verse?: number) => void;
}

const BibleVersePopover: React.FC<BibleVersePopoverProps> = memo(({
  abbr,
  chapter,
  verse,
  label,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(abbr, chapter, verse);
      return;
    }
    navigate(buildBibleUrl({ abbr, chapter, verse }));
  };

  const fetchVerses = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { abbrev: abbr, chapter },
      });
      if (!error && data?.verses) {
        if (verse) {
          // Show the specific verse and a couple around it for context
          const idx = data.verses.findIndex((v: any) => v.number === verse);
          const start = Math.max(0, idx - 1);
          const end = Math.min(data.verses.length, idx + 3);
          setVerses(data.verses.slice(start, end));
        } else {
          // Show first 5 verses as preview
          setVerses(data.verses.slice(0, 5));
        }
      }
    } catch {
      setVerses([{ number: 0, text: 'Erro ao carregar versículo.' }]);
    }
    setLoading(false);
    setFetched(true);
  };

  return (
    <Popover onOpenChange={(open) => open && fetchVerses()}>
      <PopoverTrigger asChild>
        <Button
          className="px-spacing-xs py-spacing-2xs rounded-premium-full bg-card border border-border text-premium-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-spacing-4xl max-h-spacing-4xl overflow-y-auto p-spacing-0 rounded-premium border-primary/20 bg-card shadow-premium"
      >
        <div className="p-spacing-sm border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-spacing-xs">
            <Icons.Book className="w-spacing-sm h-spacing-sm text-primary" />
            <span className="text-premium-xs font-black uppercase tracking-wider text-primary">
              {label}
            </span>
          </div>
          <Button
            onClick={handleNavigate}
            className="text-premium-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-spacing-2xs"
          >
            {verse ? `Ir ao versículo ${verse}` : 'Abrir completo'}
            <Icons.ArrowDown className="w-spacing-sm h-spacing-sm -rotate-90" />
          </Button>
        </div>
        <div className="p-spacing-sm space-y-spacing-xs">
          {loading && (
            <div className="space-y-spacing-xs py-spacing-xs">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-spacing-sm bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
              ))}
            </div>
          )}
          {!loading && verses.length > 0 && (
            <>
              {verses.map(v => (
                <p key={v.number} className="text-premium-xs leading-relaxed text-foreground/90">
                  <sup className="text-primary font-bold mr-spacing-2xs">{v.number}</sup>
                  {v.text}
                </p>
              ))}
              {!verse && (
                <p className="text-premium-xs text-muted-foreground italic pt-spacing-2xs border-t border-border">
                  Mostrando primeiros versículos...
                </p>
              )}
            </>
          )}
          {!loading && fetched && verses.length === 0 && (
            <p className="text-premium-xs text-muted-foreground italic">Texto não disponível.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default BibleVersePopover;
