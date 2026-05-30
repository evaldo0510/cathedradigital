import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/constants';
import { UserNote } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';

interface ChapterNotesListProps {
  notes: UserNote[];
  onNoteClick?: (note: UserNote) => void;
  onDeleteNote?: (noteId: string) => void;
  title?: string;
}

const ChapterNotesList: React.FC<ChapterNotesListProps> = ({ 
  notes, 
  onNoteClick, 
  onDeleteNote,
  title = "Minhas Reflexões no Capítulo" 
}) => {
  if (notes.length === 0) return null;

  return (
    <Card className="bg-primary/[0.02] border-primary/5 rounded-premium overflow-hidden mt-2xl mb-2xl">
      <div className="p-lg md:p-xl space-y-6">
        <div className="flex items-center gap-sm">
          <Icons.BookOpen className="w-md h-md text-primary/40" />
          <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">{title}</h3>
          <span className="ml-auto bg-primary/10 text-primary text-[10px] font-black px-xs py-3xs rounded-full">
            {notes.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {notes.map((note) => (
            <button 
              key={note.id} 
              className="group p-md bg-card border border-border/40 rounded-premium hover:border-primary/20 transition-all text-left relative focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={() => onNoteClick?.(note)}
            >
              <div className="flex items-start gap-sm">
                <div className={`w-2xs h-2xl rounded-full flex-shrink-0 bg-primary/10`} />
                <div className="space-y-1 pr-xl">
                  <div className="flex items-center gap-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">
                      {note.verse ? `Versículo ${note.verse}` : note.paragraph ? `§${note.paragraph}` : 'Geral'}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40 font-bold tracking-widest">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 italic line-clamp-3 leading-relaxed">
                    "{note.note_text}"
                  </p>
                </div>
              </div>
              
              {onDeleteNote && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-xs right-xs h-lg w-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                >
                  <Icons.X className="w-sm h-sm" />
                </Button>
              )}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ChapterNotesList;
