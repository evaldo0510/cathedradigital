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
      sm: 'p-3 md:p-6',
      md: 'p-5 md:p-10',
      lg: 'p-8 md:p-16',
      xl: 'p-10 md:p-24',
      '2xl': 'p-12 md:p-32 lg:p-40',
    };

    const variantStyles = {
      default: 'premium-card',
      interactive: 'premium-card-interactive',
      outline: 'bg-transparent border border-primary/10 rounded-premium',
      glass: 'bg-background/40 backdrop-blur-xl border border-primary/10 rounded-premium shadow-premium',
    };

    return (
      <motion.div
        ref={ref as any}
        className={cn(
          variantStyles[variant],
          paddingMap[padding],
          hover && variant === 'default' && 'hover:shadow-premium-hover hover:border-primary/10 hover:-translate-y-1 transition-premium',
          className
        )}
        initial={settings.reduceAnimations ? { opacity: 1, y: 0 } : (props.initial || { opacity: 0, y: 30, filter: 'blur(10px)' })}
        animate={props.animate || { opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={settings.reduceAnimations ? { duration: 0.1 } : (props.transition || { duration: 1.2, ease: [0.16, 1, 0.3, 1] })}
        whileHover={settings.reduceAnimations ? {} : { y: -4, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CathedraCard.displayName = "CathedraCard";

export { CathedraCard };
