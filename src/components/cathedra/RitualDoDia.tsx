import React, { useMemo } from 'react';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import SaintOfTheDayCard from './SaintOfTheDayCard';
import { BookOpen, Sparkles } from 'lucide-react';
import { DAILY_VERSES, DAILY_REFLECTIONS } from '@/data/dailyRitual';
import { Card   } from './Card';

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
      className="relative overflow-hidden"
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-secondary" strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary/60">
              Ritual do Dia
            </span>
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
          <blockquote className="text-xl md:text-2xl font-serif italic text-primary/90 leading-relaxed pl-6 border-l-[3px] border-secondary/20">
            "{verse.text}"
          </blockquote>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-6">— {verse.ref}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/20" />

        {/* Reflection */}
        <div className="space-y-3" role="article" aria-label="Reflexão">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">✦ Reflexão</span>
          <p className="text-base text-foreground/70 leading-relaxed font-reader">
            {reflection}
          </p>
        </div>

        <div className="pt-2">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir o Ritual do Dia"
            variant="outline"
            className="w-full justify-center"
          />
        </div>
      </div>
    </Card>
  );
};

export default RitualDoDia;