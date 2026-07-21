/**
 * ContemplationInvitation — bloco "Contemple" exibido no anúncio do mistério,
 * ANTES do primeiro Pai-Nosso. Convite silencioso: 2-3 frases profundas
 * derivadas de `meta.contemplation_invitation` (fallback para meditação).
 * Acompanha o SilenceTimer para induzir pausa deliberada antes de rezar.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from './mysteryMeta';
import SilenceTimer from './SilenceTimer';
import { useContemplativeRhythm } from '@/hooks/useContemplativeRhythm';
import { cn } from '@/lib/utils';

interface Props {
  mystery: DBMystery;
  accentClass?: string;
}

const ContemplationInvitation: React.FC<Props> = ({ mystery, accentClass = 'text-stitch-secondary' }) => {
  const meta = readMysteryMeta(mystery);
  const { rhythm } = useContemplativeRhythm();
  const phrases = (meta.contemplation_invitation && meta.contemplation_invitation.length > 0)
    ? meta.contemplation_invitation
    : meta.logos_meditation
      ? meta.logos_meditation.split(/(?<=[.?!])\s+/).slice(0, 3)
      : [];

  if (phrases.length === 0) return null;

  return (
    <aside
      aria-label="Convite à contemplação"
      className="my-10 rounded-2xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/40 px-6 py-8 text-center"
    >
      <div className={cn('mx-auto inline-flex items-center gap-2', accentClass)}>
        <Sparkles aria-hidden className="h-3.5 w-3.5" />
        <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.32em]">
          Contemple
        </p>
      </div>
      <ol className="mx-auto mt-6 max-w-[54ch] space-y-4">
        {phrases.slice(0, 3).map((p, i) => (
          <li
            key={i}
            className="font-stitch-serif text-lg italic leading-relaxed text-stitch-on-surface md:text-xl"
          >
            {p}
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <SilenceTimer forcedSeconds={rhythm.silenceSec} />
      </div>
      <p className="mt-2 font-stitch-body text-[10px] uppercase tracking-[0.28em] text-stitch-on-surface-variant/70">
        Só então inicie o Pai-Nosso
      </p>
    </aside>
  );
};

export default ContemplationInvitation;
