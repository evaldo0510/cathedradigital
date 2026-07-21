/**
 * MysteryLogosMeditation — Reflexão contemplativa antes da 1ª Ave-Maria.
 * Conteúdo vem exclusivamente do banco (prayer_mysteries.meta.logos_meditation).
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from './mysteryMeta';

const MysteryLogosMeditation: React.FC<{ mystery: DBMystery }> = ({ mystery }) => {
  const meta = readMysteryMeta(mystery);
  if (!meta.logos_meditation) return null;
  return (
    <aside
      aria-label="Meditação Logos"
      className="my-8 rounded-2xl border-l-2 border-stitch-secondary/60 bg-stitch-surface-container-lowest/40 py-5 pl-5 pr-4 md:pl-7"
    >
      <p className="inline-flex items-center gap-2 font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
        <Sparkles aria-hidden className="h-3 w-3" />
        Meditação Logos
      </p>
      <p className="mt-3 font-stitch-serif text-base leading-relaxed text-stitch-on-surface md:text-lg">
        {meta.logos_meditation}
      </p>
      {meta.recommended_intention && (
        <p className="mt-4 font-stitch-body text-xs italic text-stitch-on-surface-variant">
          Intenção sugerida — {meta.recommended_intention}
        </p>
      )}
    </aside>
  );
};

export default MysteryLogosMeditation;
