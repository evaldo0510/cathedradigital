import * as React from "react";
import { CathedraCard } from "./CathedraCard";
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
    <CathedraCard
      ref={ref}
      variant={isClickable ? 'interactive' : 'default'}
      padding="none"
      className={cn(
        "text-card-foreground focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-4 focus-within:border-primary/20 outline-none focus-visible:ring-primary/40 focus-visible:ring-offset-4",
        className
      )}
      {...props}
    />
  );
});
HomeCard.displayName = "HomeCard";

export { HomeCard };
