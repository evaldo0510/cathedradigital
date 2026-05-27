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
      "flex flex-col gap-4 mb-12 md:mb-16",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      <h2 className="text-[10px] font-black uppercase tracking-[0.8em] text-primary/30 whitespace-nowrap">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/50 text-base md:text-xl max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
