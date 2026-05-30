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
      "flex flex-col gap-2 md:gap-8 header-margin-rhythm items-center",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-6 md:h-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-10" />
      <h2 className="text-[7px] md:text-[11px] font-bold uppercase tracking-[0.6em] md:tracking-[0.8em] text-primary opacity-15">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/40 text-[12px] md:text-xl lg:text-2xl max-w-2xl leading-relaxed tracking-widest px-6 md:px-8">
          {subtitle}
        </p>
      )}
    </div>
  );
};
