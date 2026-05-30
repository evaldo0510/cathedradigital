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
      "flex flex-col gap-3 md:gap-8 header-margin-rhythm items-center",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-6 md:h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent opacity-40" />
      <h2 className="text-[8px] md:text-[11px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary opacity-30">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/60 text-[12px] md:text-xl lg:text-2xl max-w-3xl leading-relaxed tracking-wider px-6 md:px-8">
          {subtitle}
        </p>
      )}
    </div>
  );
};
