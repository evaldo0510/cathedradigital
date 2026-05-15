import React from 'react';
import { cn } from "@/lib/utils";

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CathedraIconProps {
  icon: React.ElementType;
  size?: IconSize;
  className?: string;
  containerClassName?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  strokeWidth?: number;
}

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const containerSizeMap: Record<IconSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const variantStyles = {
  default: 'text-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground/60',
};

export const CathedraIcon: React.FC<CathedraIconProps> = ({
  icon: Icon,
  size = 'md',
  className,
  containerClassName,
  variant = 'default',
  strokeWidth = 1.5,
}) => {
  return (
    <div className={cn(
      "flex items-center justify-center rounded-premium-sm bg-primary/5 border border-border/10",
      containerSizeMap[size],
      containerClassName
    )}>
      <Icon 
        className={cn(sizeMap[size], variantStyles[variant], className)} 
        strokeWidth={strokeWidth}
      />
    </div>
  );
};
