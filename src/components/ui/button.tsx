import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 shadow-sm hover:shadow-xl hover:translate-y-[-1px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/10 hover:shadow-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/10 hover:shadow-destructive/20",
        outline:
          "border border-border/60 bg-white dark:bg-black/20 text-foreground hover:bg-primary/5 hover:border-primary/30",
        secondary:
          "bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20",
        ghost: "hover:bg-primary/5 hover:text-primary",
        link: "text-primary underline-offset-8 hover:underline decoration-primary/30 decoration-2",
      },
      size: {
        default: "h-14 px-8 py-3",
        sm: "h-10 px-4 text-xs",
        lg: "h-16 px-12 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
