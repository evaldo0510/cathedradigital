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
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* Emotional welcome */}
      <motion.div 
        className="text-center space-y-6 pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
          <Feather className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Lectio Divina</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Leitura Orante</h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
          Que bom ter você aqui. Reserve este momento só para Deus e para você.<br />
          <span className="text-primary/80">Respire fundo. Silencie o coração. Comece.</span>
        </p>
      </motion.div>

      {/* Daily suggestion card */}
      <motion.button
        onClick={() => onPassageChange(dailyPassage.ref)}
        className={`w-full max-w-lg mx-auto flex items-center gap-6 p-6 rounded-[2rem] border transition-all shadow-lg group ${
          selectedPassage === dailyPassage.ref
            ? 'bg-primary border-primary text-primary-foreground shadow-primary/20'
            : 'bg-card border-border hover:border-primary/30 hover:shadow-xl'
        }`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          selectedPassage === dailyPassage.ref ? 'bg-white/20' : 'bg-primary/10'
        }`}>
          <Heart className={`w-7 h-7 ${selectedPassage === dailyPassage.ref ? 'text-white' : 'text-primary'}`} />
        </div>
        <div className="text-left flex-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
            selectedPassage === dailyPassage.ref ? 'text-white/70' : 'text-primary/60'
          }`}>Lectio do Dia</p>
          <p className={`font-serif font-bold text-lg ${
            selectedPassage === dailyPassage.ref ? 'text-white' : 'text-foreground'
          }`}>{dailyPassage.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className={`w-3 h-3 ${selectedPassage === dailyPassage.ref ? 'text-white/60' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${selectedPassage === dailyPassage.ref ? 'text-white/60' : 'text-muted-foreground'}`}>~15 min · {dailyPassage.ref}</span>
          </div>
        </div>
        <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${
          selectedPassage === dailyPassage.ref ? 'text-white/80' : 'text-muted-foreground'
        }`} />
      </motion.button>

      {/* Steps overview */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-5 gap-4 px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {STEPS.map((step, i) => (
          <div key={step.id} className="group p-5 rounded-3xl bg-card border border-border text-center space-y-3 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center transition-transform group-hover:scale-110 ${step.color}`}>
              <step.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{step.latin}</p>
              <p className="font-serif font-bold text-sm text-foreground">{step.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Select passage */}
      <motion.div 
        className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-2xl shadow-black/[0.02]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div className="text-center space-y-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Ou escolha outra passagem</h3>
            <p className="text-xs text-muted-foreground font-serif italic">Digite uma referência bíblica ou escolha uma sugestão.</p>
          </div>
          <div className="relative">
            <input
              value={selectedPassage}
              onChange={e => onPassageChange(e.target.value)}
              placeholder="Ex: Jo 1,1-18 ou Sl 23..."
              className="w-full px-6 py-4 rounded-2xl border border-border bg-muted/30 text-foreground text-base text-center font-serif focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_PASSAGES.map(p => (
              <button
                key={p.ref}
                onClick={() => onPassageChange(p.ref)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  selectedPassage === p.ref
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                }`}
              >
                {p.ref}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            disabled={!selectedPassage.trim()}
            onClick={onStart}
            className="px-10 py-5 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 active:scale-95"
          >
            Iniciar Lectio Divina
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LectioIntro;
