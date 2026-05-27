import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

interface ReadingProgressProps {
  progress: number;
  onScrollToTop: () => void;
  showResume?: boolean;
  onResumeLast?: () => void;
  label?: string;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({ 
  progress, 
  onScrollToTop, 
  showResume, 
  onResumeLast,
  label 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[var(--layout-max-width)] mx-auto px-6 md:px-20 py-6 flex flex-col gap-4 items-end">
        
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pointer-events-auto flex items-center gap-3"
            >
              {showResume && onResumeLast && (
                <Button
                  onClick={onResumeLast}
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow-premium text-[9px] font-black uppercase tracking-widest px-6 h-10 border border-secondary/20"
                >
                  Retomar Leitura
                </Button>
              )}
              
              <Button
                onClick={onScrollToTop}
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full shadow-premium bg-background/80 backdrop-blur-md border-primary/5 hover:border-primary/20"
                aria-label="Voltar ao topo"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full pointer-events-auto bg-background/40 backdrop-blur-xl border border-primary/5 rounded-full p-1.5 shadow-premium overflow-hidden">
          <div className="flex items-center justify-between px-4 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
              {label || 'Progresso da Alma'}
            </span>
            <span className="text-[10px] font-bold text-primary/60">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-primary/5" />
        </div>
      </div>
    </div>
  );
};
