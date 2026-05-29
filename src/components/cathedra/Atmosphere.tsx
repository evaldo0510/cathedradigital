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
      "opacity-[var(--atmosphere-intensity,0.25)]",
      settings.theme === 'dark' || settings.theme === 'night' ? "dark:opacity-[var(--atmosphere-dark-opacity,0.15)]" : ""
    )}>
      {/* Primary Light - Divine Presence */}
      <motion.div 
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.45, 0.3]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-primary/8 rounded-full"
        style={{ 
          filter: `blur(calc(var(--atmosphere-blur, 80px) * 1))`
        }}
      />

      {/* Secondary Light - Sovereign Grace */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ 
          duration: 18, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-secondary/5 rounded-full"
        style={{ 
          filter: `blur(calc(var(--atmosphere-blur, 60px) * 0.8))`
        }}
      />

      {/* Floating Particles/Layers - Architectural Depth (Simplified) */}
      <div className="absolute inset-0 opacity-[calc(var(--atmosphere-intensity)*0.3)]">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              opacity: [0.03, 0.1, 0.03]
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2
            }}
            className="absolute bg-primary/2 rounded-full"
            style={{
              width: `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              left: `${15 + i * 40}%`,
              top: `${30 + i * 20}%`,
              filter: `blur(calc(var(--atmosphere-blur, 40px) * 0.5))`
            }}
          />
        ))}
      </div>

      {/* Subtle Vignette for Visual Silence Precision */}
      {settings.visualSilence && (
        <div 
          className="absolute inset-0 transition-opacity duration-[2000ms]"
          style={{
            background: `radial-gradient(circle at center, transparent 40%, hsl(var(--background) / calc(var(--atmosphere-intensity) * 0.3)) 100%)`,
          }}
        />
      )}
    </div>
  );
};

export default Atmosphere;
