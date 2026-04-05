import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../../constants';

interface SacredImageProps {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string;
  dominantColor?: string;
}

/** Extract up to 2 initials from a name like "São Tomás de Aquino" → "TA" */
function getInitials(name: string): string {
  const skip = new Set(['são', 'santa', 'santo', 'de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'the', 'of']);
  const words = name.split(/\s+/).filter(w => !skip.has(w.toLowerCase()));
  if (words.length === 0) return name.charAt(0).toUpperCase();
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const SacredImage: React.FC<SacredImageProps> = ({ src, alt, className, priority = false, liturgicalColor, dominantColor }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const SACRED_PALETTE: Record<string, { primary: string, accent: string, depth: string }> = {
    green: { primary: '#064e3b', accent: '#059669', depth: '#022c22' },
    red: { primary: '#450a0a', accent: '#dc2626', depth: '#2d0606' },
    purple: { primary: '#2e1065', accent: '#7c3aed', depth: '#1e0a3d' },
    rose: { primary: '#500724', accent: '#db2777', depth: '#310415' },
    black: { primary: '#1c1917', accent: '#44403c', depth: '#0c0a09' },
    white: { primary: '#e5e5e0', accent: '#d4af37', depth: '#a8a29e' },
    gold: { primary: '#451a03', accent: '#fbbf24', depth: '#290f02' }
  };

  const colors = useMemo(() => {
    const colorKey = liturgicalColor?.toLowerCase() || 'gold';
    const palette = SACRED_PALETTE[colorKey] || SACRED_PALETTE.gold;
    return {
      base: dominantColor || palette.primary,
      accent: dominantColor ? `${dominantColor}cc` : palette.accent,
      depth: dominantColor ? `${dominantColor}66` : palette.depth
    };
  }, [liturgicalColor, dominantColor]);

  const mainSrc = useMemo(() => {
    if (!src) return '';
    if (src.includes('unsplash.com')) {
      const base = src.split('?')[0];
      return `${base}?auto=format&fit=crop&q=${priority ? '85' : '75'}&w=${priority ? '1400' : '800'}`;
    }
    return src;
  }, [src, priority]);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    if (!mainSrc) { setError(true); setIsLoaded(true); return; }
    const img = new Image();
    img.src = mainSrc;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => { setError(true); setIsLoaded(true); };
    return () => { img.onload = null; img.onerror = null; };
  }, [mainSrc]);

  const initials = useMemo(() => getInitials(alt || ''), [alt]);

  return (
    <div className={`relative bg-[#0c0a09] overflow-hidden ${className}`}>
      {/* Gradient background — always visible as base layer / fallback */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isLoaded && !error ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: colors.base }}
      >
        <div className="absolute inset-[-50%] opacity-60" style={{ background: `radial-gradient(circle at 40% 40%, ${colors.accent} 0%, transparent 70%)`, animation: 'drift-slow 15s ease-in-out infinite' }} />
        <div className="absolute inset-0 backdrop-blur-2xl" />
        {/* Initials fallback */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-[5]">
            <span
              className="font-serif font-bold text-white/80 select-none"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 4rem)', textShadow: `0 2px 12px ${colors.depth}` }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Actual image */}
      {!error && (
        <img
          src={mainSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          className={`relative z-[2] w-full h-full object-cover transition-all ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'}`}
          style={{ transitionDuration: '2000ms' }}
        />
      )}

      {/* Loading spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Icons.Cross className="w-10 h-10 opacity-20 text-[#d4af37] animate-spin" style={{ animationDuration: '12s' }} />
        </div>
      )}

      {/* Subtle overlay */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-50" />
    </div>
  );
};

export default SacredImage;
