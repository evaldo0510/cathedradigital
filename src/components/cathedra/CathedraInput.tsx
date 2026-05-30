import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";

interface CathedraInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const CathedraInput = React.forwardRef<HTMLInputElement, CathedraInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-spacing-md w-full">
        {label && (
          <label className="h5 block px-spacing-md">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-spacing-lg top-spacing-2xs/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary/60 transition-premium">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "input-premium",
              icon && "pl-spacing-3xl",
              error && "border-destructive/30 focus:ring-destructive/20",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-destructive/80 px-spacing-md animate-in fade-in slide-in-from-top-spacing-2xs">
            {error}
          </p>
        )}
      </div>
    );
  }
);

CathedraInput.displayName = "CathedraInput";

export { CathedraInput };
