import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ChevronRight, ChevronLeft, Timer, 
  Feather, PenTool, Book, CheckCircle2 
} from 'lucide-react';
import { STEPS, Step } from './constants';
import { Button } from '@/components/ui/button';
import ShareButton from '../ShareButton';

interface LectioStepProps {
  currentStep: Exclude<Step, 'intro' | 'conclusio'>;
  selectedPassage: string;
  notes: Record<string, string>;
  onNotesChange: (notes: Record<string, string>) => void;
  seconds: number;
  bibleText: { number: number; text: string }[];
  isBibleLoading: boolean;
  bibleError: string;
  onBack: () => void;
  onStepChange: (step: Step) => void;
}

const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const LectioStep: React.FC<LectioStepProps> = ({
  currentStep, selectedPassage, notes, onNotesChange,
  seconds, bibleText, isBibleLoading, bibleError,
  onBack, onStepChange
}) => {
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const activeStep = STEPS[stepIndex];

  if (!activeStep) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-xl pb-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-lg px-xs">
        <Button variant="outline" size="icon" onClick={onBack} className="rounded-full shadow-md self-start md:self-center">
          <ArrowLeft className="w-lg h-lg text-foreground" />
        </Button>
        <div className="flex-1 space-y-2xs">
          <div className="flex items-center gap-xs text-xs font-black uppercase tracking-[0.2em] text-primary/60">
            <Feather className="w-sm h-sm" />
            Lectio Divina
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{selectedPassage}</h2>
        </div>
        <div className="flex items-center gap-sm">
          <ShareButton
            title={`Lectio Divina — ${selectedPassage}`}
            text={`Meditando sobre ${selectedPassage} na Lectio Divina.`}
          />
          <div className="flex items-center gap-sm px-md py-sm rounded-premium bg-card border border-border shadow-md">
            <Timer className="w-md h-md text-primary/60" />
            <span className="font-mono text-lg font-bold text-foreground tabular-nums">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="px-xs space-y-lg">
        <div className="flex gap-xs">
          {STEPS.map((step, i) => (
            <Button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`flex-1 h-xs rounded-full transition-all duration-500 ${
                i <= stepIndex ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex overflow-x-auto pb-xs gap-md scrollbar-hide md:justify-between no-scrollbar">
          {STEPS.map((step, i) => (
            <Button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`flex items-center gap-xs px-md py-xs rounded-full transition-all whitespace-nowrap border ${
                step.id === currentStep 
                  ? 'bg-primary border-primary text-white shadow-premium' 
                  : i <= stepIndex ? 'bg-card border-border text-foreground/80' : 'bg-transparent border-transparent text-muted-foreground/40'
              }`}
            >
              <step.icon className={`w-md h-md ${step.id === currentStep ? 'text-white' : i <= stepIndex ? 'text-primary' : ''}`} />
              <span className="text-xs font-black uppercase tracking-widest">{step.latin}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Active step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-[3rem] p-xl md:p-3xl space-y-xl shadow-premium-hover shadow-black/[0.02] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2xl opacity-[0.02] pointer-events-none">
            <activeStep.icon className="w-4xl h-4xl -mr-3xl -mt-3xl rotate-12" />
          </div>

          <div className="relative text-center space-y-md">
            <motion.div 
              className={`w-3xl h-3xl rounded-[2rem] flex items-center justify-center mx-auto shadow-premium-hover border-4 border-background ${activeStep.color}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <activeStep.icon className="w-xl h-xl" />
            </motion.div>
            <div className="space-y-2xs">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">{activeStep.title}</h2>
              <p className="text-base font-serif italic text-primary opacity-80">{activeStep.latin} — {activeStep.duration}</p>
            </div>
          </div>
          
          <div className="relative space-y-xl max-w-2xl mx-auto">
            <div className="bg-muted/50 rounded-[2.5rem] p-xl md:p-2xl border border-border/50 space-y-lg">
              {isBibleLoading ? (
                <div className="space-y-md py-md">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-md bg-primary/10 rounded animate-pulse" style={{ width: `${75 + Math.random() * 25}%` }} />
                  ))}
                </div>
              ) : bibleError ? (
                <p className="text-muted-foreground italic text-center text-lg font-serif">{bibleError}</p>
              ) : bibleText.length > 0 ? (
                <div className="space-y-lg">
                  <div className="flex items-center gap-xs justify-center opacity-40">
                    <Book className="w-md h-md" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">{selectedPassage}</p>
                  </div>
                  <div className="font-serif leading-relaxed text-xl text-foreground/90 text-center">
                    {bibleText.map((v, i) => (
                      <span key={i} className="inline-block font-serif mb-2xs">
                        <sup className="text-primary font-bold mr-2xs text-xs select-none">{v.number}</sup>
                        {v.text}{' '}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-lg">
                  <p className="text-xl text-foreground/90 leading-relaxed font-serif italic">"{activeStep.instruction}"</p>
                </div>
              )}
            </div>
            
            <div className="space-y-xl">
              <div className="text-center space-y-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">Oração do Coração</h3>
                <p className="text-lg md:text-xl font-serif font-bold text-primary italic leading-relaxed">"{activeStep.prompt}"</p>
              </div>

              <div className="space-y-md group">
                <div className="flex items-center gap-xs justify-center text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-focus-within:text-primary">
                  <PenTool className="w-sm h-sm" /> Sua Reflexão
                </div>
                <textarea
                  value={notes[activeStep.id] || ''}
                  onChange={e => onNotesChange({ ...notes, [activeStep.id]: e.target.value })}
                  rows={6}
                  placeholder="Deixe a alma falar... Escreva aqui suas reflexões, luzes e resoluções."
                  className="w-full px-xl py-xl rounded-[2rem] border border-border bg-background text-lg md:text-xl font-serif text-foreground resize-none focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-md leading-relaxed"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-md justify-center px-md">
        <Button
          variant="outline"
          disabled={stepIndex <= 0}
          onClick={() => onStepChange(STEPS[stepIndex - 1].id)}
          className="flex-1 max-w-[200px] h-2xl rounded-full"
        >
          <ChevronLeft className="w-md h-md" /> Anterior
        </Button>
        
        {stepIndex < STEPS.length - 1 ? (
          <Button
            onClick={() => onStepChange(STEPS[stepIndex + 1].id)}
            className="flex-1 max-w-[200px] h-2xl rounded-full bg-foreground text-background hover:bg-primary"
          >
            Próximo <ChevronRight className="w-md h-md" />
          </Button>
        ) : (
          <Button
            onClick={() => onStepChange('conclusio')}
            className="flex-1 max-w-[200px] h-2xl rounded-full bg-primary text-primary-foreground shadow-premium-hover shadow-primary/20"
          >
            <CheckCircle2 className="w-md h-md" /> Concluir
          </Button>
        )}
      </div>
    </div>
  );
};

export default LectioStep;
