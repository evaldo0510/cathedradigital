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
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      props.onClick?.(e as any);
    }
  };

  return (
    <Card
      ref={ref}
      variant={isClickable ? 'interactive' : 'default'}
      padding="none"
      tabIndex={props.tabIndex !== undefined ? props.tabIndex : (isClickable ? 0 : undefined)}
      role={props.role !== undefined ? props.role : (isClickable ? 'button' : undefined)}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          props.onClick?.(e as any);
        }
        props.onKeyDown?.(e);
      }}
      className={cn(
        "text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background transition-all",
        className
      )}
      {...props}
    />
  );
});
HomeCard.displayName = "HomeCard";

export { HomeCard };
