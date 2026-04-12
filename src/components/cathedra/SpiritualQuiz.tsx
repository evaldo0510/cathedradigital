import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, BookOpen, Sun, Church, Globe, ArrowRight, ArrowLeft, Flame, Users, Brain, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import confetti from 'canvas-confetti';

/* ── Profile types ── */
type SpiritualProfile = 'iniciante' | 'ferido' | 'buscador' | 'aprofundando' | 'missionario';

interface ProfileResult {
  id: SpiritualProfile;
  title: string;
  emoji: string;
  description: string;
  journeySlug: string;
  journeyName: string;
  theme: string;
  color: string;
}

const PROFILES: Record<SpiritualProfile, ProfileResult> = {
  iniciante: {
    id: 'iniciante',
    title: 'Iniciante na Fé',
    emoji: '🌱',
    description: 'Você está dando os primeiros passos na vida espiritual. O importante é a abertura do coração — Deus faz o resto. Comece com calma e descubra a beleza da fé católica.',
    journeySlug: 'fundamentos',
    journeyName: 'Fundamentos da Fé',
    theme: 'Fé',
    color: 'text-emerald-600',
  },
  ferido: {
    id: 'ferido',
    title: 'Coração Ferido',
    emoji: '💔',
    description: 'Você carrega dores e feridas que afastaram o seu coração. Mas Deus não desistiu de você. Ele quer curar, restaurar e devolver a paz que o mundo não pode dar.',
    journeySlug: 'cura',
    journeyName: 'Libertação Interior',
    theme: 'Perdão',
    color: 'text-rose-600',
  },
  buscador: {
    id: 'buscador',
    title: 'Buscador Sincero',
    emoji: '🔍',
    description: 'Você já começou a caminhar e agora precisa de direção. Sua curiosidade é um dom — permita que ela o leve mais fundo na Tradição, na oração e nos Sacramentos.',
    journeySlug: 'proposito',
    journeyName: 'Propósito Interior',
    theme: 'Fé',
    color: 'text-amber-600',
  },
  aprofundando: {
    id: 'aprofundando',
    title: 'Aprofundando a Fé',
    emoji: '📖',
    description: 'Você já caminha com firmeza e busca raízes mais profundas. É hora de mergulhar na mística, no estudo teológico e na vida sacramental com mais intensidade.',
    journeySlug: 'formacao',
    journeyName: 'Formação Teológica',
    theme: 'Oração',
    color: 'text-primary',
  },
  missionario: {
    id: 'missionario',
    title: 'Missionário de Cristo',
    emoji: '🔥',
    description: 'Você vive a fé com paixão e deseja levá-la ao mundo. Seu chamado é servir, evangelizar e transformar a realidade ao redor com o fogo do Espírito Santo.',
    journeySlug: 'mistico',
    journeyName: 'Vida Mística',
    theme: 'Propósito',
    color: 'text-red-600',
  },
};

