import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-xs whitespace-nowrap rounded-full font-ui font-medium uppercase tracking-premium-widest transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/95 shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/95 shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-premium",
        outline:
          "border border-primary/10 bg-transparent text-primary hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10 hover:-translate-y-0.5",
        ghost: "hover:bg-primary/[0.02] hover:text-primary text-primary/60",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 px-xl text-xs [&_svg]:size-5",
        sm: "h-11 px-lg text-[10px] [&_svg]:size-4",
        xs: "h-9 px-md text-[9px] [&_svg]:size-3.5",
        lg: "h-16 px-2xl text-sm [&_svg]:size-6",
        xl: "h-20 px-3xl text-base [&_svg]:size-7",
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