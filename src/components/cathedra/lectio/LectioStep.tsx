import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ChevronRight, ChevronLeft, Timer, 
  Feather, PenTool, Book, CheckCircle2 
} from 'lucide-react';
import { STEPS, Step } from './constants';
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 px-2">
        <button onClick={onBack} className="p-3 rounded-2xl bg-card border border-border hover:bg-primary/5 transition-all active:scale-95 shadow-sm self-start md:self-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
            <Feather className="w-3 h-3" />
            Lectio Divina
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{selectedPassage}</h2>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton
            title={`Lectio Divina — ${selectedPassage}`}
            text={`Meditando sobre ${selectedPassage} na Lectio Divina.`}
          />
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-sm">
            <Timer className="w-4 h-4 text-primary/60" />
            <span className="font-mono text-lg font-bold text-foreground tabular-nums">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="px-2 space-y-6">
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                i <= stepIndex ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex overflow-x-auto pb-2 gap-4 scrollbar-hide md:justify-between no-scrollbar">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap border ${
                step.id === currentStep 
                  ? 'bg-primary border-primary text-white shadow-lg' 
                  : i <= stepIndex ? 'bg-card border-border text-foreground/80' : 'bg-transparent border-transparent text-muted-foreground/40'
              }`}
            >
              <step.icon className={`w-4 h-4 ${step.id === currentStep ? 'text-white' : i <= stepIndex ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{step.latin}</span>
            </button>
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
          className="bg-card border border-border rounded-[3rem] p-8 md:p-16 space-y-10 shadow-2xl shadow-black/[0.02] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
            <activeStep.icon className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
          </div>

          <div className="relative text-center space-y-4">
            <motion.div 
              className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl border-4 border-background ${activeStep.color}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <activeStep.icon className="w-10 h-10" />
            </motion.div>
            <div className="space-y-1">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">{activeStep.title}</h2>
              <p className="text-base font-serif italic text-primary opacity-80">{activeStep.latin} — {activeStep.duration}</p>
            </div>
          </div>
          
          <div className="relative space-y-8 max-w-2xl mx-auto">
            <div className="bg-muted/50 rounded-[2.5rem] p-8 md:p-12 border border-border/50 space-y-6">
              {isBibleLoading ? (
                <div className="space-y-4 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-primary/10 rounded animate-pulse" style={{ width: `${75 + Math.random() * 25}%` }} />
                  ))}
                </div>
              ) : bibleError ? (
                <p className="text-muted-foreground italic text-center text-lg font-serif">{bibleError}</p>
              ) : bibleText.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 justify-center opacity-40">
                    <Book className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedPassage}</p>
                  </div>
                  <div className="font-serif leading-relaxed text-xl text-foreground/90 text-center">
                    {bibleText.map((v, i) => (
                      <span key={i} className="inline-block mb-1">
                        <sup className="text-primary font-bold mr-1.5 text-xs select-none">{v.number}</sup>
                        {v.text}{' '}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-xl text-foreground/90 leading-relaxed font-serif italic">"{activeStep.instruction}"</p>
                </div>
              )}
            </div>
            
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Oração do Coração</h3>
                <p className="text-lg md:text-xl font-serif font-bold text-primary italic leading-relaxed">"{activeStep.prompt}"</p>
              </div>

              <div className="space-y-4 group">
                <div className="flex items-center gap-2 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-focus-within:text-primary">
                  <PenTool className="w-3 h-3" /> Sua Reflexão
                </div>
                <textarea
                  value={notes[activeStep.id] || ''}
                  onChange={e => onNotesChange({ ...notes, [activeStep.id]: e.target.value })}
                  rows={6}
                  placeholder="Deixe a alma falar... Escreva aqui suas reflexões, luzes e resoluções."
                  className="w-full px-8 py-8 rounded-[2rem] border border-border bg-background text-lg md:text-xl font-serif text-foreground resize-none focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-4 justify-center px-4">
        <button
          disabled={stepIndex <= 0}
          onClick={() => onStepChange(STEPS[stepIndex - 1].id)}
          className="flex-1 max-w-[200px] h-14 rounded-2xl bg-card border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Anterior
        </button>
        
        {stepIndex < STEPS.length - 1 ? (
          <button
            onClick={() => onStepChange(STEPS[stepIndex + 1].id)}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group shadow-xl"
          >
            Próximo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <button
            onClick={() => onStepChange('conclusio')}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20"
          >
            <CheckCircle2 className="w-4 h-4" /> Concluir
          </button>
        )}
      </div>
    </div>
  );
};

export default LectioStep;
