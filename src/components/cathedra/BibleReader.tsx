import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { BibleBook } from '@/data/bible-books';
import { Button } from '@/components/ui/button';

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
  onConnectionClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Virtualization logic simplified for this component
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      // Heuristic for large chapters like Psalm 119
      if (verses.length > 100) {
        const index = Math.floor(scrollPos / 100);
        setVisibleRange({
          start: Math.max(0, index - 20),
          end: Math.min(verses.length, index + 40)
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

  return (
    <div className="relative pb-32">
      {/* Book Title & Context */}
      <div className="px-6 py-10 text-center space-y-4">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl text-primary/80 uppercase tracking-tighter"
        >
          {book.name}
        </motion.h2>
        
        {book.description && (
          <p className="text-sm font-serif italic text-primary/60 max-w-xs mx-auto">
            {book.description}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="h-px w-8 bg-primary/10" />
          <span className="font-display text-xl text-secondary">Capítulo {chapter}</span>
          <div className="h-px w-8 bg-primary/10" />
        </div>

        {book.chapterTitles?.[chapter] && (
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-display text-primary/70 italic"
          >
            {book.chapterTitles[chapter]}
          </motion.h3>
        )}
        
        {book.context && chapter === 1 && (
          <div className="mt-8 p-6 rounded-3xl bg-primary/[0.02] border border-primary/5 text-left space-y-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Contexto do Livro</span>
             <p className="text-sm font-serif leading-relaxed text-primary/70">
               {book.context}
             </p>
          </div>
        )}
      </div>

      {/* Verses Container */}
      <div 
        ref={containerRef}
        className={cn(
          "px-8 space-y-6 max-w-2xl mx-auto",
          settings.fontSize === 'small' ? 'text-lg' : settings.fontSize === 'large' ? 'text-2xl' : 'text-xl',
          settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
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

            return (
              <motion.div 
                key={v.number}
                id={`verse-${v.number}`}
                onClick={() => onVerseAction(v)}
                className={cn(
                  "relative group cursor-pointer transition-all duration-300 rounded-lg p-1 -m-1",
                  highlightColor ? `bg-${highlightColor}/10` : "hover:bg-primary/[0.02]"
                )}
              >
                <div className="flex items-start gap-3">
                  <sup className="mt-2 text-xs font-bold text-secondary/60 select-none">
                    {v.number}
                  </sup>
                  <p className={cn(
                    "leading-relaxed transition-colors",
                    settings.theme === 'night' ? 'text-stone-300' : 'text-primary/90'
                  )}>
                    {v.text}
                  </p>
                </div>

                {/* Connections indicator */}
                {verseConnections.length > 0 && (
                  <div className="flex gap-1 mt-2 ml-6">
                    {verseConnections.map((conn, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnectionClick(conn);
                        }}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          conn.color || "bg-secondary/40"
                        )}
                        title={conn.label}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pointer-events-none">
        <div className="max-w-lg mx-auto flex justify-between items-center pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPrevChapter}
            disabled={chapter === 1}
            className="w-12 h-12 rounded-full bg-background/80 backdrop-blur border border-primary/5 shadow-premium"
          >
            <Icons.ChevronLeft className="w-6 h-6" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNextChapter}
            disabled={chapter >= book.chapters}
            className="w-12 h-12 rounded-full bg-background/80 backdrop-blur border border-primary/5 shadow-premium"
          >
            <Icons.ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
