import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, Users, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { AppRoute } from '@/types';
import { Logo } from '@/constants';

const SLIDES = [
  {
    icon: <BookOpen className="w-12 h-12" />,
    title: 'Bem-vindo à Cathedra',
    subtitle: 'Sua biblioteca católica digital',
    description: 'Acesse a Bíblia Sagrada, o Catecismo, documentos do Magistério, vidas dos Santos e muito mais — tudo num único lugar, organizado para seu crescimento na fé.',
    color: 'from-primary/20 to-primary/5',
  },
  {
    icon: <Heart className="w-12 h-12" />,
    title: 'Vida de Oração',
    subtitle: 'Rosário, Liturgia das Horas e muito mais',
    description: 'Reze o Santo Rosário, a Via-Sacra, a Lectio Divina e acompanhe o Calendário Litúrgico. A Cathedra é sua companheira de oração diária.',
    color: 'from-rose-500/20 to-rose-500/5',
  },
  {
    icon: <Zap className="w-12 h-12" />,
    title: 'Estudo Inteligente',
    subtitle: 'IA a serviço da Tradição',
    description: 'Use o Colloquium, nossa IA treinada no Magistério, para aprofundar seus estudos teológicos. Faça perguntas e receba respostas fundamentadas na sã doutrina.',
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: <Users className="w-12 h-12" />,
    title: 'Comunidade de Fé',
    subtitle: 'Cresça junto com outros fiéis',
    description: 'Participe da comunidade, compartilhe reflexões, acompanhe seu progresso com streaks e conquistas, e caminhe na fé com irmãos do mundo inteiro.',
    color: 'from-blue-500/20 to-blue-500/5',
  },
];

const OnboardingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const isLast = currentSlide === SLIDES.length - 1;

  const handleFinish = () => {
    localStorage.setItem('cathedra_onboarding_done', 'true');
    navigate(AppRoute.DASHBOARD, { replace: true });
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const handleSkip = () => {
    handleFinish();
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo className="w-12 h-12 text-primary" />
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className={`bg-gradient-to-br ${slide.color} border border-border rounded-3xl p-8 md:p-10 text-center space-y-5`}
          >
            <div className="flex justify-center text-primary">
              {slide.icon}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{slide.title}</h1>
              <p className="text-sm font-black uppercase tracking-widest text-primary">{slide.subtitle}</p>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          {currentSlide > 0 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {isLast ? 'Começar' : 'Próximo'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
