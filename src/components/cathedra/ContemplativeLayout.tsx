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
    <div className={cn("min-h-screen pt-12 md:pt-64 pb-24 md:pb-80 will-change-transform", className)}>

      {(title || subtitle) && (
        <header className={cn("header-margin-rhythm px-6 md:px-8 text-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-4 duration-1500")}>
          <div className="w-[1px] h-12 md:h-48 bg-gradient-to-b from-transparent via-primary/5 to-transparent mx-auto mb-8 md:mb-24" />
          {subtitle && (
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.5em] md:tracking-[0.8em] text-primary/40 mb-6 md:mb-12">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-4xl md:text-8xl lg:text-[7rem] tracking-tight text-primary font-display leading-[0.9] filter blur-[0.2px]">
              {title}
            </h1>
          )}
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0, y: settings.reduceAnimations ? 0 : 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: settings.reduceAnimations ? 0.1 : 1.2, 
          ease: settings.reduceAnimations ? "linear" : [0.16, 1, 0.3, 1] 
        }}

        className={cn("app-container", className)}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ContemplativeLayout;
