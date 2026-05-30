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

const CathedraButton = React.memo(React.forwardRef<HTMLButtonElement, CathedraButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, icon, children, ...props }, ref) => {
    const { settings } = useReadingSettings();
    const sizeMap = {
      sm: 'px-spacing-lg h-spacing-xl text-[9px] md:text-[10px]',
      md: 'px-spacing-xl h-spacing-2xl text-[10px] md:text-[11px]',
      lg: 'px-spacing-2xl h-spacing-2xl text-[11px] md:text-[12px]',
      xl: 'px-spacing-3xl h-18 text-[12px] md:text-[16px]',
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
        whileHover={settings.reduceAnimations ? {} : { y: -1, transition: { duration: 0.2, ease: "easeOut" } }}
        className={cn(
          variantStyles[variant],
          sizeMap[size],
          isLoading && 'opacity-70 cursor-wait',
          className
        )}
        {...(props as any)}
      >
        {isLoading ? (
          <div className="w-spacing-md h-spacing-md border-2 border-current border-t-transparent rounded-premium-full animate-spin" />
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </motion.button>
    );
  }
));

CathedraButton.displayName = "CathedraButton";

export { CathedraButton };