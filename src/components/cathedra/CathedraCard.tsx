import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface CardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'interactive' | 'outline' | 'glass' | 'ghost' | 'elevated';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const paddingMap = {
      none: '',
      xs: 'p-3 md:p-4',
      sm: 'p-4 md:p-6',
      md: 'p-6 md:p-8',
      lg: 'p-8 md:p-12 lg:p-16',
      xl: 'p-12 md:p-16 lg:p-24',
      '2xl': 'p-16 md:p-24 lg:p-32',
    };

    const variantStyles = {
      default: 'premium-card',
      interactive: 'premium-card-interactive group',
      outline: 'bg-transparent border border-border/40 rounded-premium',
      glass: 'bg-background/40 backdrop-blur-xl border border-white/[0.05] rounded-premium shadow-premium',
      ghost: 'bg-transparent border border-transparent rounded-premium hover:bg-primary/[0.01]',
      elevated: 'premium-card shadow-premium-subtle hover:shadow-premium transition-all duration-700',
    };

    return (
      <motion.div
        ref={ref as any}
        className={cn(
          variantStyles[variant],
          paddingMap[padding],
          hover && !variant.includes('interactive') && 'hover:shadow-premium-hover hover:border-primary/20 transition-all duration-500',
          className
        )}
        initial={props.initial || { opacity: 0, y: 15 }}
        animate={props.animate || { opacity: 1, y: 0 }}
        transition={props.transition || { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-0 mb-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-2xl font-display font-bold leading-none tracking-tight text-primary", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground font-medium", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-0 mt-6", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent };