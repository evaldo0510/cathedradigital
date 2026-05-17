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
        "rounded-3xl border border-border/50 bg-card text-card-foreground shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-500",
        isClickable && "hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:border-primary/20 hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]",
        "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
HomeCard.displayName = "HomeCard";

export { HomeCard };
