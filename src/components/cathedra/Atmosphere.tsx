import React from 'react';
import { motion } from 'framer-motion';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';

export const Atmosphere: React.FC = () => {
  const { settings } = useReadingSettings();
  
  // Skip rendering if total silence is on and we want to be extra strict, 
  // but usually atmosphere is part of the "Visual Silence" so we keep it subtle.
  if (settings.totalSilence && settings.visualSilence) return null;

  return (
    <div className={cn(
      "fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-[3000ms] ease-in-out",
      "opacity-[var(--atmosphere-intensity,0.3)]",
      settings.theme === 'dark' || settings.theme === 'night' ? "dark:opacity-[var(--atmosphere-dark-opacity,0.2)]" : ""
    )}>
      {/* Primary Light - Divine Presence */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/10 rounded-full"
        style={{ 
          filter: `blur(calc(var(--atmosphere-blur, 150px) * 1))`
        }}
      />

      {/* Secondary Light - Sovereign Grace */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, -30, 0],
          y: [0, 30, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-secondary/5 rounded-full"
        style={{ 
          filter: `blur(calc(var(--atmosphere-blur, 120px) * 0.8))`
        }}
      />

      {/* Floating Particles/Layers - Architectural Depth */}
      <div className="absolute inset-0 opacity-[calc(var(--atmosphere-intensity)*0.5)]">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              opacity: [0.05, 0.15, 0.05],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 25 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2
            }}
            className="absolute bg-primary/2 rounded-full"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: `${10 + i * 30}%`,
              top: `${20 + i * 20}%`,
              filter: `blur(calc(var(--atmosphere-blur, 100px) * 0.5))`
            }}
          />
        ))}
      </div>

      {/* Subtle Vignette for Visual Silence Precision */}
      {settings.visualSilence && (
        <div 
          className="absolute inset-0 transition-opacity duration-[2000ms]"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, hsl(var(--background) / calc(var(--atmosphere-intensity) * 0.4)) 100%)`,
          }}
        />
      )}
    </div>
  );
};

export default Atmosphere;
