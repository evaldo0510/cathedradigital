import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import SaintOfTheDayCard from './SaintOfTheDayCard';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { DAILY_VERSES, DAILY_REFLECTIONS } from '@/data/dailyRitual';
import { HomeCard } from './HomeCard';
import { Button } from '@/components/ui/button';

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

  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
  const reflection = DAILY_REFLECTIONS[dayOfYear % DAILY_REFLECTIONS.length];

  const audioText = `Versículo do dia: ${verse.text} — ${verse.ref}. Reflexão: ${reflection}`;


  return (
    <HomeCard
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden"
    >
      <div className="relative z-10 p-8 md:p-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-secondary/40" strokeWidth={1} />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-secondary/40">
                Contemplação Diária
              </span>
            </div>
            {progress > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 w-24 bg-border/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-secondary"
                  />
                </div>
                <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">{progress}%</span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>


        {/* Saint of the Day */}
        <SaintOfTheDayCard variant="compact" />

        {/* Divider */}
        <div className="h-px bg-border/20" />

        {/* Bible Verse */}
        <div className="space-y-4" role="article" aria-label="Versículo do Dia">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">Versículo do Dia</span>
          </div>
          <blockquote 
            className={`text-xl md:text-2xl font-serif italic leading-relaxed pl-6 border-l-[3px] transition-all duration-500 cursor-pointer ${progress >= 50 ? 'text-primary/40 border-secondary/10' : 'text-primary/90 border-secondary/20'}`}
            onClick={() => handleProgress(50)}
          >
            "{verse.text}"
            {progress >= 50 && <CheckCircle2 className="inline ml-3 w-5 h-5 text-secondary/40" strokeWidth={1.5} />}
          </blockquote>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-6">— {verse.ref}</p>

        </div>

        {/* Divider */}
        <div className="h-px bg-border/20" />

        {/* Reflection */}
        <div className="space-y-3" role="article" aria-label="Reflexão">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">✦ Reflexão</span>
          <p 
            className={`text-base leading-relaxed font-reader transition-all duration-500 cursor-pointer ${progress === 100 ? 'text-foreground/30' : 'text-foreground/70'}`}
            onClick={() => handleProgress(100)}
          >
            {reflection}
            {progress === 100 && <CheckCircle2 className="inline ml-3 w-4 h-4 text-secondary/40" strokeWidth={1.5} />}
          </p>

        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir Ritual"
            variant="outline"
            className="flex-1"
          />
          {progress > 0 && progress < 100 && (
            <Button 
              variant="default" 
              className="flex-1 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-[10px] h-12 group"
              onClick={() => {
                const el = document.querySelector(progress < 50 ? '[role="article"][aria-label="Versículo do Dia"]' : '[role="article"][aria-label="Reflexão"]');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              Continuar de onde parei
              <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>

      </div>
    </HomeCard>
  );
};

export default RitualDoDia;