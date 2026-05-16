import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Scroll, ExternalLink } from 'lucide-react';
import { Button } from '@/components/cathedra/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CatechismParagraphSkeleton, BibleChapterSkeleton } from './SacredSkeleton';

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'bible' | 'catechism';
  initialParams: any;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  isOpen,
  onClose,
  initialType,
  initialParams
}) => {
  const [type, setType] = useState(initialType);
  const [params, setParams] = useState(initialParams);
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setParams(initialParams);
    }
  }, [isOpen, initialType, initialParams]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        if (type === 'catechism') {
          const { data } = await supabase.functions.invoke('catechism-text', {
            body: { paragraph: params.paragraph }
          });
          setContent(data);
        } else {
          const { data } = await supabase.functions.invoke('bible-text', {
            body: { abbrev: params.abbr, chapter: params.chapter }
          });
          setContent(data);
        }
      } catch (error) {
        console.error('Error fetching reference content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, type, params]);

  const navigateChapter = (dir: 1 | -1) => {
    if (type === 'bible') {
      setParams((prev: any) => ({ ...prev, chapter: prev.chapter + dir }));
    } else {
      setParams((prev: any) => ({ ...prev, paragraph: prev.paragraph + dir }));
    }
    setContent(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8">
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
            className="relative w-full max-w-2xl max-h-[90dvh] sm:max-h-[80vh] bg-background border border-primary/10 shadow-premium rounded-premium flex flex-col overflow-hidden reading-sepia"
          >
            {/* Header */}
            <div className="p-6 border-b border-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                  {type === 'bible' ? <BookOpen className="w-5 h-5 text-primary" /> : <Scroll className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h3 className="text-lg font-display text-primary">
                    {type === 'bible' ? `${params.abbr} ${params.chapter}` : `Catecismo §${params.paragraph}`}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/30">Referência Sagrada</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-6 sm:p-12">
              <div className="max-w-prose mx-auto">
                {isLoading ? (
                  type === 'bible' ? <BibleChapterSkeleton /> : <CatechismParagraphSkeleton paragraph={params.paragraph} />
                ) : content ? (
                  <div className="reader-text space-y-6">
                    {type === 'bible' ? (
                      <div className="space-y-4">
                        {content.verses?.map((v: any) => (
                          <p key={v.number} className={cn("inline transition-colors duration-300 rounded px-1", params.verse === v.number ? "bg-primary/10 shadow-sm" : "")}>
                            <sup className="text-[0.6em] font-black mr-2 opacity-30">{v.number}</sup>
                            {v.text}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="prose prose-lg dark:prose-invert font-serif leading-relaxed">
                        {content.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-primary/40 italic py-12">Não foi possível carregar o conteúdo.</p>
                )}
              </div>
            </ScrollArea>

            {/* Footer Navigation */}
            <div className="p-4 sm:p-6 border-t border-primary/5 flex items-center justify-between bg-muted/10 gap-2">
              <Button variant="ghost" onClick={() => navigateChapter(-1)} className="gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary px-2">
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Anterior</span>
              </Button>
              <Button variant="outline" className="rounded-full h-8 sm:h-10 px-3 sm:px-6 gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest border-primary/10 text-primary/60" onClick={() => window.open(type === 'bible' ? `/bible?book=${params.abbr}&ch=${params.chapter}` : `/catechism?p=${params.paragraph}`, '_blank')}>
                Scriptuarium <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3" />
              </Button>
              <Button variant="ghost" onClick={() => navigateChapter(1)} className="gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary px-2">
                <span className="hidden xs:inline">Próximo</span> <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};