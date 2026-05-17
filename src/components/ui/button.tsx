import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-[24px] text-premium-tiny font-bold uppercase tracking-[0.3em] transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-premium",
        outline:
          "border border-white/10 bg-transparent text-foreground hover:bg-white/5",
        secondary:
          "bg-white/5 text-primary border border-white/10 hover:bg-white/10 shadow-premium",
        ghost: "hover:bg-primary/5 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[52px] px-10",
        sm: "h-11 px-6 text-[9px]",
        xs: "h-9 px-4 text-[8px]",
        lg: "h-14 px-12 text-premium-small",
        icon: "h-12 w-12 p-0 flex items-center justify-center",
        "icon-sm": "h-10 w-10 p-0 flex items-center justify-center",
        "icon-xs": "h-8 w-8 p-0 flex items-center justify-center",
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