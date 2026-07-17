import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import PassageActions from '@/components/shared/PassageActions';
import type { PassageDescriptor } from '@/lib/passageUrl';

interface HighlightMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  onAddNote: () => void;
  /** Mantido por compatibilidade; se ausente, PassageActions cuida do compartilhamento. */
  onShare?: () => void;
  /** Dados do trecho para o PassageActions (copiar/compartilhar/destacar). */
  verseText?: string;
  reference?: string;
  passage?: PassageDescriptor;
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-200', label: 'Amarelo' },
  { name: 'green', bg: 'bg-green-200', label: 'Verde' },
  { name: 'blue', bg: 'bg-blue-200', label: 'Azul' },
  { name: 'red', bg: 'bg-red-200', label: 'Vermelho' },
];

export const HighlightMenu: React.FC<HighlightMenuProps> = ({
  isOpen,
  onClose,
  onSelectColor,
  onAddNote,
  verseText,
  reference,
  passage,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/5 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[160] bg-white rounded-t-[2.5rem] shadow-2xl p-8 pb-12"
            role="dialog"
            aria-label="Destaque e ações do versículo"
          >
            <div className="max-w-md mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">
                  Destaque & Reflexão
                </h3>
                <button
                  onClick={onClose}
                  className="min-h-11 min-w-11 flex items-center justify-center text-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                  aria-label="Fechar menu de destaque"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => onSelectColor(color.name)}
                    className="flex flex-col items-center gap-2 group min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    aria-label={`Destacar em ${color.label}`}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full shadow-sm border border-primary/5 transition-transform group-active:scale-90',
                        color.bg,
                      )}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary/30">
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-primary/5" />

              <button
                onClick={onAddNote}
                className="w-full flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icons.PenLine className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Meditar</span>
              </button>

              {verseText && reference && (
                <div className="pt-2">
                  <PassageActions
                    text={verseText}
                    reference={reference}
                    title={`Cathedra — ${reference}`}
                    passage={passage}
                    size="md"
                    className="justify-center"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
