import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { useReadingMarks, ReadingMark } from '@/hooks/useReadingMarks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StudyJournal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'notes' | 'marks'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetching all notes (passing empty contentId but valid contentType logic needs to be checked)
  // useNotes expects contentType and optionally contentId. 
  // To fetch ALL notes for a user, we might need a modified hook or call fetch with different params.
  // Actually, let's look at useNotes.ts again.
  // It takes contentType and contentId. If contentId is null, it filters by user and contentType.
  // We want ALL notes across all contentTypes.
  
  const { notes: bibleNotes, updateNote: updateBibleNote, deleteNote: deleteBibleNote } = useNotes('bible');
  const { notes: catechismNotes, updateNote: updateCatechismNote, deleteNote: deleteCatechismNote } = useNotes('catechism');
  const { notes: magisteriumNotes, updateNote: updateMagisteriumNote, deleteNote: deleteMagisteriumNote } = useNotes('magisterium');
  
  const allNotes = useMemo(() => [
    ...bibleNotes,
    ...catechismNotes,
    ...magisteriumNotes
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), 
  [bibleNotes, catechismNotes, magisteriumNotes]);

  const { marks, deleteMark, updateMark } = useReadingMarks();
  
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return allNotes;
    const q = searchQuery.toLowerCase();
    return allNotes.filter(n => 
      n.note_text.toLowerCase().includes(q) || 
      n.content_id.toLowerCase().includes(q)
    );
  }, [allNotes, searchQuery]);

  const filteredMarks = useMemo(() => {
    // Exclude last_read marks from the general list as they are "system" marks
    const regularMarks = marks.filter(m => !m.is_last_read);
    if (!searchQuery) return regularMarks;
    const q = searchQuery.toLowerCase();
    return regularMarks.filter(m => 
      m.label?.toLowerCase().includes(q) || 
      m.content_id.toLowerCase().includes(q)
    );
  }, [marks, searchQuery]);

  const handleUpdateNote = async (note: UserNote, newText: string) => {
    if (note.content_type === 'bible') await updateBibleNote(note.id, newText);
    else if (note.content_type === 'catechism') await updateCatechismNote(note.id, newText);
    else if (note.content_type === 'magisterium') await updateMagisteriumNote(note.id, newText);
    toast.success('Anotação atualizada');
  };

  const handleDeleteNote = async (note: UserNote) => {
    if (note.content_type === 'bible') await deleteBibleNote(note.id);
    else if (note.content_type === 'catechism') await deleteCatechismNote(note.id);
    else if (note.content_type === 'magisterium') await deleteMagisteriumNote(note.id);
    toast.info('Anotação removida');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="flex bg-muted/30 p-2xs rounded-full border border-border/10">
          <Button
            variant={activeTab === 'notes' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('notes')}
            className={`rounded-full px-lg h-xl ${activeTab === 'notes' ? 'shadow-premium' : ''}`}
          >
            Anotações ({allNotes.length})
          </Button>
          <Button
            variant={activeTab === 'marks' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('marks')}
            className={`rounded-full px-lg h-xl ${activeTab === 'marks' ? 'shadow-premium' : ''}`}
          >
            Marcas ({marks.filter(m => !m.is_last_read).length})
          </Button>
        </div>

        <div className="relative w-full md:w-80">
          <Icons.Search className="absolute left-md top-2xs/2 -translate-y-1/2 w-md h-md text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="pl-xl rounded-full border-border/20 bg-muted/10 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'notes' ? (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-lg"
          >
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onUpdate={handleUpdateNote} 
                  onDelete={handleDeleteNote}
                  onNavigate={() => navigate(note.content_type === 'bible' ? `/bible?ref=${note.content_id}` : (note.content_type === 'catechism' ? `/catechism?p=${note.content_id}` : `/magisterium?doc=${note.content_id}`))}
                />
              ))
            ) : (
              <EmptyState icon={Icons.Book} message="Nenhuma anotação encontrada." />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="marks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-lg"
          >
            {filteredMarks.length > 0 ? (
              filteredMarks.map((mark) => (
                <MarkCard 
                  key={mark.id} 
                  mark={mark} 
                  onDelete={() => deleteMark(mark.id)}
                  onNavigate={() => navigate(mark.url || '#')}
                />
              ))
            ) : (
              <EmptyState icon={Icons.Bookmark} message="Nenhuma marca de leitura encontrada." />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NoteCard = ({ note, onUpdate, onDelete, onNavigate }: { 
  note: UserNote; 
  onUpdate: (note: UserNote, text: string) => void; 
  onDelete: (note: UserNote) => void;
  onNavigate: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.note_text);

  return (
    <motion.div
      layout
      className="bg-card border border-border/40 rounded-premium p-lg space-y-4 hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <div className="px-xs py-2xs rounded-full bg-primary/5 text-[9px] font-black uppercase tracking-widest text-primary">
            {note.content_type}
          </div>
          <span className="text-xs font-bold text-muted-foreground">{note.content_id}</span>
        </div>
        <div className="flex gap-2xs opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-xl w-xl rounded-full" onClick={() => setIsEditing(!isEditing)}>
            <Icons.PenLine className="w-sm h-sm" />
          </Button>
          <Button variant="ghost" size="icon" className="h-xl w-xl rounded-full text-destructive" onClick={() => onDelete(note)}>
            <Icons.Trash className="w-sm h-sm" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-muted/10 rounded-premium p-md text-sm font-serif leading-relaxed border-none focus:ring-1 focus:ring-primary/20 resize-none"
            rows={4}
          />
          <div className="flex justify-end gap-xs">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => { onUpdate(note, editText); setIsEditing(false); }}>Salvar</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm md:text-base font-serif italic leading-relaxed text-primary/80">
          "{note.note_text}"
        </p>
      )}

      <div className="flex items-center justify-between pt-xs">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {format(new Date(note.created_at), "d 'de' MMM, yy", { locale: ptBR })}
        </span>
        <Button variant="ghost" size="sm" className="h-lg text-[10px] font-bold uppercase tracking-widest" onClick={onNavigate}>
          Ver Contexto <Icons.ArrowRight className="ml-2xs w-sm h-sm" />
        </Button>
      </div>
    </motion.div>
  );
};

