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
    <Card className="bg-primary/[0.02] border-primary/5 rounded-premium overflow-hidden mt-12 mb-12">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Icons.BookOpen className="w-5 h-5 text-primary/40" />
          <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">{title}</h3>
          <span className="ml-auto bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <button 
              key={note.id} 
              className="group p-5 bg-card border border-border/40 rounded-3xl hover:border-primary/20 transition-all text-left relative focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={() => onNoteClick?.(note)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-1.5 h-12 rounded-full flex-shrink-0 bg-primary/10`} />
                <div className="space-y-1 pr-8">
                  <div className="flex items-center gap-2">
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
                  className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                >
                  <Icons.X className="w-3 h-3" />
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
