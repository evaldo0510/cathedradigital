import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Lock, Clock, BookOpen, Hand, PenLine, HelpCircle, ChevronRight, Sparkles, Award, PartyPopper } from 'lucide-react';
import { CathedraCard } from './CathedraCard';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
// import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

const STEP_ICONS: Record<string, React.ReactNode> = {
  reading: <BookOpen className="w-md h-md" />,
  prayer: <Hand className="w-md h-md" />,
  reflection: <PenLine className="w-md h-md" />,
  quiz: <HelpCircle className="w-md h-md" />,
};

const JornadaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [journey, setJourney] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadJourney();
  }, [id, user]);

  const loadJourney = async () => {
    setLoading(true);
    try {
      const [journeyRes, stepsRes] = await Promise.all([
        supabase.from('journeys').select('*').eq('id', id!).single(),
        supabase.from('journey_steps').select('*').eq('journey_id', id!).order('step_order', { ascending: true }),
      ]);

      if (journeyRes.data) setJourney(journeyRes.data);
      if (stepsRes.data) setSteps(stepsRes.data);

      if (user) {
        const { data: progress } = await supabase
          .from('journey_progress')
          .select('step_id')
          .eq('user_id', user.id)
          .eq('journey_id', id!);
        if (progress) setCompletedStepIds(new Set(progress.map(p => p.step_id)));
      }
    } catch (err) {
      console.error('Failed to load journey:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!user) return;
    try {
      await supabase.from('journey_progress').insert([{
        user_id: user.id,
        journey_id: id!,
        step_id: stepId,
      }]);
      setCompletedStepIds(prev => new Set([...prev, stepId]));
    } catch (err) {
      console.error('Failed to complete step:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-xl h-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="text-center space-y-4 py-2xl">
        <p className="text-muted-foreground">Jornada não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(AppRoute.JORNADAS)}>
          <ArrowLeft className="w-md h-md mr-xs" /> Voltar
        </Button>
      </div>
    );
  }

  const completedCount = completedStepIds.size;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const isLocked = journey.is_premium && !isPremium;
  const isJourneyComplete = totalSteps > 0 && completedCount === totalSteps;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-sm">
        <div className="flex-1">
          <h1 className="text-xl font-bold font-serif text-foreground">{journey.title}</h1>
          {journey.subtitle && <p className="text-sm text-muted-foreground">{journey.subtitle}</p>}
        </div>
        {journey.is_premium && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-sm h-sm mr-2xs" /> PRO
          </Badge>
        )}
      </div>

      {/* Progress */}
      <CathedraCard padding="md" className="border-primary/10 shadow-premium space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Progresso da Jornada</span>
            <span className="font-bold text-primary">{completedCount}/{totalSteps} etapas</span>
          </div>
          <Progress value={progressPercent} className="h-2xs" />
          <div className="flex items-center justify-between">
            <div className="flex gap-md text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2xs"><Clock className="w-sm h-sm" /> ~{journey.estimated_days} dias</span>
              <span className="px-xs py-3xs rounded-full bg-muted border border-border/40">{journey.difficulty}</span>
            </div>
            {isJourneyComplete && (
              <Badge className="bg-emerald-500 text-white border-none text-[8px]">FINALIZADA</Badge>
            )}
          </div>
      </CathedraCard>

      {/* Description */}
      {journey.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{journey.description}</p>
      )}

      {/* Completion Banner */}
      {isJourneyComplete && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <CathedraCard padding="md" className="premium-card border-primary/10 bg-gradient-to-r from-primary/5 to-transparent shadow-premium flex items-center gap-md">
              <div className="w-2xl h-2xl rounded-premium bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-lg h-lg text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground"><Icons.PartyPopper className="w-md h-md inline mr-xs text-primary" /> Jornada Concluída!</p>
                <p className="text-xs text-muted-foreground">Parabéns! Veja seu certificado e reflexões.</p>
              </div>
              <Button size="sm" onClick={() => navigate(`/jornadas/${id}/complete`)}>
                Ver <ChevronRight className="w-md h-md ml-2xs" />
              </Button>
          </CathedraCard>
        </motion.div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Etapas</h2>
        {steps.map((step, index) => {
          const isCompleted = completedStepIds.has(step.id);
          const isStepLocked = isLocked && !step.is_free;
          const isNext = !isCompleted && !isStepLocked && (index === 0 || completedStepIds.has(steps[index - 1]?.id));

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <CathedraCard 
                padding="md"
                variant="interactive"
                className={`transition-all border-primary/5 ${isNext ? 'border-primary/20 ring-1 ring-primary/10' : ''} ${isCompleted ? 'bg-primary/[0.02] shadow-sm' : ''} ${isStepLocked ? 'opacity-40 grayscale' : ''} flex items-center gap-md`}>
                  {/* Step number / status */}
                  <div className={`w-xl h-xl rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isStepLocked
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary'
                  }`}>
                    {isCompleted ? <Check className="w-md h-md" /> : isStepLocked ? <Lock className="w-md h-md" /> : index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs">
                      <h3 className="font-semibold text-sm text-foreground truncate">{step.title}</h3>
                      {isStepLocked && (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-premium-tiny uppercase font-black px-2xs py-0">PRO</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-xs text-xs text-muted-foreground mt-3xs">
                      {STEP_ICONS[step.step_type] || STEP_ICONS.reading}
                      <span className="capitalize">{step.step_type === 'reading' ? 'Leitura' : step.step_type === 'prayer' ? 'Oração' : step.step_type === 'reflection' ? 'Reflexão' : 'Quiz'}</span>
                      <span>• {step.duration_minutes}min</span>
                    </div>
                  </div>

                  {/* Action */}
                  {!isStepLocked && (
                    <Button
                      size="sm"
                      variant={isNext ? 'default' : 'outline'}
                      onClick={() => navigate(`/jornadas/${id}/step?step=${step.id}`)}
                    >
                      {isCompleted ? 'Rever' : isNext ? 'Iniciar' : 'Abrir'}
                      <ChevronRight className="w-md h-md ml-2xs" />
                    </Button>
                  )}
              </CathedraCard>
            </motion.div>
          );
        })}
      </div>

      {isLocked && (
        <CathedraCard padding="md" className="premium-card border-primary/10 bg-primary/[0.01] shadow-premium text-center space-y-3">
            <Sparkles className="w-xl h-xl mx-auto text-primary" />
            <p className="text-sm text-foreground font-medium">Esta jornada é exclusiva para assinantes PRO</p>
            <Button onClick={() => navigate(AppRoute.PRICING)} size="sm">
              Ver Planos
            </Button>
        </CathedraCard>
      )}
    </div>
  );
};

export default JornadaDetailPage;
