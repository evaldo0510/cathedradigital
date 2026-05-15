import * as React from "react";
import { Card   } from "@/components/cathedra/Card";
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
    <Card
      ref={ref}
      variant={isClickable ? 'interactive' : 'default'}
      padding="none"
      className={cn(
        "text-card-foreground focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 outline-none focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
HomeCard.displayName = "HomeCard";

export { HomeCard };
