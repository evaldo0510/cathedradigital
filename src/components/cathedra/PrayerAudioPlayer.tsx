import { Button } from '@/components/ui/button';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface PrayerAudioPlayerProps {
  prayers: { label: string; text: string }[];
  variant?: 'light' | 'dark';
}

/**
 * Native TTS prayer player that works in background.
 * Uses the Web Speech Synthesis API — no external dependencies.
 */
const PrayerAudioPlayer: React.FC<PrayerAudioPlayerProps> = ({ prayers, variant = 'light' }) => {
  const { settings } = useReadingSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rate, setRate] = useState(0.85);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const idxRef = useRef(0);

  const isDark = variant === 'dark';

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const speakPrayer = useCallback((idx: number) => {
    if (idx >= prayers.length) {
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    idxRef.current = idx;
    setCurrentIdx(idx);

    const utter = new SpeechSynthesisUtterance(prayers[idx].text);
    utter.lang = 'pt-BR';
    utter.rate = rate;
    utter.pitch = 0.95;

    // Try to pick a Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt')) || voices[0];
    if (ptVoice) utter.voice = ptVoice;

    utter.onend = () => {
      const next = idxRef.current + 1;
      if (next < prayers.length) {
        // Small pause between prayers
        setTimeout(() => speakPrayer(next), 800);
      } else {
        setIsPlaying(false);
      }
    };

    utter.onerror = () => {
      setIsPlaying(false);
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
  }, [prayers, rate]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      speakPrayer(0);
    }
  }, [isPlaying, stop, speakPrayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const onVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
  }, []);

  const bgClass = isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-muted border-border';
  const textClass = isDark ? 'text-secondary' : 'text-foreground';
  const mutedClass = isDark ? 'text-secondary/50' : 'text-muted-foreground';
  const btnClass = isDark
    ? 'bg-secondary/20 text-secondary border-secondary/20 hover:bg-secondary/30'
    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';

  if (settings.totalSilence) return null;

  return (
    <div className={`rounded-full border p-spacing-md space-y-spacing-sm ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-spacing-xs">
          <Icons.Audio className={`w-spacing-md h-spacing-md ${mutedClass}`} />
          <span className={`text-xs font-black uppercase tracking-widest ${mutedClass}`}>
            Áudio das Orações
          </span>
        </div>
        <div className="flex items-center gap-spacing-xs">
          <span className={`text-xs font-bold ${mutedClass}`}>Vel:</span>
          {[0.7, 0.85, 1.0].map(r => (
            <Button
              key={r}
              onClick={() => setRate(r)}
              className={`w-spacing-lg h-spacing-lg rounded-full text-xs font-bold transition-all ${
                rate === r
                  ? (isDark ? 'bg-secondary/30 text-secondary' : 'bg-primary text-primary-foreground')
                  : (isDark ? 'bg-card/50 text-secondary/40' : 'bg-card text-muted-foreground')
              }`}
            >
              {r === 0.7 ? '−' : r === 1.0 ? '+' : '•'}
            </Button>
          ))}
        </div>
      </div>

      {/* Progress indicators */}
      {isPlaying && (
        <div className="flex gap-spacing-2xs">
          {prayers.map((_, i) => (
            <div key={i} className={`flex-1 h-spacing-2xs rounded-full transition-all ${
              i <= currentIdx
                ? (isDark ? 'bg-secondary/60' : 'bg-primary')
                : (isDark ? 'bg-white/10' : 'bg-border')
            }`} />
          ))}
        </div>
      )}

      {isPlaying && (
        <p className={`text-xs font-serif italic ${mutedClass} text-center`}>
          ♪ {prayers[currentIdx]?.label}
        </p>
      )}

      <Button
        onClick={togglePlay}
        className={`w-full py-spacing-sm rounded-full border font-bold text-sm transition-all flex items-center justify-center gap-spacing-xs ${btnClass}`}
      >
        {isPlaying ? (
          <>
            <Icons.Stop className="w-spacing-md h-spacing-md" />
            Parar Áudio
          </>
        ) : (
          <>
            <Icons.Audio className="w-spacing-md h-spacing-md" />
            Ouvir Orações
          </>
        )}
      </Button>

      <p className={`text-xs text-center ${mutedClass} italic`}>
        Funciona em segundo plano • Síntese de voz nativa
      </p>
    </div>
  );
};

export default PrayerAudioPlayer;
