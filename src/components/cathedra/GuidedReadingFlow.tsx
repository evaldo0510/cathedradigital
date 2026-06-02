import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { Button } from '@/components/ui/button';

const steps = [
  {
    id: 'bible',
    title: 'Sagrada Escritura',
    subtitle: 'O sopro de Deus na história',
    icon: 'Book',
    description: 'Comece com a luz da Palavra. Leia um capítulo dos Evangelhos para iluminar seu dia.',
    route: AppRoute.BIBLE,
    color: 'bg-primary/5',
    tag: 'Fundamento'
  },
  {
    id: 'catechism',
    title: 'Santo Catecismo',
    subtitle: 'A síntese da nossa fé',
    icon: 'Church',
    description: 'Aprofunde o entendimento. Explore os mistérios da fé através da doutrina segura.',
    route: AppRoute.CATECHISM,
    color: 'bg-secondary/5',
    tag: 'Doutrina'
  },
  {
    id: 'magisterium',
    title: 'Magistério Vivo',
    subtitle: 'A voz da Igreja hoje',
    icon: 'Feather',
    description: 'Escute a voz do Pastor. Mergulhe nos documentos que guiam o mosteiro digital.',
    route: AppRoute.MAGISTERIUM,
    color: 'bg-accent',
    tag: 'Tradição'
  }
];

export const GuidedReadingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate(steps[currentStep].route);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = (Icons as any)[step.icon] || Icons.Book;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className={`premium-card p-spacing-2xl md:p-spacing-3xl flex flex-col items-center text-center gap-spacing-2xl ${step.color} border-none shadow-premium-none`}
        >
          <div className="space-y-spacing-md">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/60">
              {step.tag}
            </span>
            <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-background/50 border border-border/5 flex items-center justify-center text-primary/40 mx-auto shadow-premium-hover transition-transform duration-1000 hover:scale-105">
              <Icon className="w-spacing-xl h-spacing-xl" strokeWidth={0.5} />
            </div>
          </div>

          <div className="space-y-spacing-lg max-w-spacing-xl">
            <h2 className="text-premium-4xl md:text-premium-5xl font-display font-medium tracking-tight text-primary">
              {step.title}
            </h2>
            <p className="text-premium-xl md:text-premium-2xl font-serif italic text-muted-foreground/60 leading-relaxed">
              "{step.subtitle}"
            </p>
            <p className="text-premium-base text-muted-foreground/40 leading-relaxed max-w-spacing-md mx-auto">
              {step.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-spacing-lg mt-spacing-md">
            {currentStep > 0 && (
              <Button 
                variant="ghost" 
                onClick={prevStep}
                className="rounded-premium-full px-spacing-xl h-spacing-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-all"
              >
                Voltar
              </Button>
            )}
            
            <Button 
              onClick={nextStep}
              className="btn-premium-primary px-spacing-2xl h-spacing-3xl rounded-premium-full group shadow-premium"
            >
              {currentStep === steps.length - 1 ? 'Iniciar Leitura' : 'Próximo Passo'}
              <Icons.ArrowRight className="w-spacing-md h-spacing-md ml-spacing-sm group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Progress indicators */}
          <div className="flex gap-spacing-md mt-spacing-xl">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`w-spacing-2xs h-spacing-2xs rounded-premium-full transition-all duration-1000 ${
                  idx === currentStep ? 'bg-primary w-spacing-xl' : 'bg-primary/10'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};