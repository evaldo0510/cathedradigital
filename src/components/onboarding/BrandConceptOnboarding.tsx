import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/constants';
import { Label } from '@/components/ui/label';

interface BrandOnboardingData {
  brandName: string;
  brandNiche: string;
  targetAudience: string;
  brandValues: string;
  brandVoice: string;
  mainObjective: string;
}

interface StepProps {
  data: BrandOnboardingData;
  updateData: (fields: Partial<BrandOnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const steps = [
  { 
    id: 'brandName', 
    title: 'Qual o nome da sua marca?', 
    placeholder: 'Ex: Cathedra Digital', 
    label: 'Nome da Marca',
    validation: (val: string) => val.length < 3 ? 'O nome deve ter pelo menos 3 caracteres.' : null
  },
  { 
    id: 'brandNiche', 
    title: 'Em qual nicho ela atua?', 
    placeholder: 'Ex: Educação Católica, Tecnologia', 
    label: 'Nicho de Atuação',
    validation: (val: string) => val.length < 4 ? 'Descreva o nicho com mais detalhes.' : null
  },
  { 
    id: 'targetAudience', 
    title: 'Quem é seu público-alvo?', 
    placeholder: 'Ex: Fiéis em busca de formação', 
    label: 'Público-Alvo',
    validation: (val: string) => val.length < 5 ? 'Especifique melhor quem é seu público.' : null
  },
  { 
    id: 'brandValues', 
    title: 'Quais os valores fundamentais?', 
    placeholder: 'Ex: Tradição, Verdade, Beleza', 
    label: 'Valores',
    validation: (val: string) => val.split(',').length < 2 ? 'Insira pelo menos 2 valores separados por vírgula.' : null
  },
  { 
    id: 'brandVoice', 
    title: 'Qual o tom de voz da marca?', 
    placeholder: 'Ex: Solene, Acolhedor, Profundo', 
    label: 'Tom de Voz',
    validation: (val: string) => val.length < 4 ? 'O tom de voz precisa ser mais descritivo.' : null
  },
  { 
    id: 'mainObjective', 
    title: 'Qual seu objetivo principal?', 
    placeholder: 'Ex: Evangelizar através do conhecimento', 
    label: 'Objetivo Principal',
    validation: (val: string) => val.length < 10 ? 'O objetivo deve ser uma frase mais completa (mín. 10 caracteres).' : null
  },
];

export const BrandConceptOnboarding = ({ onComplete }: { onComplete: (data: BrandOnboardingData) => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<BrandOnboardingData>({
    brandName: '',
    brandNiche: '',
    targetAudience: '',
    brandValues: '',
    brandVoice: '',
    mainObjective: '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const validateField = (id: string, value: string) => {
    const step = steps.find(s => s.id === id);
    if (step?.validation) {
      const error = step.validation(value);
      setErrors(prev => ({ ...prev, [id]: error }));
      return !error;
    }
    return true;
  };

  const updateData = (fields: Partial<BrandOnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
    // Real-time validation
    Object.keys(fields).forEach(key => {
      validateField(key, (fields as any)[key]);
    });
  };

  const handleNext = () => {
    const currentId = steps[currentStep].id;
    const isValid = validateField(currentId, (data as any)[currentId]);
    
    if (!isValid) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPreviewMode(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepInfo = steps[currentStep];

  if (isPreviewMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-spacing-3xl p-spacing-xl bg-card border border-border rounded-premium-xl space-y-spacing-xl"
      >
        <div className="text-center space-y-spacing-sm">
          <Icons.Sparkles className="w-spacing-xl h-spacing-xl text-primary mx-auto" />
          <h2 className="text-premium-3xl font-serif font-bold text-foreground">Conceito-Mãe Gerado</h2>
          <p className="text-muted-foreground">Aqui está a prévia da identidade da sua marca baseada nos seus valores.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
          <div className="space-y-spacing-xs">
            <span className="text-[10px] uppercase tracking-widest text-primary font-black">Marca</span>
            <p className="text-premium-lg font-bold text-foreground">{data.brandName}</p>
          </div>
          <div className="space-y-spacing-xs">
            <span className="text-[10px] uppercase tracking-widest text-primary font-black">Missão</span>
            <p className="text-premium-sm text-foreground">{data.mainObjective}</p>
          </div>
          <div className="space-y-spacing-xs md:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-primary font-black">Arquétipo & Tom</span>
            <p className="text-premium-sm text-foreground">
              Uma marca com voz <span className="italic">{data.brandVoice}</span>, focada em <span className="italic">{data.brandNiche}</span> 
              para impactar <span className="italic">{data.targetAudience}</span> através de <span className="italic">{data.brandValues}</span>.
            </p>
          </div>
        </div>

        <div className="pt-spacing-xl flex gap-spacing-md">
          <Button 
            variant="outline" 
            onClick={() => setIsPreviewMode(false)}
            className="flex-1 rounded-premium-full"
          >
            Ajustar Dados
          </Button>
          <Button 
            onClick={() => onComplete(data)}
            className="flex-1 rounded-premium-full bg-primary text-primary-foreground font-bold"
          >
            Confirmar e Continuar
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-spacing-lg space-y-spacing-2xl">
      <div className="space-y-spacing-xs">
        <div className="w-full h-spacing-3xs bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
          Passo {currentStep + 1} de {steps.length}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepInfo.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-spacing-xl"
        >
          <div className="text-center space-y-spacing-sm">
            <h2 className="text-premium-2xl lg:text-premium-4xl font-serif font-bold text-foreground leading-tight">
              {stepInfo.title}
            </h2>
          </div>

          <div className="space-y-spacing-md">
            <div className="space-y-spacing-xs">
              <Label htmlFor={stepInfo.id} className="text-premium-xs uppercase tracking-widest font-black text-muted-foreground">
                {stepInfo.label}
              </Label>
              <Input
                id={stepInfo.id}
                value={(data as any)[stepInfo.id]}
                onChange={(e) => updateData({ [stepInfo.id]: e.target.value })}
                placeholder={stepInfo.placeholder}
                className={`h-spacing-2xl text-premium-lg bg-card border-border focus:ring-primary/20 rounded-premium transition-all ${
                  errors[stepInfo.id] ? 'border-destructive/50 focus:ring-destructive/20' : ''
                }`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
              />
              {errors[stepInfo.id] && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-destructive uppercase tracking-widest mt-spacing-xs"
                >
                  {errors[stepInfo.id]}
                </motion.p>
              )}
            </div>

            <div className="flex gap-spacing-md pt-spacing-lg">
              {currentStep > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="flex-1 h-spacing-xl rounded-premium-full text-muted-foreground"
                >
                  <Icons.ChevronLeft className="w-spacing-md h-spacing-md mr-spacing-xs" /> Voltar
                </Button>
              )}
              <Button
                disabled={!(data as any)[stepInfo.id]}
                onClick={handleNext}
                className="flex-1 h-spacing-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-premium-full font-black uppercase text-premium-xs tracking-widest transition-all"
              >
                {currentStep === steps.length - 1 ? 'Gerar Conceito' : 'Próximo'}
                <Icons.ChevronRight className="w-spacing-md h-spacing-md ml-spacing-xs" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
