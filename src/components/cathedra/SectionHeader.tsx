import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'center' | 'left';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  className,
  align = 'center'
}) => {
  return (
    <div className={cn(
      "flex flex-col gap-spacing-xs md:gap-spacing-md header-margin-rhythm items-center",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <h2 className="text-[10px] md:text-premium-xs font-semibold uppercase tracking-premium-widest text-primary/30">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/40 text-premium-base md:text-premium-2xl max-w-spacing-2xl leading-relaxed tracking-premium-wide px-spacing-md md:px-spacing-xl transition-all duration-1000">
          {subtitle}
        </p>
      )}
    </div>
  );
};
