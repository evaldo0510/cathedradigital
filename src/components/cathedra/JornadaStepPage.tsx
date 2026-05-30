import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, BookOpen, Hand, PenLine, Sparkles, Clock, ChevronDown, X, ShieldQuestion, Lock, Save, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { saveUserPsychology } from '@/lib/psychologicalProfile';
import { AppRoute } from '@/types';
import ProConversionBanner from './ProConversionBanner';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import { getSaintBySubtitle } from '@/services/saintsService';
import SacredImage from './SacredImage';

const SECTION_CONFIG = [
  { key: 'padh', label: 'A Palavra', icon: <Sparkles className="w-spacing-md h-spacing-md" />, isPremium: false },
  { key: 'interpretation', label: 'Reflexão', icon: <Icons.Bible className="w-spacing-md h-spacing-md" />, isPremium: false },
  { key: 'practical_direction', label: 'Prática do Dia', icon: <Hand className="w-spacing-md h-spacing-md" />, isPremium: true },
  { key: 'guided_exercise', label: 'Exercício Espiritual', icon: <PenLine className="w-spacing-md h-spacing-md" />, isPremium: true },
  
  // Legacy / Hybrid mappings
  { key: 'intro', label: 'Introdução', icon: <BookOpen className="w-spacing-md h-spacing-md" />, isPremium: false },
  { key: 'reflection', label: 'Reflexão', icon: <PenLine className="w-spacing-md h-spacing-md" />, isPremium: true },
  { key: 'practice', label: 'Prática', icon: <Hand className="w-spacing-md h-spacing-md" />, isPremium: true },
  { key: 'prayer', label: 'Oração', icon: <Sparkles className="w-spacing-md h-spacing-md" />, isPremium: true },
];

type UserLevelClass = 'iniciante' | 'intermediário' | 'avançado';

