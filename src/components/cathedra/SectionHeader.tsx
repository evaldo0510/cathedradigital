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
      "flex flex-col gap-6 mb-16 md:mb-24",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/40 text-base md:text-xl max-w-2xl leading-relaxed tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  );
};
