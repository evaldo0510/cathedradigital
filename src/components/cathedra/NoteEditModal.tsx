import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { UserNote } from '@/hooks/useNotes';

interface NoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, color: string) => void;
  initialText?: string;
  initialColor?: string;
  title?: string;
}

const COLORS = [
  { name: 'yellow', value: 'bg-yellow-200/60 dark:bg-yellow-500/30', border: 'border-yellow-400' },
  { name: 'green', value: 'bg-green-200/60 dark:bg-green-500/30', border: 'border-green-400' },
  { name: 'blue', value: 'bg-blue-200/60 dark:bg-blue-500/30', border: 'border-blue-400' },
  { name: 'red', value: 'bg-red-200/60 dark:bg-red-500/30', border: 'border-red-400' },
];

export const NoteEditModal: React.FC<NoteEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialText = '', 
  initialColor = 'yellow',
  title = "Minha Reflexão"
}) => {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState(initialColor);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setColor(initialColor);
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen, initialText, initialColor]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onSave(text, color);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-display font-light text-primary uppercase tracking-widest">{title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/20 italic">Scriptum Sanctuarium</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full opacity-40 hover:opacity-100">
                <Icons.X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 px-1">Cor do Destaque</p>
              <div className="flex gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`w-10 h-10 rounded-full ${c.value} border-2 transition-all hover:scale-110 flex items-center justify-center ${
                      color === c.name ? 'border-primary shadow-lg ring-4 ring-primary/5' : 'border-white/20'
                    }`}
                  >
                    {color === c.name && <Icons.Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 px-1">Anotação</p>
               <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="O que esta passagem diz ao seu coração?"
                rows={4}
                className="w-full bg-primary/[0.02] border border-primary/5 rounded-3xl p-6 text-foreground font-serif italic text-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-primary/10 resize-none"
               />
               <p className="text-center text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">Atalho: Ctrl + Enter para salvar</p>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => onSave(text, color)}
                className="flex-2 h-14 bg-primary text-primary-foreground rounded-2xl px-12 text-[11px] font-bold uppercase tracking-widest shadow-premium hover:shadow-premium-hover transition-all"
              >
                Salvar Reflexão
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};