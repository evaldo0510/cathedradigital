import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import onboardingBible from '@/assets/onboarding-bible.webp';
import onboardingPrayer from '@/assets/onboarding-prayer.webp';
import onboardingStudy from '@/assets/onboarding-study.webp';
import onboardingCommunity from '@/assets/onboarding-community.webp';

/* ── Intro slides ── */
const SLIDES = [
  {
    icon: <Icons.Sparkles className="w-spacing-xl h-spacing-xl" />,
    title: 'O Ecossistema Cathedra',
    subtitle: 'Sua vida espiritual integrada',
    description: 'Um ambiente digital sagrado que une oração, estudo, formação e comunidade em uma experiência única e personalizada.',
    image: onboardingBible,
  },
  {
    icon: <Icons.Sun className="w-spacing-xl h-spacing-xl" />,
    title: 'A Aba "Hoje"',
    subtitle: 'Seu ponto de partida diário',
    description: 'Encontre aqui o que você precisa para o dia: Liturgia, o Santo do dia, orações recomendadas e seu progresso espiritual.',
    image: onboardingPrayer,
  },
  {
    icon: <Icons.BookOpen className="w-spacing-xl h-spacing-xl" />,
    title: 'Biblioteca e Scriptuarium',
    subtitle: 'O tesouro da Tradição',
    description: 'Navegue pela Bíblia, Catecismo e documentos do Magistério. Use a busca inteligente para encontrar respostas em milênios de sabedoria.',
    image: onboardingBible,
  },
  {
    icon: <Icons.Zap className="w-spacing-xl h-spacing-xl" />,
    title: 'Logos IA: Estudo Profundo',
    subtitle: 'Inteligência Contemplativa',
    description: 'Dúvidas sobre a fé? O Logos IA explica temas complexos usando apenas fontes seguras e tradicionais da Igreja Católica.',
    image: onboardingStudy,
  },
  {
    icon: <Icons.Compass className="w-spacing-xl h-spacing-xl" />,
    title: 'Jornadas de Formação',
    subtitle: 'Caminhos de Santidade',
    description: 'Siga trilhas estruturadas de aprendizado. Do básico ao avançado, cada passo é uma nova descoberta na sua caminhada de fé.',
    image: onboardingCommunity,
  },
  {
    icon: <Icons.Users className="w-spacing-xl h-spacing-xl" />,
    title: 'Aula Magna e Comunidade',
    subtitle: 'Crescendo em Fraternidade',
    description: 'Partilhe reflexões, veja o que outros fiéis estão meditando e sinta-se parte de uma comunidade viva e orante.',
    image: onboardingCommunity,
  },
  {
    icon: <Icons.Heart className="w-spacing-xl h-spacing-xl" />,
    title: 'Como Usar?',
    subtitle: 'Simples e Profundo',
    description: 'Navegue pelo menu inferior para alternar entre as áreas. Marque leituras como concluídas para ganhar XP e acompanhar sua evolução.',
    image: onboardingPrayer,
  },
  {
    icon: <Icons.Compass className="w-spacing-xl h-spacing-xl" />,
    title: 'Pronto para Começar?',
    subtitle: 'Seu Diagnóstico Espiritual',
    description: 'A seguir, faremos algumas perguntas para personalizar sua experiência e recomendar a jornada ideal para o seu momento.',
    image: onboardingStudy,
  },
];

