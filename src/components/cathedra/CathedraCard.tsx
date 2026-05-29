import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";
import { useIsMobile } from "@/hooks/useIsMobile";

interface CathedraCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'interactive' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hover?: boolean;
}

const CathedraCard = React.forwardRef<HTMLDivElement, CathedraCardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const { settings } = useReadingSettings();
    const isMobile = useIsMobile();
    
    const paddingMap = {
      none: '',
      sm: 'p-3 md:p-6',
      md: 'padding-rhythm',
      lg: 'p-8 md:p-16',
      xl: 'p-10 md:p-24',
      '2xl': 'p-6 md:p-32 lg:p-40', // Reduced mobile padding for 2xl
    };

    const variantStyles = {
      default: 'premium-card',
      interactive: 'premium-card-interactive',
      outline: 'bg-transparent border border-primary/5 rounded-premium',
      glass: cn(
        'bg-background/20 border border-primary/5 rounded-premium shadow-premium',
        isMobile ? 'backdrop-blur-md' : 'backdrop-blur-xl'
      ),
    };

    // Optimization: Avoid heavy filters and long transitions on mobile
    const initialProps = React.useMemo(() => {
      if (settings.reduceAnimations) return { opacity: 1, scale: 1 };
      if (isMobile) return { opacity: 0, y: 10 };
      return props.initial || { opacity: 0, scale: 1, y: 5, filter: 'blur(15px)' };
    }, [settings.reduceAnimations, isMobile, props.initial]);

    const animateProps = React.useMemo(() => {
      if (isMobile) return { opacity: 1, y: 0 };
      return props.animate || { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' };
    }, [isMobile, props.animate]);

    const transitionProps = React.useMemo(() => {
      if (settings.reduceAnimations) return { duration: 0.1 };
      if (isMobile) return { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any };
      return props.transition || { duration: 1.8, ease: [0.22, 1, 0.36, 1] as any };
    }, [settings.reduceAnimations, isMobile, props.transition]);


    return (
      <motion.div
        ref={ref as any}
        className={cn(
          variantStyles[variant],
          paddingMap[padding],
          hover && variant === 'default' && 'hover:shadow-premium-hover hover:border-primary/10 hover:-translate-y-0.5 transition-premium-slow',
          className
        )}
        initial={initialProps}
        animate={animateProps}
        transition={transitionProps}
        whileHover={settings.reduceAnimations || isMobile ? {} : { y: -1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CathedraCard.displayName = "CathedraCard";

export { CathedraCard };

