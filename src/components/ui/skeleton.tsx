import { cn } from "@/lib/utils";

/**
 * Skeleton (shadcn) — mantido por compatibilidade em Radix/Popover/Sidebar.
 * Consolidado no Sprint P2.2: usa o shimmer editorial `.cathedra-shimmer`
 * (respeita `prefers-reduced-motion`) em vez de `animate-pulse` local.
 * Callers customizados podem sobrescrever via className.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("cathedra-shimmer rounded-premium-full", className)}
      aria-hidden="true"
      aria-busy="true"
      {...props}
    />
  );
}

export { Skeleton };
