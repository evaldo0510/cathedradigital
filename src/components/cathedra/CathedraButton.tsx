import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'xs' | 'icon-xs';
  isLoading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, icon, children, asChild = false, ...props }, ref) => {
    const sizeMap: Record<string, string> = {
      xs: 'px-4 h-8 text-[8px]',
      sm: 'px-6 h-10 text-[9px]',
      md: 'px-8 h-12 text-[10px]',
      lg: 'px-10 h-12 text-[11px]',
      xl: 'px-12 h-14 text-[12px]',
      icon: 'h-11 w-11 p-0 flex items-center justify-center rounded-full',
      'icon-xs': 'h-9 w-9 p-0 flex items-center justify-center rounded-full',
    };

    const variantStyles: Record<string, string> = {
      primary: 'btn-premium-primary',
      default: 'btn-premium-primary',
      secondary: 'btn-premium-secondary',
      outline: 'btn-premium-outline',
      ghost: 'bg-transparent hover:bg-primary/[0.03] text-primary/70 hover:text-primary transition-all rounded-[24px] px-8 h-12 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[24px] font-bold uppercase tracking-widest text-[10px] h-12 flex items-center justify-center gap-4',
      link: 'text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto font-medium',
    };

    const Comp = asChild ? Slot : motion.button;
    
    // motion props only work on motion elements
    const motionProps = asChild ? {} : {
      whileTap: { scale: 0.96 }
    };

    return (
      <Comp
        ref={ref as any}
        className={cn(
          variantStyles[variant] || variantStyles.primary,
          sizeMap[size] || sizeMap.md,
          isLoading && 'opacity-70 cursor-wait',
          className
        )}
        {...motionProps}
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
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, Button as CathedraButton };
