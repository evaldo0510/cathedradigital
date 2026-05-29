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
      "flex flex-col gap-6 md:gap-8 mb-10 md:mb-32 lg:mb-40 items-center",
      align === 'center' ? "items-center text-center" : "items-start text-left",
      className
    )}>
      <div className="w-px h-12 md:h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent opacity-60" />
      <h2 className="h5">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-muted-foreground/60 text-base md:text-xl lg:text-2xl max-w-3xl leading-relaxed tracking-wider px-6 md:px-8">
          {subtitle}
        </p>
      )}
    </div>
  );
};
