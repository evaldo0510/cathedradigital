import * as React from "react";
import { cn } from "@/lib/utils";

interface HomeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: any;
  href?: string;
  [key: string]: any;
}

const HomeCard = React.forwardRef<
  HTMLDivElement,
  HomeCardProps
>(({ className, as: Component = "div", href, ...props }, ref) => {
  const isClickable = props.onClick || href || Component === "button" || Component === "a";
  
  return (
    <Component
      ref={ref}
      href={href}
      className={cn(
        "rounded-3xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300",
        isClickable && "hover:shadow-md hover:border-primary/20 hover:-translate-y-1 cursor-pointer",
        "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
HomeCard.displayName = "HomeCard";

export { HomeCard };
