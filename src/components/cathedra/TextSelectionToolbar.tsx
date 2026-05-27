import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlighter, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextSelectionToolbarProps {
  onHighlight: (color: string) => void;
  onAddNote: () => void;
  onDeleteHighlight?: () => void;
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
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          style={{ 
            position: 'absolute', 
            top: position.top, 
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
          className="flex items-center gap-1.5 p-1.5 bg-background/90 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-premium-hover"
        >
          <div className="flex gap-1 pr-1.5 border-r border-primary/5">
            {highlightColors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  onHighlight(color.name);
                  setPosition(null);
                }}
                className={`w-6 h-6 rounded-full ${color.value} border border-white/20 hover:scale-110 transition-transform`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onAddNote();
              setPosition(null);
            }}
            className="h-8 rounded-xl px-2.5 text-[10px] font-bold uppercase tracking-widest gap-2"
          >
            <FileText className="w-3.5 h-3.5" /> Nota
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPosition(null)}
            className="h-8 w-8 rounded-xl opacity-40 hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
