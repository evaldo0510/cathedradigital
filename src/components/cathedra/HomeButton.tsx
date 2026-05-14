import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const homeButtonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium hover:shadow-premium-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-premium hover:shadow-premium-hover",
        outline: "border border-border/60 bg-transparent text-foreground hover:bg-muted/30 hover:border-primary/20 hover:shadow-soft",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
      },
      size: {
        default: "h-14 px-8 py-3",
        sm: "h-10 px-4 text-[9px]",
        lg: "h-16 px-12 text-xs",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface HomeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof homeButtonVariants> {
  asChild?: boolean;
}

const HomeButton = React.forwardRef<HTMLButtonElement, HomeButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(homeButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
HomeButton.displayName = "HomeButton";

export { HomeButton, homeButtonVariants };
