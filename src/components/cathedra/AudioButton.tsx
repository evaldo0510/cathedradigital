import React, { useEffect, useState } from 'react';
import { Icons } from '@/constants';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/button';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface AudioButtonProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'default';
}

const AudioButton: React.FC<AudioButtonProps> = ({ className = '', variant = 'outline' }) => {
  const { t } = useLang();
  const { settings } = useReadingSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeaking(window.speechSynthesis.speaking);
    };
    const timer = setInterval(checkSpeaking, 500);
    return () => clearInterval(timer);
  }, []);

  const toggle = () => {
    window.dispatchEvent(new CustomEvent('toggle-audio'));
  };

  if (settings.totalSilence) return null;

  return (
    <Button 
      onClick={toggle}
      variant={variant}
      className={className}
      title={isSpeaking ? t('audio_stop') : t('audio_read')}
    >
      {isSpeaking ? (
        <Icons.Stop className="w-spacing-md h-spacing-md animate-pulse" />
      ) : (
        <Icons.Volume2 className="w-spacing-md h-spacing-md group-hover:scale-110 transition-transform" />
      )}
      <span className="hidden md:inline-block">
        {isSpeaking ? t('audio_stop') : t('audio_read')}
      </span>
    </Button>
  );
};

export default AudioButton;
