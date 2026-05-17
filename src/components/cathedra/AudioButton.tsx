import React, { useEffect, useState } from 'react';
import { Icons } from '@/constants';
import { useLang } from '@/hooks/useLang';

interface AudioButtonProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'solid';
}

const AudioButton: React.FC<AudioButtonProps> = ({ className = '', variant = 'outline' }) => {
  const { t } = useLang();
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

  const getVariantClasses = () => {
    switch (variant) {
      case 'ghost': return 'bg-transparent text-primary hover:bg-primary/10';
      case 'solid': return 'bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90';
      default: return 'bg-card border-border text-primary hover:bg-primary/10 hover:border-primary/30';
    }
  };

  return (
    <button 
      onClick={toggle}
      className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center gap-2 group ${getVariantClasses()} ${className}`}
      title={isSpeaking ? t('audio_stop') : t('audio_read')}
    >
      {isSpeaking ? (
        <Icons.Stop className="w-4.5 h-4.5 animate-pulse" />
      ) : (
        <Icons.Volume2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline-block">
        {isSpeaking ? t('audio_stop') : t('audio_read')}
      </span>
    </button>
  );
};

export default AudioButton;
