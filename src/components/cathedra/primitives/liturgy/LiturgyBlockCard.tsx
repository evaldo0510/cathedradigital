/**
 * LiturgyBlockCard — primitivo editorial unificado para slots litúrgicos
 * (Missal + Liturgia das Horas).
 *
 * Substitui os dois `SlotCard` locais previamente duplicados em
 * `MissaContinuousReader.tsx` e `BreviaryContinuousReader.tsx`.
 *
 * Superset de variantes:
 *  - `default`     bloco padrão (leitura, oração)
 *  - `antiphon`    antífonas (itálico, opcionalmente centralizado)
 *  - `preface`     prefácio / Evangelho (destaque forte)
 *  - `psalm`       salmodia (cartão de leitura)
 *  - `concluding`  oração conclusiva (destaque final)
 *
 * Etapa 1 da Sprint C.4 — Fundação (UI compartilhada). Não altera
 * comportamento: apenas centraliza aparência e acessibilidade.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { PrayerTTSButton } from '../../PrayerTTSButton';

export type LiturgyBlockVariant =
  | 'default'
  | 'antiphon'
  | 'preface'
  | 'psalm'
  | 'concluding';

export interface LiturgyBlockCardProps {
  kicker: string;
  title?: string;
  text?: string | null;
  note?: string | null;
  variant?: LiturgyBlockVariant;
  /** Se presente, aplica `id` + `data-block-id` + scroll-margin. */
  anchorId?: string;
  loading?: boolean;
  celebrationMode?: boolean;
  /** Renderiza botão de TTS quando há texto (Breviário usa; Missa não). */
  withTTS?: boolean;
  /** Alinhamento do texto principal (Missa centraliza antífonas). */
  align?: 'left' | 'center';
  className?: string;
}

export const LiturgyBlockCard: React.FC<LiturgyBlockCardProps> = ({
  kicker,
  title,
  text,
  note,
  variant = 'default',
  anchorId,
  loading,
  celebrationMode,
  withTTS = false,
  align = 'left',
  className,
}) => {
  const containerVariant =
    variant === 'antiphon'
      ? 'border-primary/30 bg-primary/[0.03]'
      : variant === 'preface'
      ? 'border-primary/40 bg-primary/[0.04]'
      : variant === 'concluding'
      ? 'border-primary/40 bg-primary/[0.05]'
      : variant === 'psalm'
      ? 'border-border/60 bg-card/50'
      : 'border-border/60 bg-card/60';

  const ttsText = text ? [title, text].filter(Boolean).join('. ') : null;

  return (
    <section
      id={anchorId}
      data-block-id={anchorId}
      aria-label={title ?? kicker}
      className={cn(
        'relative my-spacing-md rounded-2xl border p-spacing-md md:p-spacing-lg',
        anchorId && 'scroll-mt-24',
        containerVariant,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-spacing-sm">
        <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          {kicker}
        </p>
        {withTTS && ttsText && !celebrationMode && (
          <PrayerTTSButton text={ttsText} label="Ouvir" />
        )}
      </div>

      {title && (
        <h3 className="mt-spacing-2xs font-stitch-display text-premium-lg md:text-premium-xl leading-tight text-foreground">
          {title}
        </h3>
      )}

      {loading ? (
        <div className="mt-spacing-sm space-y-2">
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-muted/60 rounded animate-pulse" />
        </div>
      ) : text ? (
        <p
          className={cn(
            'mt-spacing-sm whitespace-pre-line font-stitch-display leading-[1.7] text-foreground',
            celebrationMode
              ? 'text-premium-xl md:text-premium-2xl'
              : 'text-premium-base md:text-premium-lg',
            variant === 'antiphon' && 'italic',
            align === 'center' && 'text-center',
          )}
        >
          {text}
        </p>
      ) : null}

      {note && (
        <p className="mt-spacing-sm font-stitch-body text-premium-xs italic text-muted-foreground">
          {note}
        </p>
      )}
    </section>
  );
};

export default LiturgyBlockCard;
