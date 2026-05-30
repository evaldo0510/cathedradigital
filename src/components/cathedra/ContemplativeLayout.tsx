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
    <div className={cn("min-h-screen pt-4 md:pt-48 pb-12 md:pb-96 will-change-[transform,opacity]", className)}>


      {(title || subtitle || Icon) && (
        <header className={cn("header-margin-rhythm px-6 md:px-12 text-center flex flex-col items-center", !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-12 duration-[2000ms] ease-out")}>
          {Icon && (
            <div className="mb-8 md:mb-12">
              <Icon className="w-8 h-8 md:w-12 md:h-12 text-primary opacity-30 mx-auto" strokeWidth={1} />
            </div>
          )}
          <div className="w-[0.5px] h-6 md:h-32 bg-gradient-to-b from-transparent via-primary/10 to-transparent mx-auto mb-6 md:mb-16 opacity-30" />
          {subtitle && (
            <p className="text-[7px] md:text-[10px] font-bold uppercase text-primary/30 mb-6 md:mb-16 tracking-[0.6em] md:tracking-[1.2em]">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-4xl md:text-9xl lg:text-[8.5rem] tracking-tight text-primary/90 font-display leading-[0.85] filter blur-[0.2px] mb-8">
              {title}
            </h1>
          )}
          {headerActions && (
            <div className="mt-8 md:mt-16 w-full flex justify-center">
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
