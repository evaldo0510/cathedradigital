import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";

interface CathedraButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const CathedraButton = React.forwardRef<HTMLButtonElement, CathedraButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, icon, children, ...props }, ref) => {
    const { settings } = useReadingSettings();
    const sizeMap = {
      sm: 'px-6 h-10 text-[9.5px]',
      md: 'px-8 h-14 text-[10.5px]',
      lg: 'px-10 h-16 text-[12px]',
      xl: 'px-12 h-20 text-[14px]',
    };

    const variantStyles = {
      primary: 'btn-premium-primary',
      secondary: 'btn-premium-secondary',
      outline: 'btn-premium-outline',
      ghost: 'bg-transparent hover:bg-primary/[0.02] text-primary/70 hover:text-primary transition-all rounded-full px-6 py-3 font-bold uppercase tracking-[0.2em] text-[10px]',
    };

    return (
      <motion.button
        ref={ref as any}
        whileTap={{ scale: 0.96 }}
        className={cn(
          variantStyles[variant],
          sizeMap[size],
          isLoading && 'opacity-70 cursor-wait',
          className
        )}
        {...(props as any)}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </motion.button>
    );
  }
);

CathedraButton.displayName = "CathedraButton";

export { CathedraButton };
