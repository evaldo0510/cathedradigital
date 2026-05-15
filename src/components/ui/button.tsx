import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-premium-tiny font-bold uppercase tracking-[0.2em] transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[1.25em] active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium hover:shadow-premium-hover",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium hover:shadow-premium-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-premium hover:shadow-premium-hover",
        outline:
          "border border-border/60 bg-transparent text-foreground hover:bg-muted/30 hover:border-primary/20 hover:shadow-soft",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-premium hover:shadow-premium-hover",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 px-8 py-3 text-premium-base [&_svg]:size-5",
        sm: "h-10 px-4 text-premium-small [&_svg]:size-4",
        xs: "h-8 px-3 text-premium-tiny [&_svg]:size-3.5",
        lg: "h-16 px-12 text-premium-base [&_svg]:size-6",
        icon: "h-12 w-12 p-0 flex items-center justify-center [&_svg]:size-5",
        "icon-sm": "h-10 w-10 p-0 flex items-center justify-center [&_svg]:size-4",
        "icon-xs": "h-8 w-8 p-0 flex items-center justify-center [&_svg]:size-3.5",
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
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Accessibility: aria-busy and aria-disabled for loading state
    const buttonProps = {
      className: cn(buttonVariants({ variant, size, className })),
      ref,
      disabled: isLoading || disabled,
      "aria-busy": isLoading ? true : undefined,
      "aria-disabled": (isLoading || disabled) ? true : undefined,
      ...props,
    };

    return (
      <Comp {...buttonProps}>
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {size !== "icon" && size !== "icon-sm" && size !== "icon-xs" && children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };