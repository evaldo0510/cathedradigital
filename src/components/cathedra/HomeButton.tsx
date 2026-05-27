import * as React from "react";
import { CathedraButton } from "./CathedraButton";
import { type ButtonProps } from "@/components/ui/button";

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
        className={cn(className, "text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] rounded-full transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]")}

        {...(filteredProps as any)}
      >
        {children}
      </CathedraButton>
    );
  }
);
HomeButton.displayName = "HomeButton";

export { HomeButton };
