/**
 * SpiritualFruitBadge — bloco discreto exibindo virtude/fruto do mistério.
 */
import React from 'react';
import { Leaf } from 'lucide-react';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from './mysteryMeta';

const SpiritualFruitBadge: React.FC<{ mystery: DBMystery }> = ({ mystery }) => {
  const meta = readMysteryMeta(mystery);
  const fruit = meta.virtue ?? mystery.fruit;
  if (!fruit) return null;
  return (
    <div
      role="note"
      aria-label="Fruto espiritual deste mistério"
      className="my-6 inline-flex items-center gap-2 rounded-full border border-stitch-outline-variant/50 bg-stitch-surface-container-lowest/40 px-4 py-1.5"
    >
      <Leaf aria-hidden className="h-3.5 w-3.5 text-stitch-secondary" />
      <span className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.24em] text-stitch-on-surface-variant">
        Fruto
      </span>
      <span className="font-stitch-body text-sm text-stitch-on-surface">{fruit}</span>
    </div>
  );
};

export default SpiritualFruitBadge;
