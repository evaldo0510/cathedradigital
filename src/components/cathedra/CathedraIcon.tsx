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

/**
 * Standardized icon sizes across breakpoints:
 * - xs: 12px mobile -> 14px desktop
 * - sm: 16px mobile -> 20px desktop
 * - md: 20px mobile -> 24px desktop
 * - lg: 32px mobile -> 40px desktop
 * - xl: 48px mobile -> 64px desktop
 */
const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3 md:w-3.5 md:h-3.5',
  sm: 'w-4 h-4 md:w-5 md:h-5',
  md: 'w-5 h-5 md:w-6 md:h-6',
  lg: 'w-8 h-8 md:w-10 md:h-10',
  xl: 'w-12 h-12 md:w-16 md:h-16',
};

const containerSizeMap: Record<IconSize, string> = {
  xs: 'w-6 h-6 md:w-7 md:h-7',
  sm: 'w-8 h-8 md:w-10 md:h-10',
  md: 'w-10 h-10 md:w-12 md:h-12',
  lg: 'w-16 h-16 md:w-20 md:h-20',
  xl: 'w-24 h-24 md:w-32 md:h-32',
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
      "flex items-center justify-center rounded-premium-sm bg-primary/5 border border-border/10 transition-all duration-300",
      containerSizeMap[size],
      containerClassName
    )}>
      <Icon 
        className={cn(sizeMap[size], variantStyles[variant], className)} 
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    </div>
  );
};

// Utility to enforce sizes in other components
export const IconSizePreset = {
  NAV: 'sm' as IconSize,
  SIDEBAR: 'md' as IconSize,
  CARD_HEADER: 'md' as IconSize,
  HERO: 'lg' as IconSize,
  ACTION: 'sm' as IconSize,
  FOOTER: 'sm' as IconSize,
  BADGE: 'xs' as IconSize,
  TINY: 'xs' as IconSize,
};
