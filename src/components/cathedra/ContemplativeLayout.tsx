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
    <div className={cn("min-h-screen pt-12 md:pt-48 pb-20 md:pb-64 will-change-transform", className)}>

      {(title || subtitle) && (
        <header className={cn("header-margin-rhythm px-6 md:px-24 text-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-12 duration-[2500ms] ease-out")}>
          <div className="w-[0.5px] h-20 md:h-64 bg-gradient-to-b from-transparent via-primary/10 to-transparent mx-auto mb-12 md:mb-32 opacity-20" />
          {subtitle && (
            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.8em] md:tracking-[1.8em] text-primary/30 mb-10 md:mb-20 selection:bg-primary/20">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-7xl md:text-[12rem] lg:text-[15rem] tracking-tighter text-primary/90 font-display leading-[0.75] filter blur-[0.2px] selection:bg-primary/10">
              {title}
            </h1>
          )}
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0, y: settings.reduceAnimations ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: settings.reduceAnimations ? 0.1 : 2.2, 
          ease: settings.reduceAnimations ? "linear" : [0.19, 1, 0.22, 1],
          delay: 0.2 // Small delay so it starts after the main page transition begins
        }}

        className={cn("app-container", className)}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ContemplativeLayout;
