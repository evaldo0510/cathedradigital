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
          <div className="w-[0.5px] h-24 md:h-80 bg-gradient-to-b from-transparent via-primary/5 to-transparent mx-auto mb-16 md:mb-40 opacity-30" />
          {subtitle && (
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.8em] md:tracking-[1.4em] text-primary/20 mb-10 md:mb-20">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-6xl md:text-[10rem] lg:text-[12rem] tracking-tight text-primary/80 font-display leading-[0.8] filter blur-[0.4px]">
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
