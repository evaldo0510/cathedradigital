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
  headerActions?: React.ReactNode;
  icon?: React.ElementType;
}

const ContemplativeLayout: React.FC<ContemplativeLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  className,
  maxW = 'max-w-6xl',
  headerActions,
  icon: Icon
}) => {
  const { settings } = useReadingSettings();
  
  return (
    <div className={cn("min-h-screen pt-4 md:pt-12 pb-8 md:pb-24 will-change-[transform,opacity] flex flex-col items-center", className)}>
      {(title || subtitle || Icon) && (
        <header className={cn(
          "header-margin-rhythm px-4 md:px-12 text-center flex flex-col items-center", 

          !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-4 duration-[1000ms] ease-out"
        )}>
          {Icon && (
            <div className="mb-2 md:mb-3">
              <Icon className="w-4 h-4 md:w-6 md:h-6 text-primary opacity-10 mx-auto" strokeWidth={0.5} />
            </div>
          )}
          {subtitle && (
            <p className="text-[7px] md:text-[8px] font-black uppercase text-primary/20 mb-2 md:mb-4 tracking-[0.4em] md:tracking-[0.8em]">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-2xl md:text-4xl lg:text-5xl tracking-tighter text-primary/90 font-display leading-[0.9] mb-3">
              {title}
            </h1>
          )}
          {headerActions && (
            <div className="mt-4 md:mt-8 w-full flex justify-center">

              {headerActions}
            </div>
          )}
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0, y: settings.reduceAnimations ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: settings.reduceAnimations ? 0.1 : 1, 
          ease: settings.reduceAnimations ? "linear" : [0.16, 1, 0.3, 1] 
        }}
        className={cn("w-full mx-auto", maxW, className)}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ContemplativeLayout;
