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
    <div className={cn("min-h-screen pt-20 md:pt-48 pb-32 md:pb-64 will-change-transform", className)}>

      {(title || subtitle) && (
        <header className={cn("header-margin-rhythm px-8 text-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-4 duration-1000")}>
          <div className="w-[1px] h-16 md:h-32 bg-gradient-to-b from-transparent via-primary/10 to-transparent mx-auto mb-10 md:mb-16" />
          {subtitle && (
            <p className="h5 !text-primary/40 mb-6 md:mb-10">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-5xl md:text-8xl tracking-tight text-primary">
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
