import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, Book, Heart } from 'lucide-react';
import { DAILY_RITUALS } from '@/data/dailyRitual';
import { HomeCard } from './HomeCard';
import { Button } from '@/components/ui/button';
import AudioContentPlayer from './AudioContentPlayer';

const RitualDoDia: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const savedProgress = localStorage.getItem(`cathedra_daily_progress_${today}`);
    if (savedProgress) {
      setProgress(parseInt(savedProgress));
    }
  }, [today]);

  const handleProgress = (val: number) => {
    const newVal = Math.max(progress, val);
    setProgress(newVal);
    localStorage.setItem(`cathedra_daily_progress_${today}`, newVal.toString());
  };

  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const ritual = DAILY_RITUALS[dayOfYear % DAILY_RITUALS.length];

  const audioText = `Versículo: ${ritual.verse.text} (${ritual.verse.ref}). Reflexão: ${ritual.reflection}. Catecismo: ${ritual.catechism.text}. Oração: ${ritual.prayer}`;

  return (
    <HomeCard
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden border-border/10 shadow-premium"
    >
      <div className="relative z-10 p-8 md:p-12 lg:p-16 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/10 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary/40" strokeWidth={1} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40">
                Ritual do Dia
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display text-primary tracking-tight">Caminho de Santidade</h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="text-xs font-serif italic text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {progress > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-1 w-20 bg-border/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary/40"
                  />
                </div>
                <span className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">{progress}% concluído</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-16">
          
          {/* 1. Bible Reading */}
          <section className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-primary/30" strokeWidth={1.5} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30">I. Palavra de Deus</span>
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-700 ${progress >= 25 ? 'opacity-40 grayscale' : 'opacity-100'}`}
              onClick={() => handleProgress(25)}
            >
              <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed text-primary/90">
                "{ritual.verse.text}"
              </blockquote>
              <p className="mt-4 text-xs font-bold text-primary/40 uppercase tracking-[0.2em]">
                — {ritual.verse.ref}
              </p>
            </div>
          </section>

          {/* 2. Reflection */}
          <section className="space-y-6 max-w-2xl ml-auto text-right">
            <div className="flex items-center gap-3 justify-end">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30">II. Reflexão</span>
              <Sparkles className="w-4 h-4 text-primary/30" strokeWidth={1.5} />
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-700 ${progress >= 50 ? 'opacity-40' : 'opacity-100'}`}
              onClick={() => handleProgress(50)}
            >
              <p className="text-lg md:text-xl leading-relaxed text-foreground/80 font-serif italic">
                {ritual.reflection}
              </p>
            </div>
          </section>

          {/* 3. Catechism */}
          <section className="space-y-6 max-w-2xl border-l border-border/10 pl-8">
            <div className="flex items-center gap-3">
              <Book className="w-4 h-4 text-primary/30" strokeWidth={1.5} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30">III. Catecismo</span>
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-700 ${progress >= 75 ? 'opacity-40' : 'opacity-100'}`}
              onClick={() => handleProgress(75)}
            >
              <p className="text-base leading-relaxed text-foreground/70 font-sans tracking-wide">
                {ritual.catechism.text}
              </p>
              <p className="mt-3 text-[10px] font-bold text-primary/40 uppercase tracking-widest">
                CIC §{ritual.catechism.number}
              </p>
            </div>
          </section>

          {/* 4. Prayer */}
          <section className="space-y-8 max-w-2xl mx-auto text-center py-10 bg-primary/[0.01] rounded-3xl border border-primary/[0.03]">
            <div className="flex flex-col items-center gap-4">
              <Heart className="w-5 h-5 text-primary/20" strokeWidth={1.5} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30">IV. Oração Breve</span>
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-700 px-8 ${progress >= 100 ? 'opacity-40' : 'opacity-100'}`}
              onClick={() => handleProgress(100)}
            >
              <p className="text-xl md:text-2xl leading-relaxed text-primary/80 font-serif italic">
                {ritual.prayer}
              </p>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-border/10">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir Ritual Completo"
            variant="ghost"
            className="text-primary/40 hover:text-primary transition-colors"
          />
          
          <div className="flex gap-4">
            {progress > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-all"
                onClick={() => {
                  setProgress(0);
                  localStorage.removeItem(`cathedra_daily_progress_${today}`);
                }}
              >
                Recomeçar
              </Button>
            )}
            {progress < 100 && (
              <Button 
                className="rounded-full bg-primary/90 hover:bg-primary text-white px-8 h-12 text-[10px] font-bold uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all"
                onClick={() => {
                  const sections = [25, 50, 75, 100];
                  const nextProgress = sections.find(s => s > progress) || 100;
                  handleProgress(nextProgress);
                }}
              >
                {progress === 0 ? 'Iniciar Ritual' : 'Próximo Passo'}
                <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            )}
            {progress === 100 && (
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] px-6 py-3 bg-primary/5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                Concluído por hoje
              </div>
            )}
          </div>
        </div>
      </div>
    </HomeCard>
  );
};

export default RitualDoDia;
