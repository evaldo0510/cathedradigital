import * as React from "react";
import { cn } from "@/lib/utils";

interface HomeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: any;
}

const HomeCard = React.forwardRef<
  HTMLDivElement,
  HomeCardProps
>(({ className, as: Component = "div", ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "rounded-3xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300",
      "hover:shadow-md hover:border-primary/20 hover:-translate-y-1",
      "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none",
      className
    )}
    {...props}
  />
));
HomeCard.displayName = "HomeCard";

export { HomeCard };
