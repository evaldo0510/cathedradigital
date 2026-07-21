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
 *
 * P1 — Botão consolidado no Design System via `<Button variant="pill">`.
 */
import React from 'react';
import { Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  audioUrl?: string | null;
  label?: string;
}

export const PrayerAudioPlayer: React.FC<Props> = ({ audioUrl, label = 'Áudio da oração' }) => {
  if (!audioUrl) {
    return (
      <Button
        type="button"
        variant="pill"
        size="pill"
        disabled
        aria-label="Áudio ainda não disponível"
        title="Áudio preparado para futura integração"
        className="cursor-not-allowed opacity-60"
      >
        <Headphones aria-hidden />
        Áudio em breve
      </Button>
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
