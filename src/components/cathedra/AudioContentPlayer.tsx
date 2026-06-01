import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';

import { useAuth } from '@/hooks/useAuth';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { toast } from 'sonner';

interface AudioContentPlayerProps {
  text: string;
  voiceId?: string; // Default Rachel: 21m00Tcm4lJC7Gz71S1T
  title?: string;
  className?: string;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  showTitle?: boolean;
}

const AudioContentPlayer: React.FC<AudioContentPlayerProps> = ({ 
  text, 
  voiceId = "21m00Tcm4lJC7Gz71S1T", 
  title = "Ouvir conteúdo",
  className = "",
  variant = "outline",
  showTitle = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPremium } = useAuth();
  const { settings } = useReadingSettings();

  const [lastPosition, setLastPosition] = useState(0);
  const [wasPlayingBeforeSilence, setWasPlayingBeforeSilence] = useState(false);

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle Total Silence Auto-Pause/Resume
  useEffect(() => {
    if (settings.totalSilence) {
      if (isPlaying) {
        setWasPlayingBeforeSilence(true);
        if (audioRef.current) {
          setLastPosition(audioRef.current.currentTime);
          audioRef.current.pause();
        }
        setIsPlaying(false);
      }
    } else if (wasPlayingBeforeSilence) {
      // Resume if it was playing before silence mode was activated
      if (audioRef.current) {
        audioRef.current.currentTime = lastPosition;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error("Error resuming audio:", err));
      }
      setWasPlayingBeforeSilence(false);
    }
  }, [settings.totalSilence]);

  const handlePlay = async () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setLastPosition(audioRef.current.currentTime);
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      return;
    }

    // Prepare text: strip markdown, HTML tags, and theological refs
    const cleanText = text
      .replace(/<[^>]*>?/gm, '') // Remove HTML
      .replace(/\[RECOMMENDATION:.*?\]/g, '') // Remove recommendations
      .replace(/\*\*/g, '') // Remove bold
      .replace(/#/g, '') // Remove headers
      .trim();

    if (!cleanText) {
      toast.error("Conteúdo vazio para leitura.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: cleanText,
          voice_id: voiceId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar áudio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast.error("Erro ao reproduzir áudio.");
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error("TTS Error:", error);
      toast.error(error.message || "Erro no serviço de voz. Verifique as configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setLastPosition(0);
      setIsPlaying(false);
    }
  };

  // If total silence is active, we don't render the player, but it stays in memory if it was playing
  if (settings.totalSilence) return null;

  return (
    <div className={`flex items-center gap-spacing-xs ${className}`}>
      <Button
        onClick={handlePlay}
        disabled={isLoading}
        variant={variant}
        size="sm"
        className={`rounded-premium-full flex items-center gap-spacing-xs transition-all ${
          isPlaying ? 'bg-primary/10 text-primary border-primary/30' : ''
        }`}
      >
        {isLoading ? (
          <Icons.Loader2 className="w-spacing-md h-spacing-md animate-spin" />
        ) : isPlaying ? (
          <div className="flex items-end gap-[1px] h-spacing-sm mb-spacing-3xs">
            <div className="w-[2px] h-spacing-xs bg-primary animate-[bounce_0.6s_infinite_ease-in-out]" />
            <div className="w-[2px] h-spacing-sm bg-primary animate-[bounce_0.8s_infinite_ease-in-out]" />
            <div className="w-[2px] h-spacing-2xs bg-primary animate-[bounce_0.5s_infinite_ease-in-out]" />
            <div className="w-[2px] h-spacing-xs bg-primary animate-[bounce_0.7s_infinite_ease-in-out]" />
          </div>
        ) : (
          <Icons.Headphones className="w-spacing-md h-spacing-md" />
        )}
        {showTitle && <span className="text-premium-xs font-black uppercase tracking-widest">{title}</span>}
      </Button>
      
      {isPlaying && (
        <Button 
          onClick={resetAudio}
          className="p-spacing-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Reiniciar"
        >
          <Icons.RotateCcw className="w-spacing-sm h-spacing-sm" />
        </Button>
      )}
    </div>
  );
};

export default AudioContentPlayer;
