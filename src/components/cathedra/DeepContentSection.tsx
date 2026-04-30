import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { DeepContent, AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';

interface DeepContentSectionProps {
  content: DeepContent;
  title?: string;
  contentType?: 'bible' | 'catechism' | 'apparition' | 'other';
}

const DeepContentSection: React.FC<DeepContentSectionProps> = ({ content, title, contentType }) => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const forbiddenFields = ['explicacao', 'interpretacaoProfunda', 'aplicacaoPratica', 'reflexaoFinal', 'exercicio'];
    const detected = forbiddenFields.filter(f => (content as any)[f]);
    
    if (detected.length > 0) {
      console.error(`[SECURITY/VALIDATION] Campos de IA detectados em conteúdo do tipo '${contentType || 'desconhecido'}':`, detected);
      // Optional: telemetry or error reporting call here
    }
  }, [content, contentType]);

  const sections = [
    { id: 'textoBase', label: 'Acesso Inicial', icon: <Icons.Book className="w-4 h-4" />, value: content.textoBase, isPremium: false },
  ].filter(s => !!s.value);


  if (sections.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border/40" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">{title}</h3>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => {
          const isLocked = section.isPremium && !isPremium;

          return (
            <motion.div
              key={`${section.id}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
                section.id === 'textoBase' 
                  ? 'bg-primary/5 border-primary/20 md:col-span-2' 
                  : 'bg-card border-border hover:border-primary/30'
              } ${isLocked ? 'hover:shadow-none cursor-default' : 'hover:shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${
                  isLocked ? 'bg-muted text-muted-foreground' : (section.id === 'textoBase' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground')
                } transition-colors`}>
                  {isLocked ? <Lock className="w-4 h-4" /> : section.icon}
                </div>
                <h4 className={`text-xs font-black uppercase tracking-widest ${
                  isLocked ? 'text-muted-foreground' : (section.id === 'textoBase' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')
                }`}>
                  {section.label}
                  {section.isPremium && !isLocked && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8px]">PRO</span>
                  )}
                </h4>
              </div>
              
              <div className="relative">
                <div className={`font-serif leading-relaxed ${isLocked ? 'blur-[6px] select-none pointer-events-none opacity-40' : ''} ${section.id === 'textoBase' ? 'text-lg italic text-foreground' : 'text-foreground/90 text-sm'}`}>
                  {section.value.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className={pIdx > 0 ? 'mt-3' : ''}>
                      {parseTheologicalReferences(paragraph).map((seg, sIdx) => {
                        if (seg.type === 'bibleRef') {
                          return (
                            <BibleVersePopover
                              key={sIdx}
                              abbr={seg.abbr!}
                              chapter={seg.chapter!}
                              verse={seg.verse}
                              label={seg.value}
                            />
                          );
                        }
                        if (seg.type === 'catechismRef') {
                          return (
                            <CatechismPopover
                              key={sIdx}
                              paragraph={seg.paragraph!}
                            />
                          );
                        }
                        return <span key={sIdx}>{seg.value}</span>;
                      })}
                    </p>
                  ))}
                </div>

                {isLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-4 text-center">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    <p className="text-sm font-bold text-foreground">
                      Continue aprofundando essa experiência
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="font-bold text-[10px] uppercase tracking-widest h-9"
                      onClick={() => navigate(AppRoute.PRICING)}
                    >
                      Desbloquear PRO
                    </Button>
                  </div>
                )}
              </div>

              {section.id === 'reflexaoFinal' && !isLocked && (
                <div className="mt-6 pt-6 border-t border-border/40">
                  <div className="flex items-start gap-3">
                    <Icons.MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-xs italic text-muted-foreground">Silencie e deixe que esta pergunta ecoe em seu coração.</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DeepContentSection;
