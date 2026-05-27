import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlighter, FileText, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextSelectionToolbarProps {
  onHighlight: (color: string) => void;
  onAddNote: () => void;
  onDeleteHighlight?: () => void;
  onAskLogos?: (text: string) => void;
  activeHighlightId?: string | null;
  activeColor?: string | null;
}

export const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({ 
  onHighlight, 
  onAddNote,
  onDeleteHighlight,
  activeHighlightId,
  activeColor
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(selection.toString());
        setPosition({
          top: rect.top + window.scrollY - 60,
          left: rect.left + rect.width / 2
        });
      } else {
        // Only clear if clicking outside the toolbar
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setPosition(null);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const highlightColors = [
    { name: 'yellow', value: 'bg-yellow-200/60 dark:bg-yellow-500/30' },
    { name: 'green', value: 'bg-green-200/60 dark:bg-green-500/30' },
    { name: 'blue', value: 'bg-blue-200/60 dark:bg-blue-500/30' },
    { name: 'red', value: 'bg-red-200/60 dark:bg-red-500/30' }
  ];

  return (
    <AnimatePresence>
      {position && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            position: 'absolute', 
            top: position.top, 
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
          className="flex flex-col gap-2 p-2 bg-card/90 backdrop-blur-2xl border border-primary/10 rounded-[1.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] min-w-[240px]"
        >
          <div className="flex items-center justify-between px-2 pt-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">
              {activeHighlightId ? 'Editar Destaque' : 'Ações de Leitura'}
            </p>
            <button 
              onClick={() => setPosition(null)}
              className="text-primary/20 hover:text-primary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-2xl">
            <div className="flex gap-1 pr-1.5 border-r border-primary/5">
              {highlightColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    onHighlight(color.name);
                    setPosition(null);
                  }}
                  className={`w-7 h-7 rounded-full ${color.value} border-2 transition-all hover:scale-110 ${
                    activeColor === color.name ? 'border-primary shadow-sm' : 'border-white/20'
                  }`}
                  title={`Destaque ${color.name}`}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-1 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onAddNote();
                  setPosition(null);
                }}
                className="h-9 rounded-xl px-3 text-[10px] font-bold uppercase tracking-widest gap-2 hover:bg-primary/5 flex-1"
              >
                <FileText className="w-3.5 h-3.5" /> Nota
              </Button>

              {activeHighlightId && onDeleteHighlight && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onDeleteHighlight();
                    setPosition(null);
                  }}
                  className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5"
                  title="Excluir Destaque"
                >
                  <Highlighter className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {selectedText && !activeHighlightId && (
            <div className="px-3 py-2 border-t border-primary/5 mt-1">
              <p className="text-[10px] text-muted-foreground italic line-clamp-1 leading-relaxed">
                "{selectedText}"
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
