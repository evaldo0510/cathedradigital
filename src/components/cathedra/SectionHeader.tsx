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
      "flex flex-col gap-5 mb-14 md:mb-20",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      <h2 className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.8em] text-primary/20 whitespace-nowrap">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/30 text-base md:text-xl max-w-2xl leading-relaxed tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  );
};
