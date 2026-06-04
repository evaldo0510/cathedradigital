import React, { useEffect, useState } from 'react';
import { Icons } from '@/constants';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/button';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AudioButtonProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'default';
}

const AudioButton: React.FC<AudioButtonProps> = ({ className = '', variant = 'outline' }) => {
  const { t } = useLang();
  const { settings, updateSettings } = useReadingSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeaking(window.speechSynthesis.speaking);
      setIsPaused(window.speechSynthesis.paused);
    };
    const timer = setInterval(checkSpeaking, 200);
    return () => clearInterval(timer);
  }, []);

  const toggle = () => {
    if (isSpeaking && !isPaused) {
       window.dispatchEvent(new CustomEvent('toggle-audio', { detail: { action: 'pause' } }));
    } else if (isSpeaking && isPaused) {
       window.dispatchEvent(new CustomEvent('toggle-audio', { detail: { action: 'play' } }));
    } else {
       window.dispatchEvent(new CustomEvent('toggle-audio'));
    }
  };

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('toggle-audio', { detail: { action: 'stop' } }));
  };

  const setRate = (rate: number) => {
    window.dispatchEvent(new CustomEvent('toggle-audio', { detail: { action: 'rate', value: rate } }));
  };

  if (settings.totalSilence) return null;

  return (
    <div className="flex items-center gap-spacing-2xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant}
            size="icon"
            className={className}
            title="Velocidade e Opções"
            aria-label="Opções de Áudio"
          >
            <Icons.Settings2 className="w-spacing-sm h-spacing-sm" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-background/95 backdrop-blur-xl border-primary/10">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-black">Velocidade</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
            <DropdownMenuItem 
              key={rate} 
              onClick={() => setRate(rate)}
              className={settings.audioPlaybackRate === rate ? "text-primary font-bold" : ""}
            >
              {rate}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        onClick={toggle}
        variant={variant}
        className={className}
        title={isSpeaking && !isPaused ? t('audio_pause') : t('audio_read')}
        aria-label={isSpeaking && !isPaused ? "Pausar Áudio" : "Ouvir Bíblia"}
      >
        {isSpeaking && !isPaused ? (
          <Icons.Pause className="w-spacing-md h-spacing-md" />
        ) : (
          <Icons.Volume2 className="w-spacing-md h-spacing-md group-hover:scale-110 transition-transform" />
        )}
        <span className="hidden md:inline-block ml-spacing-xs">
          {isSpeaking && !isPaused ? "Pausar" : isSpeaking && isPaused ? "Retomar" : t('audio_read')}
        </span>
      </Button>

      {isSpeaking && (
        <Button 
          onClick={stop}
          variant="ghost"
          size="icon"
          className="text-primary/40 hover:text-primary transition-colors"
          title="Parar"
        >
          <Icons.Square className="w-spacing-sm h-spacing-sm fill-current" />
        </Button>
      )}
    </div>
  );
};

export default AudioButton;
