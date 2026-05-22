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
      "flex flex-col gap-4 mb-12",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-12 bg-primary/10" />
      <h2 className="text-[10px] font-bold uppercase tracking-[0.8em] text-primary/20 whitespace-nowrap">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/40 text-sm max-w-md">
          {subtitle}
        </p>
      )}
    </div>
  );
};
