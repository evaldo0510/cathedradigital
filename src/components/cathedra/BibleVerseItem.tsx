import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Icons } from '../../constants';
import CatechismPopover from './CatechismPopover';
import NotesPanel from './NotesPanel';
import ReadingMark from './ReadingMark';

interface BibleVerseItemProps {
  verse: { number: number; text: string };
  index: number;
  isHighlighted: boolean;
  onHighlight: (num: number) => void;
  fontSize: string;
  activeFont: any;
  currentChapterNotes: any[];
  relatedP?: number[];
  selectedBook: any;
  selectedChapter: number;
  onNavigateToCIC: (p: number) => void;
  onDeleteNote: (id: string) => void;
  onSetActiveHighlight: (note: any) => void;
}

export const BibleVerseItem: React.FC<BibleVerseItemProps> = ({
  verse: v,
  index,
  isHighlighted,
  onHighlight,
  activeFont,
  currentChapterNotes,
  relatedP,
  selectedBook,
  selectedChapter,
  onNavigateToCIC,
  onDeleteNote,
  onSetActiveHighlight,
}) => {
  return (
    <motion.div 
      id={`v${v.number}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.02, 0.2), ease: [0.19, 1, 0.22, 1] }}
      className={cn(
        "group relative transition-all duration-700",
        isHighlighted ? 'bg-primary/[0.02] -mx-4 px-4 py-8 rounded-2xl shadow-sm border border-primary/5' : 'py-3'
      )}
    >
      <div className="flex items-start gap-6 md:gap-10">
        <span className="text-[0.6em] font-display font-medium text-primary/10 mt-5 select-none group-hover:text-primary/30 transition-all duration-500 min-w-[2rem] text-right italic">
          {v.number}
        </span>
        
        <div className="flex-1 cursor-text" onClick={() => onHighlight(v.number)}>
          <p className={cn(
            "font-reader text-foreground/80 group-hover:text-foreground/95 transition-all duration-500 ease-out",
            activeFont.size,
            activeFont.leading,
            activeFont.letterSpacing
          )}>
            {currentChapterNotes.some(n => n.verse === v.number && n.highlight_color) ? (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  const note = currentChapterNotes.find(n => n.verse === v.number && n.highlight_color);
                  if (note) onSetActiveHighlight(note);
                }}
                className={`highlight-${currentChapterNotes.find(n => n.verse === v.number)?.highlight_color} px-1.5 py-0.5 rounded-sm mr-1 cursor-pointer hover:brightness-95 transition-all decoration-secondary/20 decoration-1 underline-offset-[6px]`}
              >
                {v.text}
              </span>
            ) : (
              <span className="opacity-90 leading-relaxed">{v.text}</span>
            )}

            {relatedP && (
              <span className="inline-flex gap-1.5 ml-3 align-middle opacity-20 group-hover:opacity-100 transition-all duration-700">
                {relatedP.map(p => (
                  <CatechismPopover key={p} paragraph={p} onNavigate={onNavigateToCIC} variant="mini" />
                ))}
              </span>
            )}
          </p>
          
          {/* Inline Notes */}
          {currentChapterNotes.filter(n => n.verse === v.number).map(note => (
            <div 
              key={note.id}
              className="mt-6 p-6 bg-primary/[0.01] border-l border-primary/10 rounded-r-2xl text-sm italic text-muted-foreground/60 group/note relative animate-in slide-in-from-left-2 duration-500"
            >
              <div className="flex items-center gap-2 mb-3 opacity-30">
                <Icons.Feather className="w-3 h-3" />
                <span className="text-[7px] font-black uppercase tracking-[0.3em]">Meditação</span>
              </div>
              <span className="leading-relaxed font-serif">{note.note_text}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                className="absolute top-4 right-4 opacity-0 group-hover/note:opacity-100 transition-opacity p-1.5 hover:text-destructive/60"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0 pt-2">
          <NotesPanel contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} contentLabel={`${selectedBook.abbr} ${selectedChapter}:${v.number}`} />
          <ReadingMark contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} label={`${selectedBook.name} ${selectedChapter}:${v.number}`} chapter={selectedChapter} position={v.number} />
        </div>
      </div>
    </motion.div>
  );
};