/* ── Questions ── */
interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string; icon: React.ReactNode; weight: Record<SpiritualProfile, number> }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'spiritual_state',
    question: 'Como está sua vida espiritual hoje?',
    options: [
      { label: 'Distante de Deus', value: 'distante', icon: <Sun className="w-5 h-5" />, weight: { iniciante: 3, ferido: 2, buscador: 0, aprofundando: 0, missionario: 0 } },
      { label: 'Instável, com altos e baixos', value: 'instavel', icon: <Heart className="w-5 h-5" />, weight: { iniciante: 0, ferido: 1, buscador: 3, aprofundando: 0, missionario: 0 } },
      { label: 'Buscando algo mais', value: 'buscando', icon: <Sparkles className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 2, aprofundando: 3, missionario: 0 } },
      { label: 'Firme e em crescimento', value: 'firme', icon: <Flame className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 2, missionario: 3 } },
    ],
  },
  {
    id: 'prayer_life',
    question: 'Como é a sua vida de oração?',
    options: [
      { label: 'Ainda não tenho o hábito de rezar', value: 'none', icon: <Sun className="w-5 h-5" />, weight: { iniciante: 3, ferido: 1, buscador: 1, aprofundando: 0, missionario: 0 } },
      { label: 'Rezo quando sinto necessidade', value: 'occasional', icon: <Heart className="w-5 h-5" />, weight: { iniciante: 1, ferido: 2, buscador: 3, aprofundando: 0, missionario: 0 } },
      { label: 'Tenho uma rotina diária de oração', value: 'daily', icon: <Sparkles className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 3, missionario: 1 } },
      { label: 'A oração é o centro da minha vida', value: 'center', icon: <Flame className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 1, missionario: 3 } },
    ],
  },
  {
    id: 'pain_point',
    question: 'O que mais pesa no seu coração agora?',
    options: [
      { label: 'Não sei por onde começar', value: 'lost', icon: <Sun className="w-5 h-5" />, weight: { iniciante: 3, ferido: 0, buscador: 2, aprofundando: 0, missionario: 0 } },
      { label: 'Feridas, culpa ou mágoas', value: 'wounds', icon: <Heart className="w-5 h-5" />, weight: { iniciante: 0, ferido: 3, buscador: 1, aprofundando: 0, missionario: 0 } },
      { label: 'Falta de profundidade na fé', value: 'depth', icon: <BookOpen className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 1, aprofundando: 3, missionario: 0 } },
      { label: 'Quero fazer mais pelo Reino', value: 'mission', icon: <Globe className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 1, missionario: 3 } },
    ],
  },
  {
    id: 'sacraments',
    question: 'Como você vive os Sacramentos?',
    options: [
      { label: 'Fui batizado mas não pratico', value: 'baptized', icon: <Church className="w-5 h-5" />, weight: { iniciante: 3, ferido: 2, buscador: 0, aprofundando: 0, missionario: 0 } },
      { label: 'Vou à Missa nos domingos', value: 'sunday', icon: <Church className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 3, aprofundando: 1, missionario: 0 } },
      { label: 'Missa frequente e confissão regular', value: 'frequent', icon: <Sparkles className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 3, missionario: 1 } },
      { label: 'Vida sacramental intensa e contínua', value: 'intense', icon: <Flame className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 1, missionario: 3 } },
    ],
  },
  {
    id: 'desire',
    question: 'O que mais deseja nesta jornada?',
    options: [
      { label: 'Descobrir quem é Deus', value: 'discover', icon: <Sun className="w-5 h-5" />, weight: { iniciante: 3, ferido: 1, buscador: 1, aprofundando: 0, missionario: 0 } },
      { label: 'Encontrar cura e paz interior', value: 'healing', icon: <Heart className="w-5 h-5" />, weight: { iniciante: 0, ferido: 3, buscador: 1, aprofundando: 0, missionario: 0 } },
      { label: 'Crescer na santidade pessoal', value: 'holiness', icon: <Sparkles className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 1, aprofundando: 3, missionario: 1 } },
      { label: 'Evangelizar e transformar o mundo', value: 'evangelize', icon: <Flame className="w-5 h-5" />, weight: { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 0, missionario: 3 } },
    ],
  },
];

function computeProfile(answers: Record<string, string>): SpiritualProfile {
  const scores: Record<SpiritualProfile, number> = { iniciante: 0, ferido: 0, buscador: 0, aprofundando: 0, missionario: 0 };

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    const option = q.options.find(o => o.value === answer);
    if (option) {
      for (const [profile, weight] of Object.entries(option.weight)) {
        scores[profile as SpiritualProfile] += weight;
      }
    }
  }

  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as SpiritualProfile;
}

