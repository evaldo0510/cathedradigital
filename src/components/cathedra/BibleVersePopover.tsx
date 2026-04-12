import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icons } from '../../constants';

interface BibleVersePopoverProps {
  abbr: string;
  chapter: number;
  verse?: number;
  label: string;
  onNavigate?: (abbr: string, chapter: number) => void;
}

const BibleVersePopover: React.FC<BibleVersePopoverProps> = ({
  abbr,
  chapter,
  verse,
  label,
  onNavigate,
}) => {
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

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
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onNavigate) {
              onNavigate(abbr, chapter);
            } else {
              fetchVerses();
            }
          }}
          onMouseEnter={fetchVerses}
          className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 max-h-64 overflow-y-auto p-0 rounded-2xl border-primary/20"
      >
        <div className="p-3 border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Book className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              {label}
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate(abbr, chapter)}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Abrir completo
              <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
            </button>
          )}
        </div>
        <div className="p-3 space-y-2">
          {loading && (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
              ))}
            </div>
          )}
          {!loading && verses.length > 0 && (
            <>
              {verses.map(v => (
                <p key={v.number} className="text-xs leading-relaxed text-foreground/90">
                  <sup className="text-primary font-bold mr-1">{v.number}</sup>
                  {v.text}
                </p>
              ))}
              {!verse && (
                <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border">
                  Mostrando primeiros versículos...
                </p>
              )}
            </>
          )}
          {!loading && fetched && verses.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Texto não disponível.</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default BibleVersePopover;
