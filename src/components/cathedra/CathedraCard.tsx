import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";

interface CathedraCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'interactive' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hover?: boolean;
  as?: any;
}

const CathedraCard = React.forwardRef<HTMLDivElement, CathedraCardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, as: Component = motion.div, children, ...props }, ref) => {
    const { settings } = useReadingSettings();
    
    const paddingMap = {
      none: '',
      sm: 'p-spacing-sm md:p-spacing-lg',
      md: 'p-spacing-md md:p-spacing-xl',
      lg: 'p-spacing-lg md:p-spacing-2xl',
      xl: 'p-spacing-xl md:p-spacing-3xl',
      '2xl': 'p-spacing-2xl md:p-spacing-4xl',
    };

    const variantStyles = {
      default: 'bg-card/30 backdrop-blur-sm border border-primary/[0.02] dark:border-white/[0.005] shadow-premium',
      interactive: 'bg-card/30 backdrop-blur-sm border border-primary/[0.02] dark:border-white/[0.005] shadow-premium hover:shadow-premium-hover hover:border-primary/5 hover:bg-primary/[0.005] active:scale-[0.995] cursor-pointer',
      outline: 'bg-transparent border border-primary/[0.05] dark:border-white/[0.01]',
      glass: 'bg-white/[0.01] dark:bg-black/[0.01] backdrop-blur-2xl border border-white/[0.02] dark:border-white/[0.005] shadow-none',
    };

    return (
      <Component
        ref={ref as any}
        className={cn(
          "relative overflow-hidden transition-all duration-500 rounded-premium premium-card",
          variantStyles[variant],
          paddingMap[padding],
          (hover || variant === 'interactive') && "transition-all duration-500",
          "focus-within:ring-2 focus-within:ring-primary/10 focus-within:ring-offset-1 outline-none",
          className
        )}
        initial={settings.reduceAnimations ? { opacity: 1 } : (props.initial || { opacity: 0, y: 10 })}
        animate={props.animate || { opacity: 1, y: 0 }}
        transition={settings.reduceAnimations ? { duration: 0.1 } : (props.transition || { duration: 0.6, ease: [0.16, 1, 0.3, 1] })}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CathedraCard.displayName = "CathedraCard";

export { CathedraCard };
