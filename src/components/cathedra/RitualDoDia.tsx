import React, { useMemo } from 'react';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import SaintOfTheDayCard from './SaintOfTheDayCard';
import { BookOpen, Sparkles } from 'lucide-react';
import { DAILY_VERSES, DAILY_REFLECTIONS } from '@/data/dailyRitual';
import { Card } from '@/components/ui/card';

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
    <Card
      padding="xl"
      className="relative overflow-hidden space-y-24 bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sparkles className="w-5 h-5 text-secondary/40" strokeWidth={1} />
          <span className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-secondary/20">
            Ritual do Dia
          </span>
        </div>
        <span className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground/30 font-serif italic">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Saint of the Day */}
      <div className="group">
        <SaintOfTheDayCard variant="compact" />
      </div>

      {/* Bible Verse */}
      <div className="space-y-12" role="article" aria-label="Versículo do Dia">
        <div className="flex items-center gap-4">
          <BookOpen className="w-4 h-4 text-primary/20" strokeWidth={1} />
          <span className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/20">Verbum Domini</span>
        </div>
        <blockquote className="text-4xl md:text-5xl font-serif italic text-primary/70 leading-[1.2] pl-12 border-l border-secondary/10">
          "{verse.text}"
        </blockquote>
        <p className="text-premium-tiny font-bold text-secondary uppercase tracking-[0.3em] pl-12 opacity-40">— {verse.ref}</p>
      </div>

      {/* Reflection */}
      <div className="space-y-10" role="article" aria-label="Reflexão">
        <div className="flex items-center gap-4">
           <Icons.PenLine className="w-3.5 h-3.5 text-muted-foreground/20" strokeWidth={1} />
           <span className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-muted-foreground/20">Meditatio</span>
        </div>
        <p className="text-2xl text-primary/50 leading-relaxed font-serif italic pl-12 border-l border-border/10">
          {reflection}
        </p>
      </div>

      <div className="pt-8 border-t border-border/10">
        <AudioContentPlayer
          text={audioText}
          title="Ouvir o Ritual do Dia"
          variant="outline"
          className="w-full justify-center h-16 rounded-full text-premium-tiny font-bold uppercase tracking-[0.3em]"
        />
      </div>
    </Card>
  );
};

export default RitualDoDia;