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
import { BOOK_NAME_BY_ABBR } from '@/lib/bibleCanon';

interface BibleVersePopoverProps {
  abbr: string;
  chapter: number;
  verse?: number;
  label: string;
  /** Optional override; defaults to navigating to /bible?book=&ch=&v= */
  onNavigate?: (abbr: string, chapter: number, verse?: number) => void;
}

const sanitizeBookName = (raw: unknown, abbr: string): string => {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value && value.toLowerCase() !== 'undefined' && value.toLowerCase() !== 'null') {
    return value;
  }
  return BOOK_NAME_BY_ABBR[abbr] || abbr;
};


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
  const [bookName, setBookName] = useState<string>(() => sanitizeBookName(undefined, abbr));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const safeLabel = (label && label !== 'undefined') ? label : `${sanitizeBookName(undefined, abbr)} ${chapter}${verse ? `,${verse}` : ''}`;
  const headerTitle = `${bookName} ${chapter}${verse ? `,${verse}` : ''} (NAA)`;

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
    setErrorMsg(null);
    const correlationId = `bvp-${abbr}-${chapter}-${Date.now()}`;
    try {
      console.info('[BibleVersePopover] invoke bible-text', { abbrev: abbr, chapter, verse, correlationId });
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { abbrev: abbr, chapter },
        headers: { 'x-correlation-id': correlationId },
      });
      if (error) {
        console.warn('[BibleVersePopover] edge error', { correlationId, error });
        setErrorMsg('Não foi possível carregar este trecho agora.');
      }
      const incoming = Array.isArray(data?.verses) ? data.verses : [];
      setBookName(sanitizeBookName(data?.book, abbr));

      if (incoming.length === 0) {
        console.warn('[BibleVersePopover] empty verses payload', { correlationId, data });
        setErrorMsg(prev => prev || 'Texto indisponível para esta passagem.');
      } else if (verse) {
        const idx = incoming.findIndex((v: any) => Number(v.number) === Number(verse));
        if (idx === -1) {
          // Versículo não encontrado: mostra os primeiros como contexto sem deixar "undefined"
          setVerses(incoming.slice(0, 3));
        } else {
          const start = Math.max(0, idx - 1);
          const end = Math.min(incoming.length, idx + 3);
          setVerses(incoming.slice(start, end));
        }
      } else {
        setVerses(incoming.slice(0, 5));
      }
    } catch (e) {
      console.error('[BibleVersePopover] fetch crashed', { correlationId, error: e });
      setErrorMsg('Erro ao carregar versículo.');
      setVerses([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  const renderVerseText = (text: unknown): string => {
    if (typeof text !== 'string' || !text.trim()) return '…';
    if (text.toLowerCase() === 'undefined') return '…';
    return text;
  };

  return (
    <Popover onOpenChange={(open) => open && fetchVerses()}>
      <PopoverTrigger asChild>
        <Button
          className="px-spacing-xs py-spacing-2xs rounded-premium-full bg-card border border-border text-premium-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {safeLabel}
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
              {headerTitle}
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
                  {renderVerseText(v.text)}
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
            <p className="text-premium-xs text-muted-foreground italic">
              {errorMsg || 'Texto não disponível.'}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default BibleVersePopover;
