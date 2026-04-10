import React, { useState } from 'react';
import { Icons } from '../../constants';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';

interface NotesPanelProps {
  contentType: 'magisterium' | 'catechism';
  contentId: string;
  contentLabel?: string;
}

const COLORS = [
  { id: 'yellow', bg: 'bg-secondary dark:bg-amber-900/30', border: 'border-secondary dark:border-amber-700' },
  { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-primary' },
  { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-700' },
  { id: 'pink', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-300 dark:border-rose-700' },
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
    await addNote(contentId, newNote, selectedColor);
    setNewNote('');
  };

  const handleUpdate = async (noteId: string) => {
    if (!editText.trim()) return;
    await updateNote(noteId, editText);
    setEditingId(null);
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
          notes.length > 0
            ? 'bg-secondary text-amber-800 dark:bg-amber-900/30 dark:text-secondary'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
        }`}
        title="Minhas Anotações"
      >
        <Icons.Book className="w-3.5 h-3.5" />
        {notes.length > 0 && <span>{notes.length}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl z-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary">
              Anotações {contentLabel && <span className="text-muted-foreground font-normal normal-case">— {contentLabel}</span>}
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <Icons.ArrowDown className="w-4 h-4 rotate-180" />
            </button>
          </div>

          {/* New note form */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Escreva sua anotação..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-5 h-5 rounded-full border-2 ${c.bg} ${selectedColor === c.id ? c.border : 'border-transparent'}`}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!newNote.trim()}
                className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-all"
              >
                Salvar
              </button>
            </div>
          </div>

          {/* Existing notes */}
          {loading && <p className="text-xs text-muted-foreground italic text-center">Carregando...</p>}
          {notes.map(note => {
            const cfg = colorCfg(note.highlight_color);
            return (
              <div key={note.id} className={`rounded-xl p-3 ${cfg.bg} border ${cfg.border} space-y-1`}>
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(note.id)} className="text-[10px] font-bold text-primary">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-[10px] text-muted-foreground">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground leading-relaxed">{note.note_text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingId(note.id); setEditText(note.note_text); }}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-[10px] text-destructive hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!loading && notes.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-2">Nenhuma anotação ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
