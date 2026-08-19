import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Icons } from "@/constants";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-spacing-xs whitespace-nowrap rounded-premium-full font-ui font-medium uppercase tracking-premium-widest transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97]",
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
          "bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-premium-md shadow-secondary/10 hover:-translate-y-0.5",
        ghost: "hover:bg-primary/[0.02] hover:text-primary text-primary/60",
        link: "text-primary underline-offset-4 hover:underline",
        // Pill variants — padrão editorial Stitch dos leitores premium (Rosário, Via Sacra, Orações).
        // Preservam tipografia stitch-body e cores stitch-secondary; sobrescrevem base uppercase.
        pill: "border border-stitch-outline-variant/40 bg-transparent text-stitch-on-surface-variant font-stitch-body normal-case tracking-widest hover:border-stitch-secondary/50 hover:text-stitch-on-surface shadow-none active:scale-100 hover:-translate-y-0",
        "pill-active": "bg-stitch-secondary text-stitch-secondary-foreground font-stitch-body normal-case tracking-widest border border-transparent hover:bg-stitch-secondary/90 shadow-sm active:scale-100 hover:-translate-y-0",
        "pill-toned": "border border-stitch-secondary/60 bg-stitch-secondary/10 text-stitch-secondary font-stitch-body normal-case tracking-widest hover:bg-stitch-secondary/15 shadow-none active:scale-100 hover:-translate-y-0",
      },
      size: {
        default: "min-h-[44px] shrink-0 h-spacing-2xl px-spacing-xl text-premium-xs [&_svg]:size-spacing-md",
        sm: "min-h-[44px] shrink-0 h-[44px] px-spacing-lg text-[10px] [&_svg]:size-spacing-md",
        xs: "min-h-[44px] shrink-0 h-[44px] px-spacing-md text-[9px] [&_svg]:size-spacing-sm",
        lg: "min-h-[44px] shrink-0 h-spacing-3xl px-spacing-2xl text-premium-sm [&_svg]:size-spacing-lg",
        xl: "min-h-[44px] shrink-0 h-spacing-3xl px-spacing-3xl text-premium-base [&_svg]:size-spacing-lg",
        icon: "min-h-[44px] min-w-[44px] shrink-0 h-spacing-2xl w-spacing-2xl p-spacing-0 flex items-center justify-center [&_svg]:size-spacing-md",
        "icon-sm": "min-h-[44px] min-w-[44px] shrink-0 h-[44px] w-[44px] p-spacing-0 flex items-center justify-center [&_svg]:size-spacing-md",
        "icon-xs": "min-h-[44px] min-w-[44px] shrink-0 h-[44px] w-[44px] p-spacing-0 flex items-center justify-center [&_svg]:size-spacing-sm",

        // Pill sizes — chips/toggles editoriais (alvo de toque mínimo 44px).
        pill: "min-h-[44px] px-4 py-1.5 text-[11px] uppercase [&_svg]:size-3.5 rounded-full",
        "pill-sm": "min-h-[44px] min-w-[44px] h-[44px] w-[44px] p-0 rounded-full [&_svg]:size-3.5",

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
            <Icons.Loader className="animate-spin" />
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