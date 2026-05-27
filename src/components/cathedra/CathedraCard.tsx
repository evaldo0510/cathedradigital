import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";

interface CathedraCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'interactive' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hover?: boolean;
}

const CathedraCard = React.forwardRef<HTMLDivElement, CathedraCardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const { settings } = useReadingSettings();
    const paddingMap = {
      none: '',
      sm: 'p-5 sm:p-6 md:p-8',
      md: 'p-6 sm:p-10 md:p-12',
      lg: 'p-8 sm:p-12 md:p-16',
      xl: 'p-10 sm:p-16 md:p-24',
      '2xl': 'p-12 sm:p-24 md:p-32 lg:p-40',
    };

    const variantStyles = {
      default: 'premium-card',
      interactive: 'premium-card-interactive',
      outline: 'bg-transparent border border-border/30 rounded-premium',
      glass: 'bg-background/40 backdrop-blur-xl border border-white/10 rounded-premium shadow-premium',
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
        initial={settings.reduceAnimations ? { opacity: 1, y: 0 } : (props.initial || { opacity: 0, y: 15 })}
        animate={props.animate || { opacity: 1, y: 0 }}
        transition={settings.reduceAnimations ? { duration: 0.1 } : (props.transition || { duration: 0.6, ease: [0.22, 1, 0.36, 1] })}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CathedraCard.displayName = "CathedraCard";

export { CathedraCard };