const JornadaStepPage: React.FC = () => {
  const { id: journeyId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const navigate = useNavigate();
  const { user, profile, userLevel: userLevelClass, isPremium: isUserPremium } = useAuth();
  const { saveLastRead } = useReadingMarks();

  const [step, setStep] = useState<any>(null);
  const [journeyTitle, setJourneyTitle] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextStep, setNextStep] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const content = useMemo(() => (step?.content as Record<string, any>) || {}, [step]);
  const stepProgress = useMemo(() => totalSteps > 0 ? (step?.step_order / totalSteps) * 100 : 0, [step, totalSteps]);

  const [saintImage, setSaintImage] = useState<string | null>(null);

  useEffect(() => {
    if (!step?.subtitle) return;
    getSaintBySubtitle(step.subtitle).then(s => {
      if (s?.image) setSaintImage(s.image);
    });
  }, [step?.subtitle]);

  useEffect(() => {
    if (stepId && journeyId && step?.title) {
      loadData();
      
      // Persistir ponto de leitura sincronizado
      saveLastRead({
        content_type: 'journey',
        content_id: stepId,
        label: `${step.title} (${journeyTitle || 'Jornada'})`,
        url: `/jornadas/${journeyId}/step?step=${stepId}`,
        is_last_read: true
      });
      
      // Histórico geral
      supabase.from('user_history').insert({
        user_id: user?.id,
        title: step.title,
        route: `/jornadas/${journeyId}/step?step=${stepId}`,
        type: 'journey'
      });
    }
  }, [stepId, journeyId, step?.title, journeyTitle, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stepRes, journeyRes, countRes] = await Promise.all([
        supabase.from('journey_steps').select('*').eq('id', stepId!).single(),
        supabase.from('journeys').select('title').eq('id', journeyId!).single(),
        supabase.from('journey_steps').select('*', { count: 'exact', head: true }).eq('journey_id', journeyId!),
      ]);

      if (stepRes.data) {
        setStep(stepRes.data);
        const dataContent = stepRes.data.content as Record<string, any>;
        const firstWithContent = SECTION_CONFIG.find(s => {
          const val = dataContent[s.key] || dataContent[`${s.key}_iniciante`];
          return !!val;
        });
        if (firstWithContent) setExpandedSection(firstWithContent.key);
      }
      if (journeyRes.data) setJourneyTitle(journeyRes.data.title);
      setTotalSteps(countRes.count || 0);

      // Load next step
      const { data: allSteps } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId!)
        .order('step_order', { ascending: true });
      
      if (allSteps && stepRes.data) {
        const currentIndex = allSteps.findIndex(s => s.id === stepId);
        if (currentIndex !== -1 && currentIndex < allSteps.length - 1) {
          setNextStep(allSteps[currentIndex + 1]);
        }
      }

      if (user && stepRes.data) {
        const { data: progress } = await supabase
          .from('journey_progress')
          .select('id, reflection')
          .eq('user_id', user.id)
          .eq('step_id', stepId!)
          .maybeSingle();
        if (progress) {
          setCompleted(true);
          setReflection(progress.reflection || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async () => {
    if (!user || !journeyId || !stepId) return;
    setSaving(true);
    try {
      // 1. Core progress update - must be awaited to show completion
      const { error } = await supabase.from('journey_progress').upsert({
        user_id: user.id,
        journey_id: journeyId,
        step_id: stepId,
        reflection: reflection.trim() || null,
      }, { onConflict: 'user_id,step_id' });

      if (error) throw error;

      // 2. Secondary saves are backgrounded to improve perceived speed
      if (reflection.trim()) {
        supabase.from('spiritual_journal').insert([{
          user_id: user.id,
          content: reflection.trim(),
          journey_id: journeyId,
          step_id: stepId,
          entry_date: new Date().toISOString().split('T')[0],
        }]).then(({ error }) => { if (error) console.error('BG Journal save failed:', error); });
        
        saveUserPsychology(user.id, reflection.trim(), `journey_${journeyId}`);
      }

      setCompleted(true);
    } catch (err) {
      console.error('Failed to complete step:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!user || !reflection.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('reading_reflections').insert([{
        user_id: user.id,
        reading_type: 'journey',
        content: reflection.trim(),
        context_id: `journey_${journeyId}_step_${stepId}`
      }]);

      if (error) throw error;
      toast.success("Reflexão salva no seu perfil.");
    } catch (err) {
      console.error('Failed to save reflection:', err);
      toast.error("Erro ao salvar reflexão.");
    } finally {
      setSaving(false);
    }
  };


  const getVariantContent = (key: string, content: any): string | null => {
    if (!content) return null;
    
    // If it's a string, return it
    if (typeof content[key] === 'string') return content[key];
    
    // If it's an object with variants
    if (content[key] && typeof content[key] === 'object') {
      return content[key][userLevelClass] || content[key]['iniciante'] || Object.values(content[key])[0] as string;
    }
    
    // Try separate keys (e.g. reflection_iniciante)
    const variantKey = `${key}_${userLevelClass}`;
    if (content[variantKey]) return content[variantKey];
    
    return content[key] || null;
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[200]">
        <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
      </div>,
      document.body
    );
  }

  if (!step) {
    return createPortal(
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[200]">
        <div className="text-center space-y-spacing-md">
          <p className="text-muted-foreground">Etapa não encontrada.</p>
          <Button onClick={() => navigate(-1)} className="text-primary underline text-premium-sm">Voltar</Button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background z-[200] flex flex-col overflow-hidden"
    >
      {/* Immersive Header */}
      <div className="flex-shrink-0 px-spacing-md pt-[max(0.75rem,env(safe-area-inset-top))] pb-spacing-sm border-b border-border/50">
        <div className="flex items-center gap-spacing-sm max-w-spacing-2xl mx-auto">
          <Button
            onClick={() => navigate(`/jornadas/${journeyId}`)}
            className="w-spacing-xl h-spacing-xl rounded-premium-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="w-spacing-md h-spacing-md text-foreground" />
          </Button>
          <div className="flex-1 min-w-spacing-0">
            <div className="flex items-center gap-spacing-xs">
              <p className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{journeyTitle}</p>
              <div className="group relative">
                <span className="cursor-help px-spacing-2xs py-spacing-3xs rounded-premium-full text-premium-xs font-black uppercase bg-primary/10 text-primary border border-primary/20 flex items-center gap-spacing-2xs">
                  {userLevelClass} <ShieldQuestion className="w-spacing-xs h-spacing-xs opacity-50" />
                </span>
                <div className="absolute left-0 top-full mt-spacing-xs w-spacing-4xl p-spacing-xs bg-popover text-popover-foreground rounded-premium border border-border shadow-premium-hover text-premium-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="font-bold mb-spacing-2xs">Conteúdo Adaptado</p>
                  <p className="opacity-80">
                    {userLevelClass === 'iniciante' && "Nível Iniciante: conteúdo simplificado e guiado."}
                    {userLevelClass === 'intermediário' && "Nível Intermediário: foco em reflexão e aprofundamento."}
                    {userLevelClass === 'avançado' && "Nível Avançado: foco em profundidade e confrontação."}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-premium-xs text-muted-foreground">Etapa {step.step_order} de {totalSteps}</p>
          </div>
          <span className="text-premium-xs font-bold text-muted-foreground flex items-center gap-spacing-2xs">
            <Clock className="w-spacing-sm h-spacing-sm" /> {step.duration_minutes}min
          </span>

        </div>
        <div className="max-w-spacing-2xl mx-auto mt-spacing-xs">
          <Progress value={stepProgress} className="h-spacing-2xs" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-auto">
        <div className="max-w-spacing-2xl mx-auto px-spacing-md py-spacing-lg space-y-spacing-lg pb-spacing-4xl">
          {/* Step Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-spacing-xs"
          >
            {saintImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-spacing-4xl h-spacing-4xl mx-auto mb-spacing-md rounded-premium-full overflow-hidden border-2 border-primary/20 shadow-premium-hover"
              >
                <SacredImage src={saintImage} alt={step.subtitle || ''} className="w-full h-full object-cover" />
              </motion.div>
            )}
            <h1 className="text-premium-2xl md:text-premium-3xl font-bold font-serif text-foreground">{step.title}</h1>
            {step.subtitle && (
              <p className="text-premium-sm text-muted-foreground italic">{step.subtitle}</p>
            )}
            {content.bible_ref && (
              <div className="inline-flex items-center gap-spacing-2xs px-spacing-sm py-spacing-2xs rounded-premium bg-primary/10 text-primary border border-primary/20 text-premium-xs font-black uppercase tracking-wider mx-auto">
                <BookOpen className="w-spacing-sm h-spacing-sm" /> {content.bible_ref}
              </div>
            )}
            
            <div className="flex justify-center pt-spacing-xs">
              <AudioContentPlayer 
                text={`${step.title}. ${step.subtitle || ''}. ${SECTION_CONFIG.map(s => getVariantContent(s.key, content)).filter(Boolean).join('. ')}`}
                title="Ouvir conteúdo"
              />
            </div>
          </motion.div>

          {/* Content Sections */}
          {SECTION_CONFIG.map(({ key, label, icon, isPremium: sectionIsPremium }, i) => {
            const sectionContent = getVariantContent(key, content);
            if (!sectionContent) return null;
            const isExpanded = expandedSection === key;
            const isLocked = sectionIsPremium && !isUserPremium;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Button
                  onClick={() => toggleSection(key)}
                  className={`w-full flex items-center gap-spacing-sm p-spacing-md rounded-t-2xl transition-all text-left ${
                    isExpanded
                      ? 'bg-card border border-b-0 border-border shadow-premium-md'
                      : 'bg-card border border-border rounded-b-2xl hover:border-primary/30'
                  } ${isLocked ? 'opacity-70' : ''}`}
                >
                  <span className={`w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center flex-shrink-0 ${
                    isExpanded ? 'bg-primary text-primary-foreground shadow-premium' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isLocked ? <Lock className="w-spacing-md h-spacing-md" /> : icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-spacing-xs">
                      <span className={`text-premium-sm font-bold ${isExpanded ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                      {sectionIsPremium && (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-premium-xs uppercase font-black px-spacing-2xs py-spacing-0">PRO</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-spacing-md h-spacing-md text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-card border border-t-0 border-border rounded-b-2xl p-spacing-md relative min-h-[140px]">
                        {isLocked ? (
                          <div className="space-y-spacing-md py-spacing-md text-center">
                            <div className="blur-[6px] select-none pointer-events-none opacity-40">
                              <p className="text-premium-sm font-serif line-clamp-spacing-md">
                                {sectionContent}
                              </p>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card  p-spacing-lg space-y-spacing-md rounded-b-2xl">
                              <Sparkles className="w-spacing-xl h-spacing-xl text-primary animate-pulse" />
                              <p className="text-premium-sm font-bold text-foreground max-w-[180px] leading-relaxed">
                                Continue aprofundando essa experiência
                              </p>
                              <Button 
                                size="sm" 
                                className="font-bold text-premium-xs uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-premium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(AppRoute.PRICING);
                                }}
                              >
                                Desbloquear PRO
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-premium-sm text-foreground/90 leading-relaxed whitespace-pre-line font-serif ${key === 'padh' ? 'text-premium-lg italic text-primary text-center' : ''}`}>
                            {sectionContent}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Journal / Reflection */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-spacing-sm"
          >
            <div className="flex items-center gap-spacing-xs">
              <PenLine className="w-spacing-md h-spacing-md text-primary" />
              <h3 className="text-premium-sm font-bold text-foreground">Pergunta Final & Reflexão</h3>
            </div>

            {(getVariantContent('final_question', content) || getVariantContent('journal_prompt', content) || getVariantContent('question', content)) && (
              <div className="bg-primary/5 border border-primary/10 rounded-premium p-spacing-md">
                <p className="text-premium-sm text-foreground/80 italic font-serif">
                  {getVariantContent('final_question', content) || getVariantContent('journal_prompt', content) || getVariantContent('question', content)}
                </p>
              </div>
            )}


            <Textarea
              placeholder="Escreva sua reflexão aqui... Suas palavras são privadas e só você pode ver."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[120px] resize-none text-premium-sm bg-card border-border"
              disabled={completed}
            />
          </motion.div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background  px-spacing-md py-spacing-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-spacing-2xl mx-auto">
          <div className="flex gap-spacing-xs">
            {!completed && (
              <Button
                onClick={handleSaveReflection}
                disabled={saving || !reflection.trim()}
                variant="outline"
                className="flex-1 rounded-premium-full h-spacing-2xl text-premium-xs uppercase font-black tracking-widest border-primary/20 text-primary hover:bg-primary/5"
              >
                {saving ? (
                  <div className="w-spacing-md h-spacing-md border-2 border-current border-t-transparent rounded-premium animate-spin" />
                ) : (
                  <><Save className="w-spacing-md h-spacing-md mr-spacing-xs" /> Salvar</>
                )}
              </Button>
            )}
            
            <Button
              onClick={completed ? () => navigate(`/jornadas/${journeyId}`) : completeStep}
              disabled={saving}
              className={`${completed ? 'w-full' : 'flex-[2]'} h-spacing-2xl bg-primary text-primary-foreground rounded-premium-full text-premium-xs font-black uppercase tracking-[0.2em] shadow-premium-hover shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-spacing-sm`}
            >
              {saving ? (
                <>
                  <div className="w-spacing-md h-spacing-md border-2 border-current border-t-transparent rounded-premium animate-spin" />
                  Salvando...
                </>
              ) : completed ? (
                <>
                  <ArrowLeft className="w-spacing-md h-spacing-md" />
                  Voltar à Jornada
                </>
              ) : (
                <>
                  <Check className="w-spacing-md h-spacing-md" />
                  Concluir Etapa
                </>
              )}
            </Button>
          </div>
          {completed && nextStep && (
            <div className="mt-spacing-sm">
              <Button
                onClick={() => navigate(`/jornadas/${journeyId}/step?step=${nextStep.id}`)}
                className="w-full h-spacing-2xl bg-primary text-primary-foreground rounded-premium-full text-premium-xs font-black uppercase tracking-[0.2em] shadow-premium-hover shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-spacing-xs"
              >
                Próxima Etapa
                <ChevronRight className="w-spacing-md h-spacing-md" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

export default JornadaStepPage;
