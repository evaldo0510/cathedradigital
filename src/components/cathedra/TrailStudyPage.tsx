import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  PlayCircle, 
  Trophy,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getTrailBySlug } from '@/data/trilhas';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppRoute } from '@/types';
import CatechismContent from './Catechism'; // We'll need to export this or refactor it

const TrailStudyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const trail = getTrailBySlug(slug || '');
  const currentStepId = searchParams.get('step') || (trail?.steps[0]?.id);
  const currentStepIndex = trail?.steps.findIndex(s => s.id === currentStepId) ?? 0;
  const currentStep = trail?.steps[currentStepIndex];

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !trail) return;

    const fetchProgress = async () => {
      const { data } = await supabase
        .from('journey_progress')
        .select('step_id')
        .eq('user_id', user.id)
        .eq('journey_id', trail.id);
      
      if (data) {
        setCompletedSteps(new Set(data.map(d => d.step_id)));
      }
      setLoading(false);
    };

    fetchProgress();
  }, [user, trail]);

  const handleCompleteStep = async () => {
    if (!user || !trail || !currentStep) return;

    try {
      await supabase.from('journey_progress').upsert({
        user_id: user.id,
        journey_id: trail.id,
        step_id: currentStep.id,
        completed_at: new Date().toISOString()
      });

      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      toast.success('Etapa concluída!');
      
      // Navigate to next step if available
      if (currentStepIndex < trail.steps.length - 1) {
        const nextStep = trail.steps[currentStepIndex + 1];
        setSearchParams({ step: nextStep.id });
      } else {
        toast.success('Trilha finalizada com sucesso!', {
          icon: <Trophy className="w-5 h-5 text-yellow-500" />
        });
        navigate(AppRoute.JORNADAS);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
      toast.error('Erro ao salvar progresso');
    }
  };

  if (!trail || !currentStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-muted-foreground">Trilha não encontrada.</p>
        <Button onClick={() => navigate(AppRoute.JORNADAS)}>Voltar para Jornadas</Button>
      </div>
    );
  }

  const progressPercentage = (completedSteps.size / trail.steps.length) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(AppRoute.JORNADAS)}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">{trail.level}</Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold">{trail.title}</h1>
          <div className="flex items-center gap-4">
            <Progress value={progressPercentage} className="h-2 flex-1" />
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              {completedSteps.size} / {trail.steps.length} Concluídos
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Step Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <LayoutDashboard className="w-3 h-3" /> Etapas da Trilha
          </h3>
          <div className="space-y-2">
            {trail.steps.map((step, idx) => {
              const isCompleted = completedSteps.has(step.id);
              const isActive = step.id === currentStepId;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setSearchParams({ step: step.id })}
                  className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center gap-3 ${
                    isActive 
                      ? 'bg-primary/10 border-primary/20 shadow-sm' 
                      : 'bg-card/50 border-transparent hover:border-border'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isCompleted ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      Passo {idx + 1}
                    </p>
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-card/40 backdrop-blur-md border-border/50 rounded-3xl overflow-hidden min-h-[500px]">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  {currentStep.type === 'catechism' ? <BookOpen className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold">{currentStep.title}</h2>
                  {currentStep.description && <p className="text-sm text-muted-foreground">{currentStep.description}</p>}
                </div>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                {currentStep.type === 'catechism' && (
                  <div className="bg-muted/30 p-6 rounded-2xl border border-border/40">
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">Parágrafo §{currentStep.ref}</p>
                    {/* Here we would ideally use a shared CatechismParagraph component */}
                    <div className="font-serif italic text-lg leading-relaxed">
                      Carregando parágrafo do Catecismo...
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-border/30 flex justify-between items-center">
                <Button
                  variant="outline"
                  disabled={currentStepIndex === 0}
                  onClick={() => setSearchParams({ step: trail.steps[currentStepIndex - 1].id })}
                  className="rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>

                <Button
                  onClick={handleCompleteStep}
                  className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                >
                  {completedSteps.has(currentStep.id) ? 'Refazer Etapa' : 'Concluir Etapa'}
                </Button>

                <Button
                  variant="outline"
                  disabled={currentStepIndex === trail.steps.length - 1}
                  onClick={() => setSearchParams({ step: trail.steps[currentStepIndex + 1].id })}
                  className="rounded-xl"
                >
                  Próximo <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrailStudyPage;
