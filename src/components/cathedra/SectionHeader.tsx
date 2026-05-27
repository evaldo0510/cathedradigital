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
      "flex flex-col gap-8 mb-20 md:mb-32 lg:mb-40",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent opacity-60" />
      <h2 className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.7em] text-primary/40 whitespace-nowrap leading-none">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/30 text-lg md:text-xl lg:text-2xl max-w-3xl leading-relaxed tracking-wider px-8">
          {subtitle}
        </p>
      )}
    </div>
  );
};
