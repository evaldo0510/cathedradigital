import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, PenTool, Heart, RotateCcw, Calendar } from 'lucide-react';
import { STEPS } from './constants';
import ShareButton from '../ShareButton';

interface LectioConclusioProps {
  selectedPassage: string;
  notes: Record<string, string>;
  seconds: number;
  onRestart: () => void;
}

const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const LectioConclusio: React.FC<LectioConclusioProps> = ({ selectedPassage, notes, seconds, onRestart }) => {
  const notesWritten = STEPS.filter(s => notes[s.id]?.trim());

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16 animate-in fade-in duration-700">
      {/* Celebration */}
      <motion.div 
        className="text-center space-y-6 pt-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
          Amém.
        </h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-xl mx-auto leading-relaxed">
          Você completou a Lectio Divina de hoje. A Palavra de Deus agora habita mais profundamente em seu coração.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div 
        className="flex justify-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border">
          <Clock className="w-5 h-5 text-primary/60" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tempo</p>
            <p className="font-mono text-xl font-bold text-foreground">{formatTime(seconds)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border">
          <PenTool className="w-5 h-5 text-primary/60" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reflexões</p>
            <p className="font-mono text-xl font-bold text-foreground">{notesWritten.length}/{STEPS.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Reflections summary */}
      {notesWritten.length > 0 && (
        <motion.div 
          className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 space-y-8 shadow-2xl shadow-black/[0.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Suas Reflexões</h3>
          <div className="space-y-6">
            {notesWritten.map(step => (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.color}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-foreground/70">{step.latin}</span>
                </div>
                <p className="text-base font-serif text-foreground/80 leading-relaxed pl-10 italic">
                  "{notes[step.id]}"
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Encouragement */}
      <motion.div 
        className="text-center space-y-6 bg-primary/5 rounded-[2.5rem] p-10 border border-primary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Heart className="w-8 h-8 text-primary mx-auto" />
        <p className="text-lg font-serif text-foreground leading-relaxed max-w-lg mx-auto">
          "A fidelidade à oração diária transforma a alma silenciosamente."
        </p>
        <div className="flex items-center justify-center gap-2 text-primary">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-bold">Volte amanhã para uma nova Lectio</span>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <ShareButton
          title={`Lectio Divina — ${selectedPassage}`}
          text={`Completei a Lectio Divina sobre ${selectedPassage}. ${formatTime(seconds)} de oração.`}
        />
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Nova Lectio
        </button>
      </div>
    </div>
  );
};

export default LectioConclusio;
