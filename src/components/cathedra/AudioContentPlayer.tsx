import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
import { Loader2, Play, Pause, Headphones, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handlePlay = async () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
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
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handlePlay}
        disabled={isLoading}
        variant={variant}
        size="sm"
        className={`rounded-full flex items-center gap-2 transition-all ${
          isPlaying ? 'bg-primary/10 text-primary border-primary/30' : ''
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <div className="flex items-end gap-[1px] h-3 mb-0.5">
            <div className="w-[2px] h-2 bg-primary animate-[bounce_0.6s_infinite_ease-in-out]" />
            <div className="w-[2px] h-3 bg-primary animate-[bounce_0.8s_infinite_ease-in-out]" />
            <div className="w-[2px] h-1.5 bg-primary animate-[bounce_0.5s_infinite_ease-in-out]" />
            <div className="w-[2px] h-2.5 bg-primary animate-[bounce_0.7s_infinite_ease-in-out]" />
          </div>
        ) : (
          <Headphones className="w-4 h-4" />
        )}
        {showTitle && <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>}
      </Button>
      
      {isPlaying && (
        <button 
          onClick={resetAudio}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Reiniciar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default AudioContentPlayer;
