import React from 'react';
import { cn } from "@/lib/utils";

type PremiumSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'display' | 'serif' | 'reader' | 'ui';
  size?: PremiumSize;
  weight?: 'light' | 'normal' | 'medium' | 'semibold';
  italic?: boolean;
  className?: string;
  children?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

export const Typography = ({
  variant = 'ui',
  size = 'base',
  weight = 'normal',
  italic = false,
  className,
  children,
  as: Component = 'p',
  ...props
}: TypographyProps) => {
  const classes = cn(
    `font-${variant}`,
    `text-premium-${size}`,
    `font-${weight}`,
    italic && 'italic',
    className
  );

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};