/* ── Component ── */
const SpiritualQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SpiritualProfile | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [existingProfile, setExistingProfile] = useState<SpiritualProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('user_sensitive_data')
      .select('diagnosis_result')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.diagnosis_result?.spiritual_profile) {
          setAlreadyDone(true);
          setExistingProfile(data.diagnosis_result.spiritual_profile);
        }
      });
  }, [user]);

  const handleAnswer = useCallback((value: string) => {
    const question = QUESTIONS[currentStep];
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(s => s + 1), 300);
    } else {
      const profile = computeProfile(newAnswers);
      setResult(profile);
      setPhase('result');
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#FFD700', '#8B5CF6', '#4ECDC4'] });
      saveResult(profile, newAnswers);
    }
  }, [currentStep, answers]);

  const saveResult = async (profile: SpiritualProfile, allAnswers: Record<string, string>) => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('user_sensitive_data')
        .update({ diagnosis_result: { ...allAnswers, spiritual_profile: profile } })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Failed to save spiritual profile:', err);
    }
  };

  const resetQuiz = () => {
    setPhase('intro');
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setAlreadyDone(false);
    setExistingProfile(null);
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  // ── Already completed: compact card ──
  if (alreadyDone && existingProfile && PROFILES[existingProfile]) {
    const p = PROFILES[existingProfile];
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Seu Perfil Espiritual</span>
          <button onClick={resetQuiz} className="text-[10px] text-primary hover:underline">Refazer</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{p.emoji}</span>
          <div>
            <h3 className={`text-base font-bold ${p.color}`}>{p.title}</h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => navigate(AppRoute.JORNADAS)}>
            <Sparkles className="w-3 h-3 mr-1" /> {p.journeyName}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl text-xs" onClick={() => navigate(AppRoute.STUDY_MODE)}>
            <Brain className="w-3 h-3 mr-1" /> Logos
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Result screen ──
  if (phase === 'result' && result) {
    const p = PROFILES[result];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-primary/5 p-6 md:p-8 space-y-6 shadow-lg"
      >
        <div className="text-center space-y-3">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-5xl block"
          >
            {p.emoji}
          </motion.span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-1">✨ Seu momento espiritual</p>
            <h2 className={`text-2xl font-black ${p.color}`}>{p.title}</h2>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-md mx-auto">{p.description}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Recommendations */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Recomendado para você</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/[0.04] border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground/80">Jornada: <strong className="text-foreground">{p.journeyName}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/[0.04] border border-primary/10">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground/80">Tema: <strong className="text-foreground">{p.theme}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/[0.06] border border-secondary/10">
              <Brain className="w-4 h-4 text-secondary shrink-0" />
              <span className="text-foreground/80">Reflexão personalizada com <strong className="text-foreground">Logos IA</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(AppRoute.JORNADAS)} className="rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" /> Começar Jornada
          </Button>
          <Button variant="outline" onClick={() => navigate(AppRoute.STUDY_MODE)} className="rounded-2xl h-11 gap-2 text-xs font-bold border-secondary/30 text-secondary hover:bg-secondary/5">
            <Brain className="w-4 h-4" /> Refletir com Logos
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setAlreadyDone(true); setExistingProfile(result); }} className="text-xs text-muted-foreground">
            Continuar navegando
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Intro screen ──
  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-card to-secondary/5 p-6 md:p-8 space-y-5 shadow-sm text-center"
      >
        <div className="space-y-2">
          <span className="text-4xl">🧠</span>
          <h2 className="text-xl font-black text-foreground">Descubra seu momento espiritual</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Responda 5 perguntas rápidas e receba um caminho personalizado
          </p>
        </div>
        <div className="flex items-center justify-center gap-1 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Leva menos de 1 minuto</span>
        </div>
        <Button
          onClick={() => setPhase('quiz')}
          className="w-full rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Começar <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  // ── Quiz flow ──
  const question = QUESTIONS[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-card to-secondary/5 p-6 space-y-5 shadow-sm"
    >
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Quiz Espiritual</p>
          <p className="text-[10px] font-bold text-muted-foreground">Pergunta {currentStep + 1} de {QUESTIONS.length}</p>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-secondary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <h3 className="text-base font-bold text-foreground text-center leading-snug">{question.question}</h3>

          <div className="space-y-2.5">
            {question.options.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(opt.value)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-secondary/40 hover:bg-secondary/5 transition-all text-left"
              >
                <span className="text-secondary shrink-0">{opt.icon}</span>
                <span className="text-sm font-medium text-foreground/80">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {currentStep > 0 && (
        <button onClick={() => setCurrentStep(s => s - 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
      )}
    </motion.div>
  );
};

export default SpiritualQuiz;
