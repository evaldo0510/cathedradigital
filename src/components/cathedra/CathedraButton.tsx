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
      md: 'px-8 h-14 text-[10px] sm:text-[10.5px]',
      lg: 'px-12 h-16 text-[11px] sm:text-[12px]',
      xl: 'px-14 h-20 text-[12.5px] sm:text-[14px]',
    };

    const variantStyles = {
      primary: 'btn-premium-primary',
      secondary: 'btn-premium-secondary',
      outline: 'btn-premium-outline',
      ghost: 'btn-premium-ghost',
    };

    return (
      <motion.button
        ref={ref as any}
        whileTap={settings.reduceAnimations ? {} : { scale: 0.96 }}
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
