/**
 * LiturgyRichHeader — cabeçalho editorial enriquecido da Missa:
 * tempo litúrgico, cor, grau, santo do dia, semana do saltério.
 *
 * Puramente visual. Alimenta-se de `DailyLiturgy` + `MissalProperRow`.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';
import type { MissalProperRow } from '@/hooks/useMissalProper';

const COLOR_DOT: Record<string, string> = {
  'liturgical-green': 'bg-emerald-600',
  'liturgical-white': 'bg-zinc-100 border border-zinc-400',
  'liturgical-red': 'bg-red-700',
  'liturgical-violet': 'bg-violet-700',
  'liturgical-rose': 'bg-pink-400',
  'liturgical-black': 'bg-neutral-900',
};

function psalterWeek(iso: string): number {
  // 4-week psalter cycle, week 1 begins on the first Sunday of Advent.
  const d = new Date(iso + 'T00:00:00');
  const start = new Date(Date.UTC(1970, 0, 4)); // ancoragem estável
  const weeks = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return ((weeks % 4) + 4) % 4 + 1;
}

interface Props {
  liturgy: DailyLiturgy | null;
  proper: MissalProperRow | null;
  saintOfDay?: string | null;
  isoDate: string;
}

export const LiturgyRichHeader: React.FC<Props> = ({ liturgy, proper, saintOfDay, isoDate }) => {
  const cor = proper?.liturgical_color ?? liturgy?.cor;
  const colorToken = liturgy?.colorToken;
  const tempo = liturgy?.season ?? proper?.season_note ?? null;
  const grau = proper?.celebration_title ?? null;
  const semana = psalterWeek(isoDate);

  const chips: { label: string; value: string; dot?: string }[] = [];
  if (tempo) chips.push({ label: 'Tempo', value: tempo });
  if (cor) chips.push({ label: 'Cor', value: cor, dot: colorToken ? COLOR_DOT[colorToken] : undefined });
  if (grau) chips.push({ label: 'Celebração', value: grau });
  if (saintOfDay) chips.push({ label: 'Santo do dia', value: saintOfDay });
  chips.push({ label: 'Saltério', value: `Semana ${semana}` });

  if (chips.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Contexto litúrgico do dia"
      className="mt-spacing-sm flex flex-wrap items-center justify-center gap-spacing-2xs"
    >
      {chips.map((c) => (
        <span
          key={c.label + c.value}
          className="inline-flex items-center gap-spacing-3xs rounded-full border border-border/50 bg-card/60 px-spacing-xs py-spacing-3xs font-stitch-body text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          {c.dot && <span className={cn('inline-block h-2 w-2 rounded-full', c.dot)} aria-hidden />}
          <span className="font-black text-primary">{c.label}:</span>
          <span className="text-foreground">{c.value}</span>
        </span>
      ))}
    </div>
  );
};

export default LiturgyRichHeader;
