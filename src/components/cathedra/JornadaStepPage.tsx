import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, BookOpen, Hand, PenLine, HelpCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STEP_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  reading: { label: 'Leitura', icon: <BookOpen className="w-5 h-5" /> },
  prayer: { label: 'Oração', icon: <Hand className="w-5 h-5" /> },
  reflection: { label: 'Reflexão', icon: <PenLine className="w-5 h-5" /> },
  quiz: { label: 'Quiz', icon: <HelpCircle className="w-5 h-5" /> },
};

const JornadaStepPage: React.FC = () => {
  const { id: journeyId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stepId) loadStep();
  }, [stepId]);

  const loadStep = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('id', stepId!)
        .single();
      if (data) setStep(data);

      if (user) {
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
      await supabase.from('journey_progress').upsert({
        user_id: user.id,
        journey_id: journeyId,
        step_id: stepId,
        reflection: reflection.trim() || null,
      }, { onConflict: 'user_id,step_id' });
      setCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!step) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Etapa não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const content = step.content as Record<string, any>;
  const typeInfo = STEP_TYPE_LABELS[step.step_type] || STEP_TYPE_LABELS.reading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/jornadas/${journeyId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-serif text-foreground">{step.title}</h1>
          {step.subtitle && <p className="text-sm text-muted-foreground">{step.subtitle}</p>}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1">
          {typeInfo.icon}
          {typeInfo.label}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" /> {step.duration_minutes}min
        </Badge>
        {completed && (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
            <Check className="w-3 h-3" /> Concluída
          </Badge>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Bible reference */}
          {content.bible_ref && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Leitura Bíblica</h3>
              <p className="text-lg font-serif text-foreground">{content.bible_ref}</p>
            </div>
          )}

          {/* Catechism reference */}
          {content.catechism_ref && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Catecismo</h3>
              <p className="text-lg font-serif text-foreground">{content.catechism_ref}</p>
            </div>
          )}

          {/* Text content */}
          {content.text && (
            <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic text-foreground/80 font-serif text-lg leading-relaxed">
              {content.text}
              {content.source && (
                <footer className="text-sm text-muted-foreground mt-2 not-italic">— {content.source}</footer>
              )}
            </blockquote>
          )}

          {/* Prayer */}
          {content.prayer && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Oração</h3>
              <p className="text-foreground font-serif">{content.prayer}</p>
            </div>
          )}

          {/* Instruction */}
          {content.instruction && (
            <div className="bg-muted rounded-xl p-4 space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Como fazer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{content.instruction}</p>
            </div>
          )}

          {/* Reflection prompt */}
          {(content.reflection || content.prompt) && (
            <div className="bg-primary/5 rounded-xl p-4 space-y-1 border border-primary/10">
              <h3 className="text-sm font-semibold text-primary">Para Refletir</h3>
              <p className="text-sm text-foreground leading-relaxed">{content.reflection || content.prompt}</p>
            </div>
          )}

          {/* Guidance */}
          {content.guidance && (
            <p className="text-sm text-muted-foreground italic">{content.guidance}</p>
          )}

          {/* Method */}
          {content.method && (
            <div className="bg-muted rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Método</h3>
              <p className="text-sm text-muted-foreground">{content.method}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reflection textarea */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            Sua Reflexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="O que esta etapa tocou no seu coração? Escreva livremente..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[100px] resize-none text-sm"
            disabled={completed}
          />
        </CardContent>
      </Card>

      {/* Complete button */}
      {!completed ? (
        <Button
          onClick={completeStep}
          disabled={saving}
          className="w-full py-6 text-base font-bold"
        >
          {saving ? 'Salvando...' : 'Concluir Etapa'}
          <Check className="w-5 h-5 ml-2" />
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => navigate(`/jornadas/${journeyId}`)}
          className="w-full"
        >
          Voltar à Jornada
        </Button>
      )}
    </motion.div>
  );
};

export default JornadaStepPage;
