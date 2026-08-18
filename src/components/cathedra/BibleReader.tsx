import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { BibleBook } from '@/data/bible-books';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';
import {
  ReaderShell,
  NexusPanel,
  ReaderContinuation,
  EditorialHero,
  CatechesisContext,
} from '@/components/reader';
import { resolveBibleAutoNexus } from '@/core/knowledge/adapters/bibleAutoNexus';
import SacredImage from './SacredImage';

interface Verse {
  number: number;
  text: string;
}

interface BibleReaderProps {
  book: BibleBook;
  chapter: number;
  verses: Verse[];
  isLoading: boolean;
  settings: any;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onVerseAction: (verse: Verse) => void;
  highlights: Record<string, string>;
  connections: Record<string, any[]>;
  onConnectionClick: (connection: any) => void;
}

/**
 * BibleReader — C0.5.b (Parallel Readers Migration).
 * Envolvido em `ReaderShell` conforme Regra §10 do COS (Reader Architecture Rule).
 * hero → EditorialHero; nexus → NexusPanel; continuation → ReaderContinuation.
 */
export const BibleReader: React.FC<BibleReaderProps> = ({
  book,
  chapter,
  verses,
  isLoading,
  settings,
  onPrevChapter,
  onNextChapter,
  onVerseAction,
  highlights,
  connections,
  onConnectionClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollPos = window.scrollY;
      if (verses.length > 100) {
        const index = Math.floor(scrollPos / 100);
        setVisibleRange({
          start: Math.max(0, index - 20),
          end: Math.min(verses.length, index + 40),
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [verses.length]);

  const displayedVerses = verses.length > 100
    ? verses.slice(visibleRange.start, visibleRange.end)
    : verses;

  const paddingTop = verses.length > 100 ? visibleRange.start * 40 : 0;
  const paddingBottom = verses.length > 100 ? (verses.length - visibleRange.end) * 40 : 0;

  const heroKicker = `${t('bible_reader_kicker')}${book.category ? ` · ${book.category}` : ''}`;
  const heroSubtitle = book.chapterTitles?.[chapter] || book.description;
  const heroMeta = book.author ? `${book.author}${book.date ? ` · ${book.date}` : ''}` : undefined;

  const nexus = useMemo(
    () => resolveBibleAutoNexus({ bookAbbr: book.abbr, bookName: book.name, chapter }),
    [book.abbr, book.name, chapter],
  );

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Desktop Sidebar: Sacred Image/Icon */}
      <div className="hidden md:flex md:w-[40%] sticky top-0 h-screen overflow-hidden bg-primary/5 border-r border-primary/5">
        <SacredImage 
          src={undefined} // Bible content often uses a generic sacred icon or text-based hero
          className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
          alt={book.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-spacing-xl">
           <div className="text-center space-y-spacing-md">
             <div className="w-spacing-4xl h-spacing-4xl mx-auto rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-premium">
               <Icons.BookOpen className="w-spacing-xl h-spacing-xl text-secondary" />
             </div>
             <h2 className="font-display text-4xl text-primary/40 tracking-widest uppercase">{book.abbr}</h2>
           </div>
        </div>
      </div>

      <div className="flex-1">
        <ReaderShell
          className="pb-32"
          contentMaxWidth="max-w-3xl"
          ariaLabel={`${t('bible_reader_kicker')} — ${book.name} ${chapter}`}
          hero={
            <EditorialHero
              kicker={heroKicker}
              title={`${book.name} · ${t('bible_chapter_title')} ${chapter}`}
              subtitle={typeof heroSubtitle === 'string' ? heroSubtitle : undefined}
              meta={heroMeta}
              align="left"
              size="lg"
            />
          }
          headerContext={
            <CatechesisContext
              moduleTitle="Bíblia Sagrada"
              part={book.category || undefined}
              section={book.name}
              chapter={String(chapter)}
            />
          }
          nexus={
            <NexusPanel
              output={nexus}
              kicker={`${t('connections_kicker')} ${book.name} ${chapter}`}
            />
          }
          continuation={
            <ReaderContinuation
              context={{
                kind: 'bible',
                id: `${book.abbr}-${chapter}`,
                graphNodeId: nexus.selfId ?? undefined,
                meta: {
                  bookAbbr: book.abbr,
                  chapter,
                  totalChapters: book.chapters,
                },
              }}
              suggestions={nexus.suggestions.length > 0 ? nexus.suggestions : undefined}
            />
          }
        >
      {chapter === 1 && (book.context || book.themes) && (
        <div className="mb-spacing-2xl">
          <div className="p-6 rounded-2xl bg-primary/[0.02] border border-primary/5 text-left space-y-4">
            <h2 className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium">
              {t('intro_to_book')}
            </h2>
            {book.context && (
              <p className="text-sm font-serif italic leading-relaxed text-primary/70">
                {book.context}
              </p>
            )}
            {book.themes && (
              <div className="pt-2 border-t border-primary/5">
                <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary/50 block mb-2">
                  {t('main_themes')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {book.themes.map(t => (
                    <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary/80">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          'space-y-6',
          settings.fontSize === 'small' ? 'text-lg' : settings.fontSize === 'large' ? 'text-2xl' : 'text-xl',
          settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans',
        )}
        style={{ paddingTop, paddingBottom }}
      >
        {isLoading ? (
          <div className="space-y-8 py-10">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-primary/5 rounded w-full" />
                <div className="h-4 bg-primary/5 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          displayedVerses.map((v) => {
            const verseKey = `${book.abbr}-${chapter}-${v.number}`;
            const highlightColor = highlights[verseKey];
            const verseConnections = connections[verseKey] || [];
            const finalConnections = verseConnections.length > 0 ? verseConnections : (connections['all'] || []);

            return (
              <motion.div
                key={v.number}
                id={`verse-${v.number}`}
                onClick={() => onVerseAction(v)}
                className={cn(
                  'relative group cursor-pointer transition-all duration-300 rounded-lg p-3 -mx-2',
                  highlightColor ? `bg-${highlightColor}/10` : 'hover:bg-primary/[0.02]',
                )}
              >
                <div className="flex items-start gap-4">
                  <sup className="mt-2 text-[10px] font-medium text-secondary/70 select-none tabular-nums tracking-wider">
                    {v.number}
                  </sup>
                  <p className={cn(
                    'leading-relaxed transition-colors font-serif',
                    settings.theme === 'night' ? 'text-stone-300' : 'text-primary/90',
                  )}>
                    {v.text}
                  </p>
                </div>

                {finalConnections.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 ml-6">
                    {finalConnections.map((conn, idx) => {
                      const isEssential = conn.relevance_level === 'essential' || conn.relevance === 'essential';
                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onConnectionClick(conn);
                          }}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all hover:scale-105 active:scale-95',
                            conn.id === 'coming-soon'
                              ? 'bg-primary/[0.03] border-primary/5 text-primary/30'
                              : isEssential
                                ? 'bg-secondary/20 border-secondary/40 text-secondary shadow-sm shadow-secondary/10'
                                : 'bg-primary/[0.04] border-primary/10 text-primary/60',
                          )}
                        >
                          <div className={cn(
                            'w-1.5 h-1.5 rounded-full animate-pulse',
                            conn.color || (isEssential ? 'bg-secondary' : 'bg-primary/40'),
                          )} />
                          <div className="flex flex-col items-start leading-none">
                            <h4 className="text-[8px] font-black uppercase tracking-widest">{conn.label}</h4>
                            {conn.theological_theme && (
                              <span className="text-[6px] font-bold uppercase tracking-tight opacity-60">{conn.theological_theme}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Navigation flutuante — preserva contexto de leitura */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pointer-events-none z-20">
        <div className="max-w-lg mx-auto flex justify-between items-center pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevChapter}
            disabled={chapter === 1}
            className="w-12 h-12 rounded-full bg-background/80 backdrop-blur border border-primary/5 shadow-premium"
            aria-label={t('prev_chapter')}
          >
            <Icons.ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextChapter}
            disabled={chapter >= book.chapters}
            className="w-12 h-12 rounded-full bg-background/80 backdrop-blur border border-primary/5 shadow-premium"
            aria-label={t('next_chapter')}
          >
            <Icons.ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
        </ReaderShell>
      </div>
    </div>
  );
};
