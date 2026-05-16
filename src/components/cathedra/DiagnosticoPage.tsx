import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, ArrowLeft, Sparkles, Heart, BookOpen, Church, Hand, Sun } from 'lucide-react';
import { Button   } from '@/components/cathedra/Button';
import { Card     } from '@/components/cathedra/Card';
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
      { label: 'Estou começando a buscar Deus', value: 'beginning', icon: <Sun className="w-5 h-5" /> },
      { label: 'Tenho fé, mas quero aprofundar', value: 'deepening', icon: <BookOpen className="w-5 h-5" /> },
      { label: 'Passo por um momento difícil', value: 'struggling', icon: <Heart className="w-5 h-5" /> },
      { label: 'Quero servir melhor a Igreja', value: 'serving', icon: <Church className="w-5 h-5" /> },
    ],
  },
  {
    id: 'prayer',
    question: 'Qual é sua relação com a oração?',
    options: [
      { label: 'Quase não rezo', value: 'rarely', icon: <Hand className="w-5 h-5" /> },
      { label: 'Rezo às vezes, mas sem constância', value: 'sometimes', icon: <Sun className="w-5 h-5" /> },
      { label: 'Tenho vida de oração regular', value: 'regular', icon: <Sparkles className="w-5 h-5" /> },
      { label: 'Busco oração contemplativa', value: 'contemplative', icon: <Heart className="w-5 h-5" /> },
    ],
  },
  {
    id: 'knowledge',
    question: 'Quanto você conhece da doutrina católica?',
    options: [
      { label: 'Muito pouco, o básico', value: 'basic', icon: <BookOpen className="w-5 h-5" /> },
      { label: 'Conheço razoavelmente', value: 'moderate', icon: <BookOpen className="w-5 h-5" /> },
      { label: 'Estudo com frequência', value: 'advanced', icon: <Sparkles className="w-5 h-5" /> },
      { label: 'Tenho formação teológica', value: 'theological', icon: <Church className="w-5 h-5" /> },
    ],
  },
  {
    id: 'sacraments',
    question: 'Como é sua vivência sacramental?',
    options: [
      { label: 'Não frequento os sacramentos', value: 'none', icon: <Church className="w-5 h-5" /> },
      { label: 'Vou à Missa aos domingos', value: 'sunday', icon: <Church className="w-5 h-5" /> },
      { label: 'Missa frequente e confissão regular', value: 'frequent', icon: <Sparkles className="w-5 h-5" /> },
      { label: 'Vida sacramental intensa', value: 'intense', icon: <Heart className="w-5 h-5" /> },
    ],
  },
  {
    id: 'goal',
    question: 'O que você mais deseja nesta jornada?',
    options: [
      { label: 'Encontrar paz interior', value: 'peace', icon: <Heart className="w-5 h-5" /> },
      { label: 'Conhecer melhor a fé', value: 'knowledge', icon: <BookOpen className="w-5 h-5" /> },
      { label: 'Criar uma rotina espiritual', value: 'routine', icon: <Sun className="w-5 h-5" /> },
      { label: 'Transformação profunda de vida', value: 'transformation', icon: <Sparkles className="w-5 h-5" /> },
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
        className="max-w-lg mx-auto space-y-6"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Compass className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Sua Jornada Recomendada</h1>
          <p className="text-muted-foreground">Com base nas suas respostas, preparamos o caminho ideal para você.</p>
        </div>

        <Card className="p-6 space-y-4 border-primary/20">
          <h2 className="text-xl font-bold text-foreground">{rec.title}</h2>
          <p className="text-muted-foreground">{rec.description}</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate(AppRoute.JORNADAS)} className="flex-1">
              Ver Jornadas <ArrowRight className="w-4 h-4 ml-2" />
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-6 bg-background reading-sepia">
      <div className="w-full max-w-2xl space-y-16 text-center">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-primary/20">
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Exame de Alma</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{currentStep + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="h-0.5 bg-primary/[0.03] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-secondary/30"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 30, stiffness: 100 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 block"
              >
                Reflexão
              </motion.span>
              <h2 className="text-3xl md:text-5xl font-display text-primary tracking-tight leading-tight">{question.question}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
              {question.options.map((opt, idx) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswer(opt.value)}
                  className="flex items-center justify-between p-8 rounded-[1.5rem] border border-primary/5 bg-primary/[0.01] hover:bg-primary/[0.03] hover:border-primary/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-full bg-primary/[0.02] flex items-center justify-center border border-primary/5 group-hover:border-primary/20 transition-all">
                      {opt.icon}
                    </div>
                    <span className="text-lg font-monastery text-primary/70 group-hover:text-primary transition-colors">{opt.label}</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-primary/10 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {currentStep > 0 && (
          <div className="pt-12 flex justify-center">
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary/10 hover:text-primary/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoPage;
