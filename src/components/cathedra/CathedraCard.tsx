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
      md: 'padding-rhythm',
      lg: 'p-8 md:p-16',
      xl: 'p-10 md:p-24',
      '2xl': 'p-12 md:p-32 lg:p-40',
    };

    const variantStyles = {
      default: 'premium-card dark:bg-primary/[0.01] dark:border-transparent hover:dark:border-primary/[0.05] will-change-[transform,opacity]',
      interactive: 'premium-card-interactive dark:bg-primary/[0.005] dark:hover:bg-primary/[0.02] dark:border-transparent dark:hover:border-primary/[0.05] will-change-[transform,opacity]',
      outline: 'bg-transparent border border-primary/[0.01] dark:border-primary/[0.02] rounded-premium will-change-[transform,opacity]',
      glass: 'bg-background/10 backdrop-blur-lg border border-primary/[0.01] dark:border-primary/[0.02] rounded-premium shadow-none will-change-[transform,opacity]',
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
        initial={settings.reduceAnimations ? { opacity: 1, scale: 1 } : (props.initial || { opacity: 0, scale: 0.995, y: 10, filter: 'blur(5px)' })}
        animate={props.animate || { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={settings.reduceAnimations ? { duration: 0.1 } : (props.transition || { duration: 0.8, ease: [0.16, 1, 0.3, 1] })}
        whileHover={settings.reduceAnimations ? {} : { y: -2, scale: 1.002, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CathedraCard.displayName = "CathedraCard";

export { CathedraCard };
