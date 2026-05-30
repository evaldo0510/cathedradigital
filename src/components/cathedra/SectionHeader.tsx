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
      "flex flex-col gap-2 md:gap-12 header-margin-rhythm items-center",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-8 md:h-32 bg-gradient-to-b from-transparent via-primary/10 to-transparent opacity-10" />
      <h2 className="text-[7px] md:text-[12px] font-bold uppercase tracking-[1em] md:tracking-[1.2em] text-primary opacity-20">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/30 text-[11px] md:text-xl lg:text-2xl max-w-xl leading-relaxed tracking-widest px-6 md:px-8">
          {subtitle}
        </p>
      )}
    </div>
  );
};
