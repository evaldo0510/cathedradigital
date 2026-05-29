import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../../constants';
import { resolveColors, buildImageSrc, getInitials } from '@/lib/sacredPalette';
import { cn } from '@/lib/utils';

interface SacredImageProps {
  src: string | string[];
  alt: string;
  className: string;
  priority?: boolean;
  liturgicalColor?: string;
  dominantColor?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
}

const SacredImage = React.forwardRef<HTMLDivElement, SacredImageProps>(({ 
  src, 
  alt, 
  className, 
  priority = false, 
  liturgicalColor, 
  dominantColor,
  sizes = "(max-width: 768px) 100vw, 50vw",
  loading
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  const sources = useMemo(() => {
    const s = Array.isArray(src) ? src : [src];
    return s.filter(Boolean).map(url => buildImageSrc(url, priority));
  }, [src, priority]);

  const mainSrc = sources[currentSrcIndex];
  
  // Create optimized variants and srcset
  const srcSet = useMemo(() => {
    if (!mainSrc || !mainSrc.includes('unsplash.com')) return undefined;
    const base = mainSrc.split('?')[0];
    return [400, 800, 1200, 1600].map(w => `${buildImageSrc(base, priority, w)} ${w}w`).join(', ');
  }, [mainSrc, priority]);

  const webpSrc = useMemo(() => {
    if (!mainSrc) return null;
    if (mainSrc.includes('unsplash.com')) return mainSrc; 
    return mainSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }, [mainSrc]);

  const avifSrc = useMemo(() => {
    if (!mainSrc) return null;
    if (mainSrc.includes('unsplash.com')) return mainSrc;
    return mainSrc.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }, [mainSrc]);


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
    // Use a shorter timeout on mobile for better perceived performance
    const isMobile = window.innerWidth < 768;
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        handleImageError();
      }
    }, isMobile ? 5000 : 10000);

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
    <div ref={ref} className={cn("relative bg-[#0c0a09] overflow-hidden", className)}>
      {/* Base colors and initials fallback */}
      <div
        className={cn(
          "absolute inset-0 z-0 transition-opacity duration-1000",
          isLoaded && !error ? 'opacity-0' : 'opacity-100'
        )}
        style={{ backgroundColor: colors.base }}
      >
        <div 
          className="absolute inset-[-50%] opacity-60 pointer-events-none" 
          style={{ 
            background: `radial-gradient(circle at 40% 40%, ${colors.accent} 0%, transparent 70%)`, 
            animation: 'drift-slow 15s ease-in-out infinite' 
          }} 
        />
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

      {/* Optimized Image with Picture tag */}
      {!error && (
        <picture className="block w-full h-full">
          {avifSrc && !mainSrc.includes('unsplash.com') && (
            <source srcSet={avifSrc} type="image/avif" />
          )}
          {webpSrc && !mainSrc.includes('unsplash.com') && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          <img
            src={mainSrc}
            alt={alt}
            loading={loading || (priority ? "eager" : "lazy")}
            decoding={priority ? "sync" : "async"}
            sizes={sizes}
            className={cn(
              "relative z-[2] w-full h-full object-cover transition-all duration-[2000ms]",
              isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
            )}
          />
        </picture>
      )}

      {/* Subtle overlay */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-50" />
      
      {/* Cinematic noise grain - very light for performance */}
      <div className="absolute inset-0 z-[4] opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
});

SacredImage.displayName = 'SacredImage';

export default SacredImage;
