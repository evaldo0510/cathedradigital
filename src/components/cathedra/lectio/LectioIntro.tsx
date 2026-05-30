import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Feather, Heart, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { STEPS, SUGGESTED_PASSAGES, getDailyPassage, Step } from './constants';

interface LectioIntroProps {
  selectedPassage: string;
  onPassageChange: (passage: string) => void;
  onStart: () => void;
}

const LectioIntro: React.FC<LectioIntroProps> = ({ selectedPassage, onPassageChange, onStart }) => {
  const dailyPassage = getDailyPassage();

  return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-2xl pb-spacing-2xl">
      {/* Emotional welcome */}
      <motion.div 
        className="text-center space-y-spacing-lg pt-spacing-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
          <Feather className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Lectio Divina</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Leitura Orante</h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-spacing-2xl mx-auto leading-relaxed">
          Que bom ter você aqui. Reserve este momento só para Deus e para você.<br />
          <span className="text-primary/80">Respire fundo. Silencie o coração. Comece.</span>
        </p>
      </motion.div>

      {/* Daily suggestion card */}
      <motion.button
        onClick={() => onPassageChange(dailyPassage.ref)}
        className={`w-full max-w-spacing-lg mx-auto flex items-center gap-spacing-lg p-spacing-lg rounded-[2rem] border transition-all shadow-premium group ${
          selectedPassage === dailyPassage.ref
            ? 'bg-primary border-primary text-primary-foreground shadow-primary/20'
            : 'bg-card border-border hover:border-primary/30 hover:shadow-premium-hover'
        }`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className={`w-spacing-2xl h-spacing-2xl rounded-full flex items-center justify-center shrink-0 ${
          selectedPassage === dailyPassage.ref ? 'bg-white/20' : 'bg-primary/10'
        }`}>
          <Heart className={`w-spacing-lg h-spacing-lg ${selectedPassage === dailyPassage.ref ? 'text-white' : 'text-primary'}`} />
        </div>
        <div className="text-left flex-1">
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${
            selectedPassage === dailyPassage.ref ? 'text-white/70' : 'text-primary/60'
          }`}>Lectio do Dia</p>
          <p className={`font-serif font-bold text-lg ${
            selectedPassage === dailyPassage.ref ? 'text-white' : 'text-foreground'
          }`}>{dailyPassage.title}</p>
          <div className="flex items-center gap-spacing-xs mt-spacing-2xs">
            <Clock className={`w-spacing-sm h-spacing-sm ${selectedPassage === dailyPassage.ref ? 'text-white/60' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${selectedPassage === dailyPassage.ref ? 'text-white/60' : 'text-muted-foreground'}`}>~15 min · {dailyPassage.ref}</span>
          </div>
        </div>
        <ArrowRight className={`w-spacing-md h-spacing-md group-hover:translate-x-1 transition-transform ${
          selectedPassage === dailyPassage.ref ? 'text-white/80' : 'text-muted-foreground'
        }`} />
      </motion.button>

      {/* Steps overview */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-5 gap-spacing-md px-spacing-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {STEPS.map((step, i) => (
          <div key={step.id} className="group p-spacing-md rounded-premium bg-card border border-border text-center space-y-spacing-sm hover:border-primary/30 hover:shadow-premium-hover hover:-translate-y-1 transition-all">
            <div className={`w-spacing-2xl h-spacing-2xl rounded-full mx-auto flex items-center justify-center transition-transform group-hover:scale-110 ${step.color}`}>
              <step.icon className="w-spacing-lg h-spacing-lg" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary/60">{step.latin}</p>
              <p className="font-serif font-bold text-sm text-foreground">{step.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Select passage */}
      <motion.div 
        className="bg-card border border-border rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl space-y-spacing-xl shadow-premium-hover shadow-black/[0.02]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <div className="space-y-spacing-lg max-w-spacing-md mx-auto">
          <div className="text-center space-y-spacing-xs">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Ou escolha outra passagem</h3>
            <p className="text-xs text-muted-foreground font-serif italic">Digite uma referência bíblica ou escolha uma sugestão.</p>
          </div>
          <div className="relative">
            <input
              value={selectedPassage}
              onChange={e => onPassageChange(e.target.value)}
              placeholder="Ex: Jo 1,1-18 ou Sl 23..."
              className="w-full px-spacing-lg py-spacing-md rounded-full border border-border bg-muted/30 text-foreground text-base text-center font-serif focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-md"
            />
          </div>

          <div className="flex flex-wrap gap-spacing-xs justify-center">
            {SUGGESTED_PASSAGES.map(p => (
              <Button
                key={p.ref}
                onClick={() => onPassageChange(p.ref)}
                className={`px-spacing-md py-spacing-xs rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                  selectedPassage === p.ref
                    ? 'bg-primary border-primary text-white shadow-premium'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                }`}
              >
                {p.ref}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            disabled={!selectedPassage.trim()}
            onClick={onStart}
            className="px-spacing-xl py-spacing-md bg-foreground text-background rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-premium-hover hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 active:scale-95"
          >
            Iniciar Lectio Divina
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LectioIntro;
