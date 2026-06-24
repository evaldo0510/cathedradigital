import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { BIBLE_DATA } from '@/data/bible-books';
import { NoteEditModal } from './NoteEditModal';

interface BibleFullNotesListProps {
  onSelectReference: (bookAbbrev: string, chapter: number, verse: number) => void;
  onClose: () => void;
  onEditNote?: (noteId: string, text: string, color: string) => void;
  onDeleteNote?: (noteId: string) => void;
}


const BibleFullNotesList: React.FC<BibleFullNotesListProps> = ({ 
  onSelectReference, 
  onClose,
  onEditNote,
  onDeleteNote 
}) => {
  const { notes, loading } = useNotes('bible');
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);


  // Group notes by book and chapter
  const groupedNotes = notes.reduce((acc: any, note) => {
    const key = `${note.book_abbr}-${note.chapter}`;
    if (!acc[key]) {
      // Find book name
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const book = allBooks.find(b => b.abbr === note.book_abbr);
      acc[key] = {
        bookName: book?.name || note.book_abbr,
        bookAbbr: note.book_abbr,
        chapter: note.chapter,
        notes: []
      };
    }
    acc[key].notes.push(note);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF9F6] flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b border-primary/5">
        <button onClick={onClose} aria-label="Fechar notas" className="p-2 -ml-2 min-h-11 min-w-11 flex items-center justify-center text-primary/40 active:text-secondary">
          <Icons.X className="w-6 h-6" aria-hidden="true" />
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80">Minhas Reflexões</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Icons.Loader className="w-6 h-6 text-secondary animate-spin" />
          </div>
        )}

        {Object.keys(groupedNotes).length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 py-20">
            <Icons.BookOpen className="w-12 h-12" />
            <p className="text-sm font-black uppercase tracking-widest italic">Ainda não há anotações</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.values(groupedNotes).map((group: any) => (
              <section key={`${group.bookAbbr}-${group.chapter}`} className="space-y-4">
                <header className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-secondary/80">
                    {group.bookName} {group.chapter}
                  </h2>
                  <div className="flex-1 h-px bg-primary/5" />
                </header>

                <div className="space-y-4">
                  {group.notes.map((note: UserNote) => (
                    <div 
                      key={note.id}
                      className="p-4 bg-white border border-primary/5 rounded-xl shadow-sm relative group"
                    >
                      <button 
                        onClick={() => onSelectReference(note.book_abbr!, note.chapter!, note.verse || 1)}
                        className="w-full text-left space-y-2"
                      >
                        <span className="text-[9px] font-black text-primary/30 uppercase tracking-widest block">
                          Versículo {note.verse}
                        </span>
                        <p className="font-serif italic text-primary/80 leading-relaxed">
                          "{note.note_text}"
                        </p>
                      </button>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingNote(note)}
                          className="p-2 text-primary/20 hover:text-secondary transition-colors"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteNote?.(note.id)}
                          className="p-2 text-destructive/20 hover:text-destructive transition-colors"
                        >
                          <Icons.X className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
      <NoteEditModal 
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onSave={(text, color) => {
          if (editingNote && onEditNote) {
            onEditNote(editingNote.id, text, color);
            setEditingNote(null);
          }
        }}
        initialText={editingNote?.note_text}
        initialColor={editingNote?.highlight_color}
        title="Editar Reflexão"
        isEditing={true}
        onDelete={() => {
          if (editingNote && onDeleteNote) {
            onDeleteNote(editingNote.id);
            setEditingNote(null);
          }
        }}
      />
    </div>

              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleFullNotesList;
