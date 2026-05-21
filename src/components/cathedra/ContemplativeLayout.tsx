import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  maxW = 'max-w-[85ch]'
}) => {
  return (
    <div className={cn("min-h-screen pt-24 md:pt-32 pb-48", className)}>
      {(title || subtitle) && (
        <header className="mb-20 md:mb-32 px-6 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-px h-16 bg-primary/10 mx-auto mb-10" />
          {subtitle && (
            <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-primary/30 mb-6">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary tracking-tighter">
              {title}
            </h1>
          )}
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn("mx-auto px-6", maxW)}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default ContemplativeLayout;
