import React from 'react';
import { cn } from "@/lib/utils";

type Spacing = '0' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: Spacing;
  className?: string;
  children?: React.ReactNode;
}

export const Grid = ({
  cols = 1,
  gap = 'md',
  className,
  children,
  ...props
}: GridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12',
  };

  const classes = cn(
    'grid',
    gridCols[cols],
    gap && `gap-spacing-${gap}`,
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
