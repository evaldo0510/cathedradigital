import { Button } from '@/components/ui/button';
import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, PenTool, Heart, RotateCcw, Calendar } from 'lucide-react';
import { STEPS } from './constants';
import ShareButton from '../ShareButton';
import FlowConnector from '../FlowConnector';
import ProConversionBanner from '../ProConversionBanner';
import { routeUser } from '@/lib/smartRouter';
import { useAuth } from '@/hooks/useAuth';
import { saveUserPsychology } from '@/lib/psychologicalProfile';

interface LectioConclusioProps {
  selectedPassage: string;
  notes: Record<string, string>;
  seconds: number;
  onRestart: () => void;
}

const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const LectioConclusio: React.FC<LectioConclusioProps> = ({ selectedPassage, notes, seconds, onRestart }) => {
  const { user } = useAuth();
  const notesWritten = STEPS.filter(s => notes[s.id]?.trim());
  const allNotesText = Object.values(notes).filter(Boolean).join(' ');
  const recommendations = useMemo(() => routeUser(allNotesText), [allNotesText]);

  useEffect(() => {
    if (user?.id && allNotesText.length > 20) {
      saveUserPsychology(user.id, allNotesText, 'lectio');
    }
  }, [user?.id, allNotesText]);

  return (
    <div className="max-w-3xl mx-auto space-y-xl pb-3xl animate-in fade-in duration-700">
      {/* Celebration */}
      <motion.div 
        className="text-center space-y-lg pt-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="w-4xl h-4xl rounded-full bg-primary/10 flex items-center justify-center mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle2 className="w-2xl h-2xl text-primary" />
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
        className="flex justify-center gap-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-sm px-lg py-md rounded-premium bg-card border border-border">
          <Clock className="w-md h-md text-primary/60" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tempo</p>
            <p className="font-mono text-xl font-bold text-foreground">{formatTime(seconds)}</p>
          </div>
        </div>
        <div className="flex items-center gap-sm px-lg py-md rounded-premium bg-card border border-border">
          <PenTool className="w-md h-md text-primary/60" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reflexões</p>
            <p className="font-mono text-xl font-bold text-foreground">{notesWritten.length}/{STEPS.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Reflections summary */}
      {notesWritten.length > 0 && (
        <motion.div 
          className="bg-card border border-border rounded-[2.5rem] p-xl md:p-2xl space-y-xl shadow-premium-hover shadow-black/[0.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-center text-xs font-black uppercase tracking-[0.2em] text-primary/60">Suas Reflexões</h3>
          <div className="space-y-lg">
            {notesWritten.map(step => (
              <div key={step.id} className="space-y-xs">
                <div className="flex items-center gap-xs">
                  <div className={`w-xl h-xl rounded-full flex items-center justify-center ${step.color}`}>
                    <step.icon className="w-md h-md" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-foreground/70">{step.latin}</span>
                </div>
                <p className="text-base font-serif text-foreground/80 leading-relaxed pl-xl italic">
                  "{notes[step.id]}"
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Encouragement */}
      <motion.div 
        className="text-center space-y-lg bg-primary/5 rounded-[2.5rem] p-xl border border-primary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Heart className="w-xl h-xl text-primary mx-auto" />
        <p className="text-lg font-serif text-foreground leading-relaxed max-w-lg mx-auto">
          "A fidelidade à oração diária transforma a alma silenciosamente."
        </p>
        <div className="flex items-center justify-center gap-xs text-primary">
          <Calendar className="w-md h-md" />
          <span className="text-sm font-bold">Volte amanhã para uma nova Lectio</span>
        </div>
      </motion.div>

      {/* PRO Conversion Banner */}
      <ProConversionBanner context="lectio" />

      {/* Smart Flow Connector */}
      <FlowConnector
        recommendations={recommendations}
        title="Continue sua experiência"
        subtitle="Com base nas suas reflexões, sugerimos:"
      />


      <div className="flex gap-md justify-center">
        <ShareButton
          title={`Lectio Divina — ${selectedPassage}`}
          text={`Completei a Lectio Divina sobre ${selectedPassage}. ${formatTime(seconds)} de oração.`}
        />
        <Button
          onClick={onRestart}
          className="flex items-center gap-xs px-xl py-md rounded-full bg-card border border-border text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-md"
        >
          <RotateCcw className="w-md h-md" /> Nova Lectio
        </Button>
      </div>
    </div>
  );
};

export default LectioConclusio;
