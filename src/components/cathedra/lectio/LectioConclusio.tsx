import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';

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
    <div className="w-full space-y-spacing-xl pb-spacing-3xl animate-in fade-in duration-700">
      {/* Celebration */}
      <motion.div 
        className="text-center space-y-spacing-lg pt-spacing-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="w-spacing-4xl h-spacing-4xl rounded-premium-full bg-primary/10 flex items-center justify-center mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <Icons.CheckCircle2 className="w-spacing-2xl h-spacing-2xl text-primary" />
        </motion.div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground tracking-tight">
          Amém.
        </h1>
        <p className="text-premium-lg text-muted-foreground font-serif italic leading-relaxed">
          Você completou a Lectio Divina de hoje. A Palavra de Deus agora habita mais profundamente em seu coração.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div 
        className="flex justify-center gap-spacing-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-spacing-sm px-spacing-lg py-spacing-md rounded-premium bg-card border border-border">
          <Icons.Clock className="w-spacing-md h-spacing-md text-primary/60" />
          <div>
            <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Tempo</p>
            <p className="font-mono text-premium-xl font-bold text-foreground">{formatTime(seconds)}</p>
          </div>
        </div>
        <div className="flex items-center gap-spacing-sm px-spacing-lg py-spacing-md rounded-premium bg-card border border-border">
          <Icons.PenTool className="w-spacing-md h-spacing-md text-primary/60" />
          <div>
            <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Reflexões</p>
            <p className="font-mono text-premium-xl font-bold text-foreground">{notesWritten.length}/{STEPS.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Reflections summary */}
      {notesWritten.length > 0 && (
        <motion.div 
          className="bg-card border border-border rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl space-y-spacing-xl shadow-premium-hover shadow-black/[0.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-center text-premium-xs font-black uppercase tracking-[0.2em] text-primary/60">Suas Reflexões</h3>
          <div className="space-y-spacing-lg">
            {notesWritten.map(step => (
              <div key={step.id} className="space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <div className={`w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center ${step.color}`}>
                    <step.icon className="w-spacing-md h-spacing-md" />
                  </div>
                  <span className="text-premium-xs font-black uppercase tracking-widest text-foreground/70">{step.latin}</span>
                </div>
                <p className="text-premium-base font-serif text-foreground/80 leading-relaxed pl-spacing-xl italic">
                  "{notes[step.id]}"
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Encouragement */}
      <motion.div 
        className="text-center space-y-spacing-lg bg-primary/5 rounded-[2.5rem] p-spacing-xl border border-primary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Icons.Heart className="w-spacing-xl h-spacing-xl text-primary mx-auto" />
        <p className="text-premium-lg font-serif text-foreground leading-relaxed w-full mx-auto">
          "A fidelidade à oração diária transforma a alma silenciosamente."
        </p>
        <div className="flex items-center justify-center gap-spacing-xs text-primary">
          <Icons.Calendar className="w-spacing-md h-spacing-md" />
          <span className="text-premium-sm font-bold">Volte amanhã para uma nova Lectio</span>
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


      <div className="flex gap-spacing-md justify-center">
        <ShareButton
          title={`Lectio Divina — ${selectedPassage}`}
          text={`Completei a Lectio Divina sobre ${selectedPassage}. ${formatTime(seconds)} de oração.`}
        />
        <Button
          onClick={onRestart}
          className="flex items-center gap-spacing-xs px-spacing-xl py-spacing-md rounded-premium-full bg-card border border-border text-premium-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-premium-md"
        >
          <Icons.RotateCcw className="w-spacing-md h-spacing-md" /> Nova Lectio
        </Button>
      </div>
    </div>
  );
};

export default LectioConclusio;
