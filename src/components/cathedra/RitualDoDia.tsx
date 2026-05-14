import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import SaintOfTheDayCard from './SaintOfTheDayCard';
import { BookOpen, Sparkles } from 'lucide-react';
import { DAILY_VERSES, DAILY_REFLECTIONS } from '@/data/dailyRitual';

const RitualDoDia: React.FC = () => {
  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
  const reflection = DAILY_REFLECTIONS[dayOfYear % DAILY_REFLECTIONS.length];

  const audioText = `Versículo do dia: ${verse.text} — ${verse.ref}. Reflexão: ${reflection}`;

  return (
    <div
      className="premium-card p-0 subtle-glow transition-all duration-700 shadow-xl"
    >

      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-8 md:p-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">
              Ritual do Dia
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {/* Saint of the Day */}
        <SaintOfTheDayCard variant="compact" />

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bible Verse */}
        <div className="space-y-4" role="article" aria-label="Versículo do Dia">
          <div className="flex items-center gap-3">
            <div className="premium-icon-box">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Scriptura Sacra</span>
          </div>
          <blockquote className="text-xl md:text-3xl font-serif italic text-foreground leading-[1.3] pl-6 border-l-4 border-secondary/30">
            "{verse.text}"
          </blockquote>
          <p className="text-xs font-black text-secondary uppercase tracking-[0.2em] pl-6 opacity-80">— {verse.ref}</p>
        </div>


        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Reflection */}
        <div className="space-y-4" role="article" aria-label="Reflexão">
          <div className="flex items-center gap-3">
            <div className="premium-icon-box">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Meditatio</span>
          </div>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-serif italic pl-1">
            {reflection}
          </p>
        </div>


        {/* Audio Button */}
        <div className="pt-2">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir o Ritual do Dia"
            variant="default"
            className="w-full rounded-2xl h-14 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/30 hover:translate-y-[-1px] transition-all focus-visible:ring-2 focus-visible:ring-primary/20 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default RitualDoDia;