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
    <div className={cn("min-h-screen pt-12 md:pt-72 pb-24 md:pb-96 will-change-transform", className)}>

      {(title || subtitle) && (
        <header className={cn("header-margin-rhythm px-8 md:px-12 text-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-6 duration-[2000ms] ease-out")}>
          <div className="w-[0.5px] h-16 md:h-64 bg-gradient-to-b from-transparent via-primary/10 to-transparent mx-auto mb-12 md:mb-32 opacity-40" />
          {subtitle && (
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.6em] md:tracking-[1em] text-primary/30 mb-8 md:mb-16">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-5xl md:text-9xl lg:text-[8.5rem] tracking-tight text-primary/90 font-display leading-[0.85] filter blur-[0.3px]">
              {title}
            </h1>
          )}
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0, y: settings.reduceAnimations ? 0 : 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: settings.reduceAnimations ? 0.1 : 1.8, 
          ease: settings.reduceAnimations ? "linear" : [0.19, 1, 0.22, 1] 
        }}

        className={cn("app-container", className)}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ContemplativeLayout;
