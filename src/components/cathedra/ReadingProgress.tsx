import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronUp, Bookmark, CornerRightUp } from 'lucide-react';
import { Icons } from '@/constants';
import { toast } from 'sonner';

interface ReadingProgressProps {
  progress: number;
  onScrollToTop: () => void;
  onScrollToPercentage?: (p: number) => void;
  showResume?: boolean;
  onResumeLast?: () => void;
  label?: string;
  isSubtle?: boolean;
  onBookmarkCurrent?: () => void;
  lastParagraphId?: string;
  onReturnToParagraph?: (id: string) => void;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({ 
  progress, 
  onScrollToTop, 
  onScrollToPercentage,
  showResume, 
  onResumeLast,
  label,
  isSubtle = false,
  onBookmarkCurrent,
  lastParagraphId,
  onReturnToParagraph
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [savedParagraphId, setSavedParagraphId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookmark = () => {
    if (onBookmarkCurrent) {
      onBookmarkCurrent();
      if (lastParagraphId) {
        setSavedParagraphId(lastParagraphId);
        localStorage.setItem('cathedra_last_paragraph', lastParagraphId);
      }
    }
    
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handleReturnToLast = () => {
    const id = savedParagraphId || localStorage.getItem('cathedra_last_paragraph');
    if (id && onReturnToParagraph) {
      onReturnToParagraph(id);
      toast.info('Retornando ao último parágrafo lido');
    } else {
      toast.error('Nenhum marcador encontrado');
    }
  };

  return (
    <>
      {/* Subtle top progress bar */}
      <div className="subtle-reading-progress">
        <div 
          className="subtle-reading-progress-inner" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[150] pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-[var(--layout-max-width)] mx-auto px-spacing-lg md:px-spacing-3xl py-spacing-lg flex flex-col gap-spacing-md items-end">
          
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pointer-events-auto flex items-center gap-spacing-sm"
              >
                {/* Bookmark Button */}
                <Button
                  onClick={handleBookmark}
                  variant="outline"
                  size="icon"
                  className="w-spacing-2xl h-spacing-2xl rounded-full shadow-premium bg-background/80 backdrop-blur-md border-primary/10 hover:border-primary/30 tap-premium"
                  aria-label="Marcar posição atual"
                >
                  <Bookmark className="w-spacing-md h-spacing-md text-primary" />
                </Button>

                {/* Return to Paragraph Button */}
                {(savedParagraphId || localStorage.getItem('cathedra_last_paragraph')) && (
                  <Button
                    onClick={handleReturnToLast}
                    variant="outline"
                    size="icon"
                    className="w-spacing-2xl h-spacing-2xl rounded-full shadow-premium bg-background/80 backdrop-blur-md border-primary/10 hover:border-primary/30 tap-premium"
                    aria-label="Retornar ao último parágrafo"
                  >
                    <CornerRightUp className="w-spacing-md h-spacing-md text-primary" />
                  </Button>
                )}

                {showResume && onResumeLast && (
                  <Button
                    onClick={onResumeLast}
                    variant="secondary"
                    size="sm"
                    className="rounded-full shadow-premium text-[10px] font-black uppercase tracking-widest px-spacing-xl h-spacing-2xl border-2 border-secondary bg-secondary text-primary hover:bg-secondary/90 transition-all group relative overflow-hidden tap-premium"
                  >
                    <motion.span 
                      animate={{ scale: [1, 1.05, 1] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-spacing-xs relative z-10"
                    >
                      <Icons.History className="w-spacing-md h-spacing-md group-hover:rotate-[-45deg] transition-transform" />
                      Retomar
                    </motion.span>
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                )}
                
                <Button
                  onClick={onScrollToTop}
                  variant="outline"
                  size="icon"
                  className="w-spacing-2xl h-spacing-2xl rounded-full shadow-premium bg-background/80 backdrop-blur-md border-primary/10 hover:border-primary/30 tap-premium"
                  aria-label="Voltar ao topo"
                >
                  <ChevronUp className="w-spacing-md h-spacing-md" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSubtle && (
            <div className="w-full pointer-events-auto bg-background/40 backdrop-blur-xl border border-primary/5 rounded-full p-spacing-2xs shadow-premium overflow-hidden">
              <div className="flex items-center justify-between px-spacing-md mb-spacing-2xs">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                  {label || 'Progresso da Alma'}
                </span>
                <span className="text-[10px] font-bold text-primary/60">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-spacing-2xs bg-primary/5 cursor-pointer" 
                onClick={(e) => {
                  if (!onScrollToPercentage) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const p = (x / rect.width) * 100;
                  onScrollToPercentage(p);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
