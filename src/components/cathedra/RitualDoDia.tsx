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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-3xl border border-secondary/20 bg-card shadow-sm"
    >
      {/* Removed decorative glows for a cleaner, premium look */}

      <div className="relative z-10 p-5 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">
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
        <div className="h-px bg-border/40" />

        {/* Bible Verse */}
        <div className="space-y-2" role="article" aria-label="Versículo do Dia">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Versículo do Dia</span>
          </div>
          <blockquote className="text-base md:text-lg font-serif italic text-foreground leading-relaxed pl-4 border-l-2 border-secondary/30">
            "{verse.text}"
          </blockquote>
          <p className="text-[10px] font-black text-secondary/70 tracking-wide pl-4">— {verse.ref}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Reflection */}
        <div className="space-y-2" role="article" aria-label="Reflexão">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">✦ Reflexão</span>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {reflection}
          </p>
        </div>

        {/* Audio Button */}
        <div className="pt-2">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir o Ritual do Dia"
            variant="default"
            className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all focus-visible:ring-4 focus-visible:ring-primary outline-none"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default RitualDoDia;