const MarkCard = ({ mark, onDelete, onNavigate }: { 
  mark: ReadingMark; 
  onDelete: () => void;
  onNavigate: () => void;
}) => (
  <motion.div
    layout
    className="bg-muted/10 border border-border/10 rounded-premium p-lg space-y-4 hover:bg-muted/20 transition-all group relative overflow-hidden"
  >
    <div className="flex items-center gap-sm">
      <div className="w-xl h-xl rounded-full bg-primary/5 flex items-center justify-center text-primary">
        <Icons.Bookmark className="w-md h-md" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3xs">{mark.content_type}</p>
        <h4 className="text-sm font-bold truncate">{mark.label || mark.content_id}</h4>
      </div>
    </div>

    <div className="flex items-center justify-between pt-xs">
      <span className="text-[10px] text-muted-foreground">
        {format(new Date(mark.created_at), "dd/MM/yyyy")}
      </span>
      <div className="flex gap-xs">
        <Button variant="ghost" size="icon" className="h-xl w-xl rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
          <Icons.Trash className="w-sm h-sm" />
        </Button>
        <Button size="sm" className="h-xl rounded-full text-[10px] font-bold uppercase tracking-widest" onClick={onNavigate}>
          Continuar
        </Button>
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="col-span-full py-3xl text-center opacity-30">
    <Icon className="w-2xl h-2xl mx-auto mb-md stroke-1" />
    <p className="font-serif italic">{message}</p>
  </div>
);

export default StudyJournal;
