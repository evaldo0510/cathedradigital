/**
 * MysteryClosingCard — encerramento ritual da dezena.
 * Mostra: fruto espiritual, pequena oração final (meta.closing_prayer),
 * ação concreta para o dia (meta.concrete_action) e CTA para o próximo
 * mistério. Substitui o antigo bloco "mystery-done".
 */
import React from 'react';
import { ArrowRight, Leaf, HandHeart, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from './mysteryMeta';
import { cn } from '@/lib/utils';

interface Props {
  mystery: DBMystery;
  isLast: boolean;
  onNext: () => void;
  accentClass?: string;
  slotAfter?: React.ReactNode;
}

const MysteryClosingCard: React.FC<Props> = ({ mystery, isLast, onNext, accentClass = 'text-stitch-secondary', slotAfter }) => {
  const meta = readMysteryMeta(mystery);
  const fruit = meta.virtue ?? mystery.fruit;
  const closingPrayer = meta.closing_prayer;
  const concreteAction = meta.concrete_action;

  return (
    <section
      aria-labelledby="mystery-closing"
      className="mb-10 rounded-3xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/50 p-6 md:p-8"
    >
      <p className={cn('font-stitch-body text-[11px] font-bold uppercase tracking-[0.32em]', accentClass)}>
        Dezena concluída
      </p>
      <h3
        id="mystery-closing"
        className="mt-2 font-stitch-display text-2xl leading-tight text-stitch-on-surface md:text-3xl"
      >
        {mystery.title}
      </h3>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {fruit && (
          <div className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface/40 p-4">
            <div className={cn('inline-flex items-center gap-1.5', accentClass)}>
              <Leaf aria-hidden className="h-3.5 w-3.5" />
              <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.24em]">
                Fruto
              </p>
            </div>
            <p className="mt-2 font-stitch-serif italic text-base text-stitch-on-surface md:text-lg">
              {fruit}
            </p>
          </div>
        )}

        {closingPrayer && (
          <div className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface/40 p-4">
            <div className={cn('inline-flex items-center gap-1.5', accentClass)}>
              <HandHeart aria-hidden className="h-3.5 w-3.5" />
              <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.24em]">
                Pequena oração
              </p>
            </div>
            <p className="mt-2 whitespace-pre-line font-stitch-serif text-sm leading-relaxed text-stitch-on-surface">
              {closingPrayer}
            </p>
          </div>
        )}

        {concreteAction && (
          <div className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface/40 p-4">
            <div className={cn('inline-flex items-center gap-1.5', accentClass)}>
              <Sunrise aria-hidden className="h-3.5 w-3.5" />
              <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.24em]">
                Ação para o dia
              </p>
            </div>
            <p className="mt-2 font-stitch-serif text-sm leading-relaxed text-stitch-on-surface">
              {concreteAction}
            </p>
          </div>
        )}
      </div>

      {slotAfter}

      {!isLast && (
        <div className="mt-8 flex justify-center">
          <Button type="button" variant="pill-active" size="pill" onClick={onNext}>
            <ArrowRight aria-hidden />
            Prosseguir para o próximo mistério
          </Button>
        </div>
      )}
    </section>
  );
};

export default MysteryClosingCard;
