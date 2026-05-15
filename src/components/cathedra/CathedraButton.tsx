import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, icon, children, ...props }, ref) => {
    const sizeMap = {
      sm: 'px-6 py-2.5 text-[10px] sm:text-[11px]',
      md: 'px-10 py-4 text-[11px] sm:text-[12px]',
      lg: 'px-12 py-5 text-[12px] sm:text-[14px]',
      xl: 'px-14 py-6 text-[14px] sm:text-[16px]',
    };

    const variantStyles = {
      primary: 'btn-premium-primary',
      default: 'btn-premium-primary',
      secondary: 'btn-premium-secondary',
      outline: 'btn-premium-outline',
      ghost: 'bg-transparent hover:bg-primary/[0.03] text-primary/70 hover:text-primary transition-all rounded-full px-8 py-4 font-bold uppercase tracking-[0.2em] text-[10px]',
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

Button.displayName = "Button";

export { CathedraButton   };
