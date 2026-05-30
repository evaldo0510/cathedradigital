import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';

interface NotesPanelProps {
  contentType: 'magisterium' | 'catechism' | 'bible';
  contentId: string;
  contentLabel?: string;
}

const COLORS = [
  { id: 'primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { id: 'secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  { id: 'primary-soft', bg: 'bg-primary/5', border: 'border-primary/10' },
  { id: 'secondary-soft', bg: 'bg-secondary/5', border: 'border-secondary/10' },
];

const NotesPanel: React.FC<NotesPanelProps> = ({ contentType, contentId, contentLabel }) => {
  const { user } = useAuth();
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(contentType, contentId);
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!user) return null;

  const colorCfg = (id: string) => COLORS.find(c => c.id === id) || COLORS[0];

  const handleSave = async () => {
    if (!newNote.trim()) return;
    await addNote(contentId, newNote, selectedColor, {
      book_abbr: contentType === 'bible' ? contentId : undefined,
      chapter: contentType === 'bible' ? parseInt(contentId.split('_')[1] || '0') : undefined,
      paragraph: contentType === 'catechism' ? parseInt(contentId) : undefined,
    });
    setNewNote('');
  };

  const handleUpdate = async (noteId: string) => {
    if (!editText.trim()) return;
    await updateNote(noteId, editText);
    setEditingId(null);
  };

  return (
    <div className="relative inline-flex">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-spacing-2xs px-spacing-xs py-spacing-2xs rounded-full text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
          notes.length > 0
            ? 'bg-secondary/20 text-primary border border-secondary/30'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
        }`}
        title="Minhas Anotações"
        aria-label="Minhas Anotações"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icons.Book className="w-spacing-sm h-spacing-sm" />
        {notes.length > 0 && <span>{notes.length}</span>}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-spacing-xs w-spacing-4xl max-h-spacing-4xl overflow-y-auto bg-card border border-border rounded-premium shadow-premium-hover z-50 p-spacing-md space-y-spacing-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary">
              Anotações {contentLabel && <span className="text-muted-foreground font-normal normal-case">— {contentLabel}</span>}
            </h4>
            <Button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <Icons.ArrowDown className="w-spacing-md h-spacing-md rotate-180" />
            </Button>
          </div>

          {/* New note form */}
          <div className="space-y-spacing-xs">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Escreva sua anotação..."
              rows={2}
              className="w-full px-spacing-sm py-spacing-xs rounded-full border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-spacing-2xs">
                {COLORS.map(c => (
                  <Button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-spacing-md h-spacing-md rounded-full border-2 ${c.bg} ${selectedColor === c.id ? c.border : 'border-transparent'}`}
                  />
                ))}
              </div>
              <Button
                onClick={handleSave}
                disabled={!newNote.trim()}
                className="px-spacing-sm py-spacing-2xs rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-all"
              >
                Salvar
              </Button>
            </div>
          </div>

          {/* Existing notes */}
          {loading && <p className="text-xs text-muted-foreground italic text-center">Carregando...</p>}
          {notes.map(note => {
            const cfg = colorCfg(note.highlight_color);
            return (
              <div key={note.id} className={`rounded-full p-spacing-sm ${cfg.bg} border ${cfg.border} space-y-spacing-2xs`}>
                {editingId === note.id ? (
                  <div className="space-y-spacing-xs">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={2}
                      className="w-full px-spacing-xs py-spacing-2xs rounded-full border border-border bg-background text-foreground text-sm resize-none focus:outline-none"
                    />
                    <div className="flex gap-spacing-xs">
                      <Button onClick={() => handleUpdate(note.id)} className="text-xs font-bold text-primary">Salvar</Button>
                      <Button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground leading-relaxed">{note.note_text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-spacing-xs">
                        <Button
                          onClick={() => { setEditingId(note.id); setEditText(note.note_text); }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!loading && notes.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-spacing-xs">Nenhuma anotação ainda.</p>
          )}
        </div>
      )}
      {notes.length > 0 && (
        <div className="notes-panel-print hidden">
          {notes.map(note => (
            <div key={note.id} className="mb-spacing-xs">
              <span className="text-[8pt] text-gray-500">{new Date(note.created_at).toLocaleDateString()} — </span>
              {note.note_text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
