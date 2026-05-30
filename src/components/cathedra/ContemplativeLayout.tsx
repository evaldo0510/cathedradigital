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
  maxW = 'max-w-[1200px]',
  headerActions,
  icon: Icon
}) => {
  const { settings } = useReadingSettings();
  
  return (
    <div className={cn("min-h-screen pt-2 md:pt-8 pb-12 md:pb-64 will-change-[transform,opacity]", className)}>


      {(title || subtitle || Icon) && (
        <header className={cn("header-margin-rhythm px-4 md:px-12 text-center flex flex-col items-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-4 duration-[1000ms] ease-out")}>
          {Icon && (
            <div className="mb-4 md:mb-6">
              <Icon className="w-5 h-5 md:w-8 md:h-8 text-primary opacity-20 mx-auto" strokeWidth={1} />
            </div>
          )}
          <div className="w-[0.5px] h-3 md:h-12 bg-gradient-to-b from-transparent via-primary/5 to-transparent mx-auto mb-2 md:mb-6 opacity-20" />
          {subtitle && (
            <p className="text-[6px] md:text-[8px] font-bold uppercase text-primary/20 mb-2 md:mb-6 tracking-[0.4em] md:tracking-[0.8em]">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-2xl md:text-6xl lg:text-7xl tracking-tighter text-primary/80 font-display leading-[0.95] mb-4">
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
