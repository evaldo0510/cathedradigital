import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, Users, Zap, ChevronRight, ChevronLeft, Compass, Sun, Hand, Sparkles, Church } from 'lucide-react';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import onboardingBible from '@/assets/onboarding-bible.jpg';
import onboardingPrayer from '@/assets/onboarding-prayer.jpg';
import onboardingStudy from '@/assets/onboarding-study.jpg';
import onboardingCommunity from '@/assets/onboarding-community.jpg';

/* ── Intro slides ── */
const SLIDES = [
  {
    icon: <Sparkles className="w-xl h-xl" />,
    title: 'O Ecossistema Cathedra',
    subtitle: 'Sua vida espiritual integrada',
    description: 'Um ambiente digital sagrado que une oração, estudo, formação e comunidade em uma experiência única e personalizada.',
    image: onboardingBible,
  },
  {
    icon: <Sun className="w-xl h-xl" />,
    title: 'A Aba "Hoje"',
    subtitle: 'Seu ponto de partida diário',
    description: 'Encontre aqui o que você precisa para o dia: Liturgia, o Santo do dia, orações recomendadas e seu progresso espiritual.',
    image: onboardingPrayer,
  },
  {
    icon: <BookOpen className="w-xl h-xl" />,
    title: 'Biblioteca e Scriptuarium',
    subtitle: 'O tesouro da Tradição',
    description: 'Navegue pela Bíblia, Catecismo e documentos do Magistério. Use a busca inteligente para encontrar respostas em milênios de sabedoria.',
    image: onboardingBible,
  },
  {
    icon: <Zap className="w-xl h-xl" />,
    title: 'Logos IA: Estudo Profundo',
    subtitle: 'Inteligência Contemplativa',
    description: 'Dúvidas sobre a fé? O Logos IA explica temas complexos usando apenas fontes seguras e tradicionais da Igreja Católica.',
    image: onboardingStudy,
  },
  {
    icon: <Compass className="w-xl h-xl" />,
    title: 'Jornadas de Formação',
    subtitle: 'Caminhos de Santidade',
    description: 'Siga trilhas estruturadas de aprendizado. Do básico ao avançado, cada passo é uma nova descoberta na sua caminhada de fé.',
    image: onboardingCommunity,
  },
  {
    icon: <Users className="w-xl h-xl" />,
    title: 'Aula Magna e Comunidade',
    subtitle: 'Crescendo em Fraternidade',
    description: 'Partilhe reflexões, veja o que outros fiéis estão meditando e sinta-se parte de uma comunidade viva e orante.',
    image: onboardingCommunity,
  },
  {
    icon: <Heart className="w-xl h-xl" />,
    title: 'Como Usar?',
    subtitle: 'Simples e Profundo',
    description: 'Navegue pelo menu inferior para alternar entre as áreas. Marque leituras como concluídas para ganhar XP e acompanhar sua evolução.',
    image: onboardingPrayer,
  },
  {
    icon: <Compass className="w-xl h-xl" />,
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
      { label: 'Estou começando a buscar Deus', value: 'beginning', icon: <Sun className="w-md h-md" /> },
      { label: 'Tenho fé, mas quero aprofundar', value: 'deepening', icon: <BookOpen className="w-md h-md" /> },
      { label: 'Passo por um momento difícil', value: 'struggling', icon: <Heart className="w-md h-md" /> },
      { label: 'Quero servir melhor a Igreja', value: 'serving', icon: <Church className="w-md h-md" /> },
    ],
  },
  {
    id: 'prayer',
    question: 'Qual é sua relação com a oração?',
    options: [
      { label: 'Quase não rezo', value: 'rarely', icon: <Hand className="w-md h-md" /> },
      { label: 'Rezo às vezes, mas sem constância', value: 'sometimes', icon: <Sun className="w-md h-md" /> },
      { label: 'Tenho vida de oração regular', value: 'regular', icon: <Sparkles className="w-md h-md" /> },
      { label: 'Busco oração contemplativa', value: 'contemplative', icon: <Heart className="w-md h-md" /> },
    ],
  },
  {
    id: 'knowledge',
    question: 'Quanto você conhece da doutrina católica?',
    options: [
      { label: 'Muito pouco, o básico', value: 'basic', icon: <BookOpen className="w-md h-md" /> },
      { label: 'Conheço razoavelmente', value: 'moderate', icon: <BookOpen className="w-md h-md" /> },
      { label: 'Estudo com frequência', value: 'advanced', icon: <Sparkles className="w-md h-md" /> },
      { label: 'Tenho formação teológica', value: 'theological', icon: <Church className="w-md h-md" /> },
    ],
  },
  {
    id: 'sacraments',
    question: 'Como é sua vivência sacramental?',
    options: [
      { label: 'Não frequento os sacramentos', value: 'none', icon: <Church className="w-md h-md" /> },
      { label: 'Vou à Missa aos domingos', value: 'sunday', icon: <Church className="w-md h-md" /> },
      { label: 'Missa frequente e confissão regular', value: 'frequent', icon: <Sparkles className="w-md h-md" /> },
      { label: 'Vida sacramental intensa', value: 'intense', icon: <Heart className="w-md h-md" /> },
    ],
  },
  {
    id: 'goal',
    question: 'O que você mais deseja nesta jornada?',
    options: [
      { label: 'Encontrar paz interior', value: 'peace', icon: <Heart className="w-md h-md" /> },
      { label: 'Conhecer melhor a fé', value: 'knowledge', icon: <BookOpen className="w-md h-md" /> },
      { label: 'Criar uma rotina espiritual', value: 'routine', icon: <Sun className="w-md h-md" /> },
      { label: 'Transformação profunda de vida', value: 'transformation', icon: <Sparkles className="w-md h-md" /> },
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

    // Map moment to spiritual profile for dashboard personalization
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
      <div ref={ref} className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg lg:max-w-3xl space-y-lg lg:space-y-2xl"
        >
          <div className="text-center space-y-sm">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-3xl h-3xl mx-auto rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Compass className="w-xl h-xl text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Sua Jornada Recomendada</h1>
            <p className="text-muted-foreground text-sm">Com base nas suas respostas, preparamos o caminho ideal para você.</p>
          </div>

          <div className="bg-card border border-primary/20 rounded-premium p-lg space-y-sm text-center">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground text-sm">Uma jornada guiada pensada especialmente para o seu momento espiritual.</p>
          </div>

          <Button
            onClick={handleGoToJourney}
            className="w-full flex items-center justify-center gap-xs px-lg py-md bg-foreground text-background rounded-full font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Começar Minha Jornada <ChevronRight className="w-md h-md" />
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
      <div ref={ref} className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-md">
        <div className="w-full max-w-lg lg:max-w-4xl space-y-lg lg:space-y-xl text-center">
          <div className="flex justify-center mb-lg">
            <Icons.Logo className="w-3xl h-3xl" variant="blue" />
          </div>
          
          <div className="space-y-xs mb-xl">
            <div className="w-full h-2xs bg-muted rounded-premium overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${diagProgress}%` }}
              />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pergunta {diagStep + 1} de {QUESTIONS.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-xl"
            >
              <h2 className="text-2xl lg:text-4xl font-serif font-bold text-foreground leading-tight px-md">{question.question}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {question.options.map((opt) => (
                  <Button
                    key={opt.value}
                    onClick={() => handleDiagAnswer(opt.value)}
                    className="flex items-center gap-md p-md rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="p-sm rounded-premium bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
    <div ref={ref} className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-md">
      <div className="w-full max-w-lg lg:max-w-5xl space-y-lg lg:space-y-xl">
        <div className="flex justify-center">
          <Icons.Logo className="w-3xl h-3xl" variant="blue" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-full overflow-hidden lg:flex lg:items-center lg:min-h-[500px]"
          >
            <img src={slide.image} alt={slide.title} className="w-full h-4xl md:h-4xl lg:h-full lg:w-2xs/2 object-cover" />
            <div className="p-lg md:p-xl lg:p-3xl text-center lg:text-left lg:w-2xs/2 space-y-md lg:space-y-xl">
              <div className="flex justify-center lg:justify-start text-primary mb-xs lg:mb-md">{slide.icon}</div>
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-serif font-bold text-foreground leading-tight">{slide.title}</h1>
              <p className="text-xs lg:text-xs font-black uppercase tracking-widest text-primary">{slide.subtitle}</p>
              <p className="text-muted-foreground leading-relaxed text-sm lg:text-lg lg:max-w-md">{slide.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-xs">
          {SLIDES.map((_, i) => (
            <Button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-xs h-xs rounded-full transition-all ${
                i === currentSlide ? 'bg-primary w-lg' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
          <div className="w-xs h-xs rounded-premium bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between">
          {currentSlide > 0 ? (
            <Button onClick={handleSlidePrev} className="flex items-center gap-2xs text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-md h-md" /> Voltar
            </Button>
          ) : (
            <Button onClick={handleSkipSlides} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pular
            </Button>
          )}

          <Button
            onClick={handleSlideNext}
            className="flex items-center gap-xs px-lg py-sm bg-foreground text-background rounded-full font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {isLastSlide ? 'Diagnóstico' : 'Próximo'}
            <ChevronRight className="w-md h-md" />
          </Button>
        </div>
      </div>
    </div>
  );
});

OnboardingPage.displayName = 'OnboardingPage';

export default OnboardingPage;