/* ── Diagnosis questions ── */
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
      { label: 'Estou começando a buscar Deus', value: 'beginning', icon: <Icons.Sun className="w-spacing-md h-spacing-md" /> },
      { label: 'Tenho fé, mas quero aprofundar', value: 'deepening', icon: <Icons.BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Passo por um momento difícil', value: 'struggling', icon: <Icons.Heart className="w-spacing-md h-spacing-md" /> },
      { label: 'Quero servir melhor a Igreja', value: 'serving', icon: <Icons.Church className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'prayer',
    question: 'Qual é sua relação com a oração?',
    options: [
      { label: 'Quase não rezo', value: 'rarely', icon: <Icons.Hand className="w-spacing-md h-spacing-md" /> },
      { label: 'Rezo às vezes, mas sem constância', value: 'sometimes', icon: <Icons.Sun className="w-spacing-md h-spacing-md" /> },
      { label: 'Tenho vida de oração regular', value: 'regular', icon: <Icons.Sparkles className="w-spacing-md h-spacing-md" /> },
      { label: 'Busco oração contemplativa', value: 'contemplative', icon: <Icons.Heart className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'knowledge',
    question: 'Quanto você conhece da doutrina católica?',
    options: [
      { label: 'Muito pouco, o básico', value: 'basic', icon: <Icons.BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Conheço razoavelmente', value: 'moderate', icon: <Icons.BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Estudo com frequência', value: 'advanced', icon: <Icons.Sparkles className="w-spacing-md h-spacing-md" /> },
      { label: 'Tenho formação teológica', value: 'theological', icon: <Icons.Church className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'sacraments',
    question: 'Como é sua vivência sacramental?',
    options: [
      { label: 'Não frequento os sacramentos', value: 'none', icon: <Icons.Church className="w-spacing-md h-spacing-md" /> },
      { label: 'Vou à Missa aos domingos', value: 'sunday', icon: <Icons.Church className="w-spacing-md h-spacing-md" /> },
      { label: 'Missa frequente e confissão regular', value: 'frequent', icon: <Icons.Sparkles className="w-spacing-md h-spacing-md" /> },
      { label: 'Vida sacramental intensa', value: 'intense', icon: <Icons.Heart className="w-spacing-md h-spacing-md" /> },
    ],
  },
  {
    id: 'goal',
    question: 'O que você mais deseja nesta jornada?',
    options: [
      { label: 'Encontrar paz interior', value: 'peace', icon: <Icons.Heart className="w-spacing-md h-spacing-md" /> },
      { label: 'Conhecer melhor a fé', value: 'knowledge', icon: <Icons.BookOpen className="w-spacing-md h-spacing-md" /> },
      { label: 'Criar uma rotina espiritual', value: 'routine', icon: <Icons.Sun className="w-spacing-md h-spacing-md" /> },
      { label: 'Transformação profunda de vida', value: 'transformation', icon: <Icons.Sparkles className="w-spacing-md h-spacing-md" /> },
    ],
  },
];

function getRecommendedCategory(answers: Record<string, string>): string {
  const { moment, prayer, knowledge, goal } = answers;
  if (moment === 'beginning' || knowledge === 'basic') return 'fundamentos';
  if (moment === 'struggling' || goal === 'peace') return 'mistico';
  if (prayer === 'contemplative' || goal === 'transformation') return 'mistico';
  if (goal === 'routine' || prayer === 'rarely' || prayer === 'sometimes') return 'rotina';
  return 'fundamentos';
}

/* ── Component ── */
type Phase = 'slides' | 'diagnosis' | 'result';

const OnboardingPage = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [phase, setPhase] = useState<Phase>('slides');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [diagStep, setDiagStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedCategory, setRecommendedCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLastSlide = currentSlide === SLIDES.length - 1;

  /* ── Slide navigation ── */
  const handleSlideNext = () => {
    if (isLastSlide) {
      setPhase('diagnosis');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSlidePrev = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const handleSkipSlides = () => {
    setPhase('diagnosis');
  };

  /* ── Diagnosis ── */
  const handleDiagAnswer = (value: string) => {
    const question = QUESTIONS[diagStep];
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (diagStep < QUESTIONS.length - 1) {
      setTimeout(() => setDiagStep(diagStep + 1), 300);
    } else {
      finishDiagnosis(newAnswers);
    }
  };

  const finishDiagnosis = async (result: Record<string, string>) => {
    setSaving(true);
    const category = getRecommendedCategory(result);
    setRecommendedCategory(category);

    // Icons.Map moment to spiritual profile for dashboard personalization
    const spiritualProfileMap: Record<string, string> = {
      beginning: 'sedento_de_sentido',
      deepening: 'firme_aprofundando',
      struggling: 'ferido_em_busca',
      serving: 'ardente_missionario'
    };
    const spiritualProfile = spiritualProfileMap[result.moment] || 'sedento_de_sentido';

    try {
      if (user) {
        await (supabase as any)
          .from('user_sensitive_data')
          .upsert({ 
            user_id: user.id, 
            diagnosis_result: { ...result, spiritual_profile: spiritualProfile },
            email: user.email || ''
          }, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.error('Failed to save diagnosis:', err);
    }

    localStorage.setItem('cathedra_onboarding_done', 'true');
    setSaving(false);
    setPhase('result');
  };

  const handleGoToJourney = async () => {
    try {
      const { data } = await supabase
        .from('journeys')
        .select('id')
        .eq('category', recommendedCategory)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        navigate(`/jornadas/${data.id}`, { replace: true });
      } else {
        navigate(AppRoute.JORNADAS, { replace: true });
      }
    } catch {
      navigate(AppRoute.JORNADAS, { replace: true });
    }
  };

  /* ── Render: Result ── */
  if (phase === 'result') {
    const categoryNames: Record<string, string> = {
      fundamentos: 'Primeiros Passos na Fé',
      rotina: 'Rotina Espiritual',
      mistico: 'Aprofundamento Místico',
    };
    const title = categoryNames[recommendedCategory] || 'Formação Integral';

    return (
      <div ref={ref} className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-spacing-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-spacing-lg lg:max-w-spacing-3xl space-y-spacing-lg lg:space-y-spacing-2xl"
        >
          <div className="text-center space-y-spacing-sm">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-spacing-3xl h-spacing-3xl mx-auto rounded-premium-full bg-primary/10 flex items-center justify-center"
            >
              <Icons.Compass className="w-spacing-xl h-spacing-xl text-primary" />
            </motion.div>
            <h1 className="text-premium-2xl font-bold font-serif text-foreground">Sua Jornada Recomendada</h1>
            <p className="text-muted-foreground text-premium-sm">Com base nas suas respostas, preparamos o caminho ideal para você.</p>
          </div>

          <div className="bg-card border border-primary/20 rounded-premium p-spacing-lg space-y-spacing-sm text-center">
            <h2 className="text-premium-xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground text-premium-sm">Uma jornada guiada pensada especialmente para o seu momento espiritual.</p>
          </div>

          <Button
            onClick={handleGoToJourney}
            className="w-full flex items-center justify-center gap-spacing-xs px-spacing-lg py-spacing-md bg-foreground text-background rounded-premium-full font-black uppercase text-premium-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Começar Minha Jornada <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ── Render: Diagnosis phase ── */
  if (phase === 'diagnosis') {
    const question = QUESTIONS[diagStep];
    const diagProgress = ((diagStep) / QUESTIONS.length) * 100;

    return (
      <div ref={ref} className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-spacing-md">
        <div className="w-full max-w-spacing-lg lg:max-w-spacing-4xl space-y-spacing-lg lg:space-y-spacing-xl text-center">
          <div className="flex justify-center mb-spacing-lg">
            <Icons.Logo className="w-spacing-3xl h-spacing-3xl" variant="blue" />
          </div>
          
          <div className="space-y-spacing-xs mb-spacing-xl">
            <div className="w-full h-spacing-2xs bg-muted rounded-premium overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${diagProgress}%` }}
              />
            </div>
            <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Pergunta {diagStep + 1} de {QUESTIONS.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-spacing-xl"
            >
              <h2 className="text-premium-2xl lg:text-premium-4xl font-serif font-bold text-foreground leading-tight px-spacing-md">{question.question}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
                {question.options.map((opt) => (
                  <Button
                    key={opt.value}
                    onClick={() => handleDiagAnswer(opt.value)}
                    className="flex items-center gap-spacing-md p-spacing-md rounded-premium-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="p-spacing-sm rounded-premium bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {opt.icon}
                    </div>
                    <span className="font-bold text-foreground">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ── Render: Slides phase ── */
  const slide = SLIDES[currentSlide];

  return (
    <div ref={ref} className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-spacing-md">
      <div className="w-full max-w-spacing-lg lg:max-w-5xl space-y-spacing-lg lg:space-y-spacing-xl">
        <div className="flex justify-center">
          <Icons.Logo className="w-spacing-3xl h-spacing-3xl" variant="blue" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-premium-full overflow-hidden lg:flex lg:items-center lg:min-h-[500px]"
          >
            <img src={slide.image} alt={slide.title} className="w-full h-spacing-4xl md:h-spacing-4xl lg:h-full lg:w-spacing-2xs/2 object-cover" />
            <div className="p-spacing-lg md:p-spacing-xl lg:p-spacing-3xl text-center lg:text-left lg:w-spacing-2xs/2 space-y-spacing-md lg:space-y-spacing-xl">
              <div className="flex justify-center lg:justify-start text-primary mb-spacing-xs lg:mb-spacing-md">{slide.icon}</div>
              <h1 className="text-premium-2xl md:text-premium-3xl lg:text-premium-5xl font-serif font-bold text-foreground leading-tight">{slide.title}</h1>
              <p className="text-premium-xs lg:text-premium-xs font-black uppercase tracking-widest text-primary">{slide.subtitle}</p>
              <p className="text-muted-foreground leading-relaxed text-premium-sm lg:text-premium-lg lg:max-w-spacing-md">{slide.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-spacing-xs">
          {SLIDES.map((_, i) => (
            <Button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-spacing-xs h-spacing-xs rounded-premium-full transition-all ${
                i === currentSlide ? 'bg-primary w-spacing-lg' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
          <div className="w-spacing-xs h-spacing-xs rounded-premium bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between">
          {currentSlide > 0 ? (
            <Button onClick={handleSlidePrev} className="flex items-center gap-spacing-2xs text-premium-sm text-muted-foreground hover:text-foreground transition-colors">
              <Icons.ChevronLeft className="w-spacing-md h-spacing-md" /> Voltar
            </Button>
          ) : (
            <Button onClick={handleSkipSlides} className="text-premium-sm text-muted-foreground hover:text-foreground transition-colors">
              Pular
            </Button>
          )}

          <Button
            onClick={handleSlideNext}
            className="flex items-center gap-spacing-xs px-spacing-lg py-spacing-sm bg-foreground text-background rounded-premium-full font-black uppercase text-premium-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {isLastSlide ? 'Diagnóstico' : 'Próximo'}
            <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
          </Button>
        </div>
      </div>
    </div>
  );
});

OnboardingPage.displayName = 'OnboardingPage';

export default OnboardingPage;