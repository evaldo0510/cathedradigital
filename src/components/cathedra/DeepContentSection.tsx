import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { DeepContent, AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, CheckCircle2, Send } from 'lucide-react';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepContentSectionProps {
  content: DeepContent & {
    explicacao?: string;
    interpretacaoProfunda?: string;
    aplicacaoPratica?: string;
    reflexaoFinal?: string;
    exercicio?: string;
    status?: string;
  };
  title?: string;
  contentType?: 'bible' | 'catechism' | 'apparition' | 'other';
}

const DeepContentSection: React.FC<DeepContentSectionProps> = ({ content, title, contentType }) => {
  const { isPremium, user } = useAuth();
  const navigate = useNavigate();
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReflected, setHasReflected] = useState(false);

  // Load existing reflection if any
  const fetchReflection = React.useCallback(async () => {
    if (!user || !contentType) return;
    const { data } = await supabase
      .from('reading_reflections' as any)
      .select('content')
      .eq('user_id', user.id)
      .eq('reading_type', contentType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setHasReflected(true);
    } else {
      setHasReflected(false);
    }
  }, [user, contentType]);

  useEffect(() => {
    if (!user || !contentType) return;
    fetchReflection();

    // Realtime sync for reflections
    const channel = supabase
      .channel(`reading_reflections_${contentType}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reading_reflections', filter: `user_id=eq.${user.id}` },
        () => fetchReflection()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contentType, fetchReflection]);

  const saveReflection = async () => {
    if (!user || !reflectionText.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reading_reflections' as any)
        .insert({
          user_id: user.id,
          content: reflectionText.trim(),
          reading_type: contentType || 'other',
          // Add metadata if needed to link back to specific verse/para
        } as any);

      if (error) throw error;
      
      setHasReflected(true);
      setReflectionText('');
      toast.success('Reflexão guardada no seu diário espiritual.');
    } catch (err) {
      console.error('Error saving reflection:', err);
      toast.error('Erro ao guardar reflexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = useMemo(() => {
    const s = [
      { id: 'textoBase', label: 'Acesso Inicial', icon: <Icons.Book className="w-md h-md" />, value: content.textoBase, isPremium: false },
      { id: 'explicacao', label: 'Explicação', icon: <Icons.Info className="w-md h-md" />, value: content.explicacao, isPremium: true },
      { id: 'interpretacaoProfunda', label: 'Sentido Profundo', icon: <Icons.Sparkle className="w-md h-md" />, value: content.interpretacaoProfunda, isPremium: true },
      { id: 'aplicacaoPratica', label: 'Vida Prática', icon: <Icons.Zap className="w-md h-md" />, value: content.aplicacaoPratica, isPremium: true },
      { id: 'reflexaoFinal', label: 'Reflexão', icon: <Icons.Heart className="w-md h-md" />, value: content.reflexaoFinal, isPremium: true },
      { id: 'exercicio', label: 'Exercício de Fé', icon: <Icons.PenTool className="w-md h-md" />, value: content.exercicio, isPremium: true },
    ];

    // If it's catechism, we might want to show all sections even if empty to satisfy the "clear message" requirement
    if (contentType === 'catechism') {
      return s;
    }

    return s.filter(sec => !!sec.value);
  }, [content, contentType]);

  if (sections.length === 0) return null;

  return (
    <section className="space-y-xl animate-in fade-in slide-in-from-bottom-md duration-500" aria-label="Aprofundamento teológico">
      {title && (
        <div className="flex items-center gap-sm mb-lg">
          <div className="h-px flex-1 bg-border/40" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">{title}</h3>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {sections.map((section, idx) => {
          const isLocked = section.isPremium && !isPremium;

          return (
            <motion.div
              key={`${section.id}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-lg rounded-premium border transition-all relative overflow-hidden ${
                section.id === 'textoBase' 
                  ? 'bg-primary/5 border-primary/20 md:col-span-2' 
                  : 'bg-card border-border hover:border-primary/30'
              } ${isLocked ? 'hover:shadow-none cursor-default' : 'hover:shadow-premium'}`}
            >
              <div className="flex items-center gap-sm mb-md">
                <div className={`p-xs rounded-full ${
                  isLocked ? 'bg-muted text-muted-foreground' : (section.id === 'textoBase' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground')
                } transition-colors`}>
                  {isLocked ? <Lock className="w-md h-md" /> : section.icon}
                </div>
                <h4 className={`text-xs font-black uppercase tracking-widest ${
                  isLocked ? 'text-muted-foreground' : (section.id === 'textoBase' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')
                }`}>
                  {section.label}
                  {section.isPremium && !isLocked && (
                    <span className="ml-xs px-2xs py-3xs rounded-full bg-primary/10 text-primary text-xs">PRO</span>
                  )}
                </h4>
              </div>
              
              <div className="relative">
                {section.value ? (
                  <div className={`font-serif leading-relaxed ${isLocked ? 'blur-[6px] select-none pointer-events-none opacity-40' : ''} ${section.id === 'textoBase' ? 'text-lg italic text-foreground' : 'text-foreground/90 text-sm'}`}>
                    {section.value.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className={pIdx > 0 ? 'mt-sm' : ''}>
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
                ) : (
                  <div className="py-md px-xs rounded-premium bg-muted/30 border border-dashed border-border/50 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      Conteúdo oficial não disponível para este parágrafo no momento.
                    </p>
                  </div>
                )}

                {isLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-sm p-md text-center">
                    <Sparkles className="w-lg h-lg text-primary animate-pulse" />
                    <p className="text-sm font-bold text-foreground">
                      Continue aprofundando essa experiência
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="font-bold text-xs uppercase tracking-widest h-xl"
                      onClick={() => navigate(AppRoute.PRICING)}
                    >
                      Desbloquear PRO
                    </Button>
                  </div>
                )}
              </div>

              {section.id === 'reflexaoFinal' && !isLocked && (
                <div className="mt-lg pt-lg border-t border-border/40 space-y-md">
                  <div className="flex items-start gap-sm">
                    <Icons.MessageSquare className="w-md h-md text-primary mt-3xs" />
                    <p className="text-xs italic text-muted-foreground">Silencie e deixe que esta pergunta ecoe em seu coração.</p>
                  </div>
                  
                  {!hasReflected ? (
                    <div className="space-y-sm pt-xs">
                      <textarea 
                        value={reflectionText}
                        onChange={(e) => setReflectionText(e.target.value)}
                        placeholder="Escreva sua reflexão aqui..."
                        className="w-full min-h-[100px] p-md rounded-premium bg-muted/20 border border-border/40 text-sm font-serif italic focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={saveReflection}
                          disabled={!reflectionText.trim() || isSubmitting}
                          className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest gap-xs"
                        >
                          {isSubmitting ? <Icons.Loader className="w-sm h-sm animate-spin" /> : <Send className="w-sm h-sm" />}
                          Guardar Reflexão
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-xs px-md py-xs bg-emerald-500/5 border border-emerald-500/20 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95 duration-500">
                      <CheckCircle2 className="w-sm h-sm" /> Reflexão Integrada ao Diário
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default DeepContentSection;
