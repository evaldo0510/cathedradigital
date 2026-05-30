import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, ArrowLeft, Sparkles, Heart, BookOpen, Church, Hand, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';

interface DiagnosisQuestion {
  id: string;
  question: string;
  options: { label: string; value: string; icon: React.ReactNode }[];
}

const QUESTIONS: DiagnosisQuestion[] = [
  {
    id: 'moment',
    question: 'Como você descreveria seu momento espiritual atual?',
    options: [
      { label: 'Estou começando a buscar Deus', value: 'beginning', icon: <Sun className="w-spacing-md h-spacing-md" /> },
      { label: 'Tenho fé, mas quero aprofundar', value: 'deepening', icon: <BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Passo por um momento difícil', value: 'struggling', icon: <Heart className="w-spacing-md h-spacing-md" /> },
      { label: 'Quero servir melhor a Igreja', value: 'serving', icon: <Church className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'prayer',
    question: 'Qual é sua relação com a oração?',
    options: [
      { label: 'Quase não rezo', value: 'rarely', icon: <Hand className="w-spacing-md h-spacing-md" /> },
      { label: 'Rezo às vezes, mas sem constância', value: 'sometimes', icon: <Sun className="w-spacing-md h-spacing-md" /> },
      { label: 'Tenho vida de oração regular', value: 'regular', icon: <Sparkles className="w-spacing-md h-spacing-md" /> },
      { label: 'Busco oração contemplativa', value: 'contemplative', icon: <Heart className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'knowledge',
    question: 'Quanto você conhece da doutrina católica?',
    options: [
      { label: 'Muito pouco, o básico', value: 'basic', icon: <BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Conheço razoavelmente', value: 'moderate', icon: <BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Estudo com frequência', value: 'advanced', icon: <Sparkles className="w-spacing-md h-spacing-md" /> },
      { label: 'Tenho formação teológica', value: 'theological', icon: <Church className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'sacraments',
    question: 'Como é sua vivência sacramental?',
    options: [
      { label: 'Não frequento os sacramentos', value: 'none', icon: <Church className="w-spacing-md h-spacing-md" /> },
      { label: 'Vou à Missa aos domingos', value: 'sunday', icon: <Church className="w-spacing-md h-spacing-md" /> },
      { label: 'Missa frequente e confissão regular', value: 'frequent', icon: <Sparkles className="w-spacing-md h-spacing-md" /> },
      { label: 'Vida sacramental intensa', value: 'intense', icon: <Heart className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'goal',
    question: 'O que você mais deseja nesta jornada?',
    options: [
      { label: 'Encontrar paz interior', value: 'peace', icon: <Heart className="w-spacing-md h-spacing-md" /> },
      { label: 'Conhecer melhor a fé', value: 'knowledge', icon: <BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Criar uma rotina espiritual', value: 'routine', icon: <Sun className="w-spacing-md h-spacing-md" /> },
      { label: 'Transformação profunda de vida', value: 'transformation', icon: <Sparkles className="w-spacing-md h-spacing-md" /> },
    ],
  },
];

const DiagnosticoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useContext(LangContext);

  const progress = ((currentStep) / QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    const question = QUESTIONS[currentStep];
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      saveDiagnosis(newAnswers);
      setShowResult(true);
    }
  };

  const saveDiagnosis = async (result: Record<string, string>) => {
    if (!user) {
      console.error('saveDiagnosis: no user');
      return;
    }
    try {
      const { data, error } = await (supabase as any)
        .from('user_sensitive_data')
        .update({ diagnosis_result: result })
        .eq('user_id', user.id)
        .select();
      if (error) {
        console.error('Failed to save diagnosis (DB error):', error);
      } else if (!data || data.length === 0) {
        console.warn('saveDiagnosis: no row matched, attempting upsert');
        const { error: upsertErr } = await (supabase as any)
          .from('user_sensitive_data')
          .upsert({ user_id: user.id, diagnosis_result: result, email: '' }, { onConflict: 'user_id' });
        if (upsertErr) console.error('Upsert failed:', upsertErr);
      }
    } catch (err) {
      console.error('Failed to save diagnosis:', err);
    }
  };

  const getRecommendation = () => {
    const { moment, prayer, knowledge } = answers;
    if (moment === 'beginning' || knowledge === 'basic') {
      return { title: 'Primeiros Passos na Fé', description: 'Uma jornada gentil para conhecer os fundamentos da fé católica.', category: 'fundamentos' };
    }
    if (moment === 'struggling' || answers.goal === 'peace') {
      return { title: 'Caminho de Cura Interior', description: 'Encontre consolo e renovação através da oração e dos sacramentos.', category: 'cura' };
    }
    if (prayer === 'contemplative' || answers.goal === 'transformation') {
      return { title: 'Aprofundamento Místico', description: 'Uma jornada para quem busca intimidade mais profunda com Deus.', category: 'mistico' };
    }
    if (answers.goal === 'routine' || prayer === 'rarely' || prayer === 'sometimes') {
      return { title: 'Rotina Espiritual', description: 'Construa hábitos diários de oração, leitura e reflexão.', category: 'rotina' };
    }
    return { title: 'Formação Integral', description: 'Aprofunde-se na doutrina, espiritualidade e vida cristã.', category: 'formacao' };
  };

  if (showResult) {
    const rec = getRecommendation();
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-spacing-lg mx-auto space-y-spacing-lg"
      >
        <div className="text-center space-y-spacing-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-spacing-3xl h-spacing-3xl mx-auto rounded-premium-full bg-primary/10 flex items-center justify-center"
          >
            <Compass className="w-spacing-xl h-spacing-xl text-primary" />
          </motion.div>
          <h1 className="text-premium-2xl font-bold font-serif text-foreground">Sua Jornada Recomendada</h1>
          <p className="text-muted-foreground">Com base nas suas respostas, preparamos o caminho ideal para você.</p>
        </div>

        <Card className="p-spacing-lg space-y-spacing-md border-primary/20">
          <h2 className="text-premium-xl font-bold text-foreground">{rec.title}</h2>
          <p className="text-muted-foreground">{rec.description}</p>
          <div className="flex gap-spacing-sm">
            <Button onClick={() => navigate(AppRoute.JORNADAS)} className="flex-1">
              Ver Jornadas <ArrowRight className="w-spacing-md h-spacing-md ml-spacing-xs" />
            </Button>
            <Button variant="outline" onClick={() => navigate(AppRoute.HOJE)}>
              Ir para Hoje
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  const question = QUESTIONS[currentStep];

  return (
    <div className="max-w-spacing-lg mx-auto space-y-spacing-lg">
      <div className="text-center space-y-spacing-xs">
        <Compass className="w-spacing-xl h-spacing-xl mx-auto text-primary" />
        <h1 className="text-premium-2xl font-bold font-serif text-foreground">Diagnóstico Espiritual</h1>
        <p className="text-premium-sm text-muted-foreground">Responda com sinceridade para encontrarmos a jornada ideal para você.</p>
      </div>

      <Progress value={progress} className="h-spacing-xs" />
      <p className="text-premium-xs text-muted-foreground text-center">
        Pergunta {currentStep + 1} de {QUESTIONS.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="space-y-spacing-md"
        >
          <h2 className="text-premium-lg font-semibold text-foreground text-center">{question.question}</h2>

          <div className="space-y-spacing-sm">
            {question.options.map((opt) => (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(opt.value)}
                className={`w-full flex items-center gap-spacing-sm p-spacing-md rounded-premium-full border transition-all text-left
                  ${answers[question.id] === opt.value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
              >
                <span className="text-primary">{opt.icon}</span>
                <span className="text-premium-sm font-medium">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {currentStep > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
          <ArrowLeft className="w-spacing-md h-spacing-md mr-spacing-2xs" /> Voltar
        </Button>
      )}
    </div>
  );
};

export default DiagnosticoPage;
