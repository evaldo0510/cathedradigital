/**
 * PrayerAudioPlayer — player HTML5 leve para orações.
 *
 * Comportamento definido pelo produto:
 *   • Quando `audioUrl` existe, renderiza o player nativo controlado.
 *   • Quando não existe, mostra apenas um botão desabilitado indicando
 *     que o áudio está "preparado para futura integração" (a coluna
 *     `audio_url` já existe no schema `prayers`).
 *
 * Reutilizável entre todos os leitores do módulo Orações Premium.
 */
import React from 'react';
import { Headphones } from 'lucide-react';

interface Props {
  audioUrl?: string | null;
  label?: string;
}

export const PrayerAudioPlayer: React.FC<Props> = ({ audioUrl, label = 'Áudio da oração' }) => {
  if (!audioUrl) {
    return (
      <button
        type="button"
        disabled
        aria-label="Áudio ainda não disponível"
        title="Áudio preparado para futura integração"
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-stitch-outline-variant/40 px-3 py-1.5 font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant opacity-60"
      >
        <Headphones className="h-3.5 w-3.5" aria-hidden />
        Áudio em breve
      </button>
    );
  }

  return (
    <audio
      controls
      preload="none"
      src={audioUrl}
      aria-label={label}
      className="h-9 w-full max-w-sm rounded-full"
    >
      Seu navegador não suporta áudio HTML5.
    </audio>
  );
};

export default PrayerAudioPlayer;
