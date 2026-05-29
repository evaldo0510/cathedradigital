import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';


interface ContemplativeLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  maxW?: string;
}

const ContemplativeLayout: React.FC<ContemplativeLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  className,
  maxW = 'max-w-[1200px]'
}) => {
  const { settings } = useReadingSettings();
  
  return (
    <div className={cn("min-h-screen pt-28 md:pt-32 pb-56 will-change-transform", className)}>

      {(title || subtitle) && (
        <header className={cn("mb-20 md:mb-24 px-8 text-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-2 duration-1000")}>
          <div className="w-[1.5px] h-20 bg-primary/10 mx-auto mb-12" />
          {subtitle && (
            <p className="text-[11px] font-bold uppercase tracking-[0.7em] text-primary/70 mb-8">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-4xl md:text-6xl font-display font-light text-primary tracking-[0.15em] uppercase leading-tight">
              {title}
            </h1>
          )}
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0, y: settings.reduceAnimations ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: settings.reduceAnimations ? 0.1 : 0.7, 
          ease: settings.reduceAnimations ? "linear" : [0.16, 1, 0.3, 1] 
        }}

        className={cn("mx-auto px-6", maxW)}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ContemplativeLayout;
