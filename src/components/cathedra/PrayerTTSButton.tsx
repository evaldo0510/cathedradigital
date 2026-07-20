/**
 * PrayerTTSButton — narração contemplativa via Lovable AI Gateway.
 *
 * Chama a edge function `prayer-tts` e reproduz MP3 no <audio>. Cacheia o
 * blob por hash do texto no sessionStorage para evitar re-síntese.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, Loader2, Pause, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CACHE_PREFIX = 'cathedra:prayer:tts:';

async function hash(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface Props {
  text: string;
  className?: string;
  label?: string;
}

export const PrayerTTSButton: React.FC<Props> = ({ text, className, label = 'Ouvir' }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // reset ao trocar de texto
  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setState('idle');
  }, [text]);

  const play = useCallback(async () => {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('paused');
      return;
    }
    if (state === 'paused' && audioRef.current) {
      await audioRef.current.play();
      setState('playing');
      return;
    }
    setState('loading');
    try {
      const h = await hash(text);
      const cacheKey = `${CACHE_PREFIX}${h}`;
      let blob: Blob | null = null;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const res = await fetch(cached);
        if (res.ok) blob = await res.blob();
      }
      if (!blob) {
        const { data, error } = await supabase.functions.invoke('prayer-tts', {
          body: { text },
        });
        if (error) throw error;
        blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: 'audio/mpeg' });
      }
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('error');
      await audio.play();
      setState('playing');
    } catch (e) {
      console.error('[prayer-tts] error:', e);
      const msg = e instanceof Error ? e.message : 'Falha ao gerar narração';
      toast.error(msg);
      setState('error');
    }
  }, [state, text]);

  const Icon =
    state === 'loading' ? Loader2 : state === 'playing' ? Pause : state === 'paused' ? Play : Volume2;

  return (
    <button
      type="button"
      onClick={play}
      disabled={state === 'loading' || !text}
      aria-label={state === 'playing' ? 'Pausar narração' : `${label} narração`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/40 px-3 py-1.5 font-stitch-body text-xs uppercase tracking-widest text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary/50 hover:text-stitch-on-surface disabled:opacity-40',
        state === 'playing' && 'border-stitch-secondary bg-stitch-secondary/10 text-stitch-secondary',
        className,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', state === 'loading' && 'animate-spin')} aria-hidden />
      {state === 'playing' ? 'Pausar' : state === 'paused' ? 'Retomar' : label}
    </button>
  );
};

export default PrayerTTSButton;
