import React, { useMemo } from 'react';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import SaintOfTheDayCard from './SaintOfTheDayCard';
import { BookOpen, Sparkles } from 'lucide-react';
import { DAILY_VERSES, DAILY_REFLECTIONS } from '@/data/dailyRitual';
import { HomeCard as Card } from './HomeCard';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';

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
      padding="md"
      variant="default"
      className="relative overflow-hidden h-full"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CathedraIcon icon={Sparkles} size={IconSizePreset.TINY} variant="secondary" />
            <span className="text-premium-small text-secondary opacity-60">
              Ritual do Dia
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 text-right">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Saint of the Day */}
        <SaintOfTheDayCard variant="compact" />

        {/* Divider */}
        <div className="divider-line !bg-primary/[0.04]" />

        {/* Bible Verse */}
        <div className="space-y-4" role="article" aria-label="Versículo do Dia">
          <div className="flex items-center gap-2.5">
            <CathedraIcon icon={BookOpen} size={IconSizePreset.TINY} variant="primary" />
            <span className="text-premium-tiny font-bold uppercase tracking-[0.3em] text-primary/60">Versículo do Dia</span>
          </div>
          <blockquote className="text-lg font-serif italic text-primary/90 leading-relaxed pl-6 border-l-[3px] border-secondary/20">
            "{verse.text}"
          </blockquote>
          <p className="text-premium-tiny font-bold text-secondary uppercase tracking-widest pl-6">— {verse.ref}</p>
        </div>

        {/* Divider */}
        <div className="divider-line !bg-primary/[0.04]" />

        {/* Reflection */}
        <div className="space-y-3" role="article" aria-label="Reflexão">
          <span className="text-premium-tiny font-bold uppercase tracking-[0.3em] text-muted-foreground/40">✦ Reflexão</span>
          <p className="text-sm text-foreground/70 leading-relaxed font-reader">
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