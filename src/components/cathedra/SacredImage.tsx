import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Icons } from '../../constants';
import { resolveColors, buildImageSrc, getInitials } from '@/lib/sacredPalette';

interface SacredImageProps {
  src: string | string[];
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string;
  dominantColor?: string;
}

const SacredImage = React.forwardRef<HTMLDivElement, SacredImageProps>(({ src, alt, className, priority = false, liturgicalColor, dominantColor }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  const sources = useMemo(() => {
    const s = Array.isArray(src) ? src : [src];
    return s.filter(Boolean).map(url => buildImageSrc(url, priority));
  }, [src, priority]);

  const mainSrc = sources[currentSrcIndex];
  const colors = useMemo(() => resolveColors(liturgicalColor, dominantColor), [liturgicalColor, dominantColor]);
  const initials = useMemo(() => getInitials(alt || ''), [alt]);

  useEffect(() => {
    if (!mainSrc) {
      if (currentSrcIndex < sources.length - 1) {
        setCurrentSrcIndex(prev => prev + 1);
      } else {
        setError(true);
        setIsLoaded(true);
      }
      return;
    }

    setIsLoaded(false);
    setError(false);
    
    const img = new Image();
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        handleImageError();
      }
    }, 10000);

    const handleImageError = () => {
      clearTimeout(timeout);
      console.warn(`SacredImage: Failed to load ${mainSrc}`);
      if (currentSrcIndex < sources.length - 1) {
        setCurrentSrcIndex(prev => prev + 1);
      } else {
        setError(true);
        setIsLoaded(true);
      }
    };

    img.src = mainSrc;
    img.onload = () => {
      clearTimeout(timeout);
      setIsLoaded(true);
    };
    img.onerror = handleImageError;

    return () => {
      clearTimeout(timeout);
      img.onload = null; 
      img.onerror = null;
    };
  }, [mainSrc, currentSrcIndex, sources.length]);

  return (
    <div ref={ref} className={`relative bg-[#0c0a09] overflow-hidden ${className}`}>
      {/* Gradient background — always visible as base layer / fallback */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isLoaded && !error ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: colors.base }}
      >
        <div className="absolute inset-[-50%] opacity-60" style={{ background: `radial-gradient(circle at 40% 40%, ${colors.accent} 0%, transparent 70%)`, animation: 'drift-slow 15s ease-in-out infinite' }} />
        <div className="absolute inset-0 " />
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
          <Icons.Cross className="w-xl h-xl opacity-20 text-secondary animate-spin" style={{ animationDuration: '12s' }} />
        </div>
      )}

      {/* Subtle overlay */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-50" />
    </div>
  );
});

SacredImage.displayName = 'SacredImage';

export default SacredImage;
