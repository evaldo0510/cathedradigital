import * as React from "react";
import { CathedraButton } from "./CathedraButton";
import { type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export interface HomeButtonProps extends ButtonProps {
  // Keeping this interface to allow future extensions
  _member?: never;
}

const HomeButton = React.forwardRef<HTMLButtonElement, HomeButtonProps>(
  ({ variant, size, children, className, ...props }, ref) => {
    // Map existing Shadcn variants to Cathedra variants
    const vMap: Record<string, any> = {
      default: 'primary',
      secondary: 'secondary',
      outline: 'outline',
      ghost: 'ghost',
    };
    
    const sMap: Record<string, any> = {
      default: 'md',
      sm: 'sm',
      lg: 'lg',
      icon: 'sm',
    };

    // Filter props to avoid motion conflicts
    const filteredProps = { ...props };
    delete (filteredProps as any).onAnimationStart;
    delete (filteredProps as any).onDrag;
    delete (filteredProps as any).onDragEnd;
    delete (filteredProps as any).onDragStart;

    return (
      <CathedraButton
        ref={ref}
        variant={vMap[variant as string] || 'primary'}
        size={size === 'lg' ? 'lg' : (sMap[size as string] || 'md')}
        className={cn(
          className, 
          "text-[9px] md:text-[11px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] rounded-premium-full transition-all duration-700 hover:scale-[1.01] active:scale-[0.98]",
          "focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-4 focus-visible:outline-none"
        )}
        {...(filteredProps as any)}
      >
        {children}
      </CathedraButton>
    );
  }
);
HomeButton.displayName = "HomeButton";

export { HomeButton };
