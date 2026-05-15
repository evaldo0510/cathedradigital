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
      padding="lg"
      className="relative overflow-hidden space-y-16"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Sparkles className="w-6 h-6 text-secondary" strokeWidth={1} />
          <span className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-secondary/60">
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
      <div className="space-y-8" role="article" aria-label="Versículo do Dia">
        <div className="flex items-center gap-3.5">
          <BookOpen className="w-5 h-5 text-primary/40" strokeWidth={1.25} />
          <span className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/40">Verbum Domini</span>
        </div>
        <blockquote className="text-3xl md:text-4xl font-serif italic text-primary leading-[1.3] pl-10 border-l-[3px] border-secondary/10">
          "{verse.text}"
        </blockquote>
        <p className="text-premium-tiny font-bold text-secondary uppercase tracking-[0.3em] pl-10 opacity-60">— {verse.ref}</p>
      </div>

      {/* Reflection */}
      <div className="space-y-6" role="article" aria-label="Reflexão">
        <div className="flex items-center gap-3.5">
           <Icons.PenLine className="w-4 h-4 text-muted-foreground/30" strokeWidth={1.25} />
           <span className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-muted-foreground/30">Meditatio</span>
        </div>
        <p className="text-xl text-primary/70 leading-relaxed font-serif italic pl-10">
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