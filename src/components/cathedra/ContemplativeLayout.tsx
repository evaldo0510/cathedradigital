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
  maxW = 'max-w-spacing-4xl w-[var(--layout-content-width-mobile)] md:w-full',
  headerActions,
  icon: Icon,
  showPadding = true
}) => {
  const { settings } = useReadingSettings();
  
  return (
    <div 
      data-layout-root="true"
      className={cn(
        "min-h-[100dvh] will-change-[transform,opacity] flex flex-col items-center overflow-x-hidden", 
        showPadding && "pt-[calc(var(--layout-padding-mobile)*0.5)] md:pt-[calc(var(--layout-padding)*2)] pb-[calc(var(--layout-padding)*3)] px-0 md:px-[var(--layout-padding)]",
        containerClassName
      )}
    >
      {(title || subtitle || Icon) && (
        <header className={cn(
          "header-margin-rhythm px-spacing-md md:px-spacing-xl text-center flex flex-col items-center w-full", 
          !settings.reduceAnimations && "animate-in fade-in slide-in-from-top-spacing-md duration-1000 ease-out"
        )}>
          {Icon && (
            <div className="mb-spacing-sm md:mb-spacing-lg">
              <Icon className="w-spacing-md h-spacing-md md:w-spacing-xl md:h-spacing-xl text-primary/20 mx-auto transition-all duration-1000 group-hover:text-primary/40 group-hover:scale-110" strokeWidth={1.2} size={20} aria-hidden="true" />
            </div>
          )}
          {subtitle && (
            <p className="text-[8px] md:text-[10px] font-semibold uppercase text-primary/10 mb-spacing-sm md:mb-spacing-lg tracking-premium-widest md:tracking-[1.2em] transition-all duration-1000">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="mb-spacing-md">
              {title}
            </h1>
          )}
          {headerActions && (
            <div className="mt-spacing-md md:mt-spacing-xl w-full flex justify-center">
              {headerActions}
            </div>
          )}
        </header>
      )}
      <motion.main 
        data-layout-container="true"
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
