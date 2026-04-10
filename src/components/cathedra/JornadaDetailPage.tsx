import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Lock, Clock, BookOpen, Hand, PenLine, HelpCircle, ChevronRight, Sparkles, Award, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

const STEP_ICONS: Record<string, React.ReactNode> = {
  reading: <BookOpen className="w-4 h-4" />,
  prayer: <Hand className="w-4 h-4" />,
  reflection: <PenLine className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-muted-foreground">Jornada não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(AppRoute.JORNADAS)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
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
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold font-serif text-foreground">{journey.title}</h1>
          {journey.subtitle && <p className="text-sm text-muted-foreground">{journey.subtitle}</p>}
        </div>
        {journey.is_premium && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" /> PRO
          </Badge>
        )}
      </div>

      {/* Progress */}
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold text-foreground">{completedCount}/{totalSteps} etapas</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{journey.estimated_days} dias</span>
            <span className="capitalize">{journey.difficulty}</span>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {journey.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{journey.description}</p>
      )}

      {/* Completion Banner */}
      {isJourneyComplete && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground"><Icons.PartyPopper className="w-4 h-4 inline mr-2 text-primary" /> Jornada Concluída!</p>
                <p className="text-xs text-muted-foreground">Parabéns! Veja seu certificado e reflexões.</p>
              </div>
              <Button size="sm" onClick={() => navigate(`/jornadas/${id}/complete`)}>
                Ver <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
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
              <Card className={`transition-all ${isNext ? 'border-primary/40 shadow-sm' : ''} ${isCompleted ? 'bg-primary/5' : ''} ${isStepLocked ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Step number / status */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isStepLocked
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : isStepLocked ? <Lock className="w-4 h-4" /> : index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{step.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isLocked && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-primary" />
            <p className="text-sm text-foreground font-medium">Esta jornada é exclusiva para assinantes PRO</p>
            <Button onClick={() => navigate(AppRoute.PRICING)} size="sm">
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JornadaDetailPage;
