import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface ContemplativeLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  containerClassName?: string;
  maxW?: string;
  headerActions?: React.ReactNode;
  icon?: React.ElementType;
  showPadding?: boolean;
}

const ContemplativeLayout: React.FC<ContemplativeLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  className,
  containerClassName,
  maxW = 'max-w-[var(--layout-max-width)]',
  headerActions,
  icon: Icon,
  showPadding = true
}) => {
  const { settings } = useReadingSettings();
  
  return (
    <div className={cn(
      "min-h-screen will-change-[transform,opacity] flex flex-col items-center", 
      showPadding && "pt-[var(--layout-padding)] md:pt-[calc(var(--layout-padding)*2)] pb-[calc(var(--layout-padding)*3)] px-[var(--layout-padding-mobile)] md:px-[var(--layout-padding)]",
      containerClassName
    )}>
      {(title || subtitle || Icon) && (
        <header className={cn(
          "header-margin-rhythm px-4 md:px-12 text-center flex flex-col items-center w-full", 
          !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-4 duration-[1000ms] ease-out"
        )}>
          {Icon && (
            <div className="mb-4 md:mb-6">
              <Icon className="w-5 h-5 md:w-8 md:h-8 text-primary/20 mx-auto transition-all duration-1000 group-hover:text-primary/40 group-hover:scale-110" strokeWidth={0.3} />
            </div>
          )}
          {subtitle && (
            <p className="text-[8px] md:text-[10px] font-black uppercase text-primary/10 mb-3 md:mb-6 tracking-[0.6em] md:tracking-[1.2em] transition-all duration-1000">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-3xl md:text-5xl lg:text-6xl tracking-tighter text-primary font-display leading-[1.1] mb-4">
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
