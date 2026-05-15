import * as React from "react";
import { CathedraButton } from "./CathedraButton";
import { type ButtonProps } from "@/components/ui/button";

export interface HomeButtonProps extends ButtonProps {}

const HomeButton = React.forwardRef<HTMLButtonElement, HomeButtonProps>(
  ({ variant, size, ...props }, ref) => {
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

    return (
      <CathedraButton
        ref={ref}
        variant={vMap[variant as string] || 'primary'}
        size={sMap[size as string] || 'md'}
        {...props}
      />
    );
  }
);
HomeButton.displayName = "HomeButton";

export { HomeButton };
