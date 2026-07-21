import React from 'react';
import { motion } from 'framer-motion';
import type { LiturgicalColorToken } from '@/core/liturgy/LiturgyProvider';

const COLOR_STYLE: Record<LiturgicalColorToken, { bg: string; ring: string; label: string }> = {
  'liturgical-green':  { bg: 'bg-emerald-500',  ring: 'ring-emerald-200',  label: 'Verde' },
  'liturgical-white':  { bg: 'bg-neutral-100',  ring: 'ring-neutral-300',  label: 'Branco' },
  'liturgical-red':    { bg: 'bg-red-600',      ring: 'ring-red-200',      label: 'Vermelho' },
  'liturgical-violet': { bg: 'bg-violet-600',   ring: 'ring-violet-200',   label: 'Roxo' },
  'liturgical-rose':   { bg: 'bg-pink-400',     ring: 'ring-pink-200',     label: 'Rosa' },
  'liturgical-black':  { bg: 'bg-neutral-900',  ring: 'ring-neutral-400',  label: 'Preto' },
};

export interface LiturgyDayHeaderProps {
  /** Data já formatada (ex.: "sexta-feira, 22 de agosto de 2026"). */
  formattedDate: string;
  isToday: boolean;
  liturgia: string;
  dia?: string | null;
  season?: string | null;
  colorToken: LiturgicalColorToken;
}

export const LiturgyDayHeader: React.FC<LiturgyDayHeaderProps> = ({
  formattedDate,
  isToday,
  liturgia,
  dia,
  season,
  colorToken,
}) => {
  const style = COLOR_STYLE[colorToken] ?? COLOR_STYLE['liturgical-green'];
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-spacing-xs"
      aria-label="Informações do dia litúrgico"
    >
      <p className="text-premium-sm font-bold text-primary capitalize">
        {formattedDate}
        {isToday && <span className="ml-spacing-xs text-secondary">(Hoje)</span>}
      </p>
      {(liturgia || dia) && (
        <p className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
          {liturgia || dia}
        </p>
      )}
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-3xs rounded-premium-full bg-muted/40 border border-border/40">
        <span
          className={`inline-block w-spacing-sm h-spacing-sm rounded-full ${style.bg} ring-2 ${style.ring}`}
          aria-hidden
          data-color-token={colorToken}
        />
        <span className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">
          {style.label}
          {season ? <> · {season}</> : null}
        </span>
      </div>
    </motion.header>
  );
};

export default LiturgyDayHeader;
