import React from 'react';
import { cn } from "@/lib/utils";
import { Box } from "./Box";

type Spacing = '0' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  gap?: Spacing;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Stack = ({
  direction = 'col',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  children,
  ...props
}: StackProps) => {
  const classes = cn(
    'flex',
    direction === 'row' ? 'flex-row' : 'flex-col',
    gap && `gap-spacing-${gap}`,
    align === 'start' && 'items-start',
    align === 'center' && 'items-center',
    align === 'end' && 'items-end',
    align === 'stretch' && 'items-stretch',
    align === 'baseline' && 'items-baseline',
    justify === 'start' && 'justify-start',
    justify === 'center' && 'justify-center',
    justify === 'end' && 'justify-end',
    justify === 'between' && 'justify-between',
    justify === 'around' && 'justify-around',
    justify === 'evenly' && 'justify-evenly',
    wrap && 'flex-wrap',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const HStack = (props: Omit<StackProps, 'direction'>) => (
  <Stack direction="row" {...props} />
);

export const VStack = (props: Omit<StackProps, 'direction'>) => (
  <Stack direction="col" {...props} />
);
