import React from 'react';
import { cn } from "@/lib/utils";

type Spacing = '0' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  p?: Spacing;
  px?: Spacing;
  py?: Spacing;
  pt?: Spacing;
  pb?: Spacing;
  pl?: Spacing;
  pr?: Spacing;
  m?: Spacing;
  mx?: Spacing;
  my?: Spacing;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'premium' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'premium' | 'premium-hover';
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

export const Box = ({
  p, px, py, pt, pb, pl, pr,
  m, mx, my,
  rounded,
  shadow,
  className,
  children,
  ...props
}: BoxProps) => {
  const classes = cn(
    p && `p-spacing-${p}`,
    px && `px-spacing-${px}`,
    py && `py-spacing-${py}`,
    pt && `pt-spacing-${pt}`,
    pb && `pb-spacing-${pb}`,
    pl && `pl-spacing-${pl}`,
    pr && `pr-spacing-${pr}`,
    m && `m-spacing-${m}`,
    mx && `mx-spacing-${mx}`,
    my && `my-spacing-${my}`,
    rounded && `rounded-premium${rounded === 'premium' ? '' : `-${rounded}`}`,
    shadow && `shadow-premium${shadow === 'premium' ? '' : `-${shadow}`}`,
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
