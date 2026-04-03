import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icons } from '../../constants';

interface PrayerAudioPlayerProps {
  prayers: { label: string; text: string }[];
  variant?: 'light' | 'dark';
}

/**
 * Native TTS prayer player that works in background.
 * Uses the Web Speech Synthesis API — no external dependencies.
 */
const PrayerAudioPlayer: React.FC<PrayerAudioPlayerProps> = ({ prayers, variant = 'light' }) => {
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
  const textClass = isDark ? 'text-amber-100' : 'text-foreground';
  const mutedClass = isDark ? 'text-amber-200/50' : 'text-muted-foreground';
  const btnClass = isDark
    ? 'bg-amber-400/20 text-amber-200 border-amber-400/20 hover:bg-amber-400/30'
    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Audio className={`w-4 h-4 ${mutedClass}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${mutedClass}`}>
            Áudio das Orações
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${mutedClass}`}>Vel:</span>
          {[0.7, 0.85, 1.0].map(r => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
                rate === r
                  ? (isDark ? 'bg-amber-400/30 text-amber-200' : 'bg-primary text-primary-foreground')
                  : (isDark ? 'bg-white/5 text-amber-200/40' : 'bg-card text-muted-foreground')
              }`}
            >
              {r === 0.7 ? '−' : r === 1.0 ? '+' : '•'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress indicators */}
      {isPlaying && (
        <div className="flex gap-1">
          {prayers.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
              i <= currentIdx
                ? (isDark ? 'bg-amber-400/60' : 'bg-primary')
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

      <button
        onClick={togglePlay}
        className={`w-full py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${btnClass}`}
      >
        {isPlaying ? (
          <>
            <Icons.Stop className="w-4 h-4" />
            Parar Áudio
          </>
        ) : (
          <>
            <Icons.Audio className="w-4 h-4" />
            Ouvir Orações
          </>
        )}
      </button>

      <p className={`text-[9px] text-center ${mutedClass} italic`}>
        Funciona em segundo plano • Síntese de voz nativa
      </p>
    </div>
  );
};

export default PrayerAudioPlayer;
