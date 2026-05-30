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
      "flex flex-col gap-1 md:gap-4 header-margin-rhythm items-center",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <h2 className="text-[8px] md:text-[11px] font-black uppercase tracking-[1.2em] md:tracking-[1.5em] text-primary/20">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/30 text-[12px] md:text-xl lg:text-3xl max-w-2xl leading-relaxed tracking-[0.05em] px-6 md:px-12 transition-all duration-1000">
          {subtitle}
        </p>
      )}
    </div>
  );
};
