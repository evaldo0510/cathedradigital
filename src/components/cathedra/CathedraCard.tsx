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
      sm: 'p-3 md:p-6',
      md: 'padding-rhythm',
      lg: 'p-8 md:p-16',
      xl: 'p-10 md:p-24',
      '2xl': 'p-12 md:p-32 lg:p-40',
    };

    const variantStyles = {
      default: 'premium-card bg-transparent border-none will-change-[transform,opacity]',
      interactive: 'premium-card-interactive bg-transparent hover:bg-primary/[0.01] border-transparent will-change-[transform,opacity]',
      outline: 'bg-transparent border border-primary/[0.01] dark:border-white/[0.005] rounded-premium will-change-[transform,opacity] transition-all duration-1000',
      glass: 'bg-primary/[0.002] backdrop-blur-md border border-white/[0.005] dark:border-white/[0.002] rounded-premium shadow-none will-change-[transform,opacity] transition-all duration-1000',
    };

    const isClickable = props.onClick || variant === 'interactive';

    return (
      <Component
        ref={ref as any}
        className={cn(
          variantStyles[variant],
          paddingMap[padding],
          hover && variant === 'default' && 'hover:shadow-premium-hover hover:border-primary/10 hover:-translate-y-1 transition-premium',
          "focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:border-primary/20 outline-none focus-visible:ring-primary/40 focus-visible:ring-offset-2",
          className
        )}
        initial={settings.reduceAnimations ? { opacity: 1, scale: 1 } : (props.initial || { opacity: 0, scale: 0.998, y: 5, filter: 'blur(4px)' })}
        animate={props.animate || { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={settings.reduceAnimations ? { duration: 0.1 } : (props.transition || { duration: 0.4, ease: "easeOut" })}
        whileHover={settings.reduceAnimations ? {} : { y: -1, transition: { duration: 0.2, ease: "easeOut" } }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CathedraCard.displayName = "CathedraCard";

export { CathedraCard };
