import { Icons } from "@/constants";

export const SectionSkeleton = () => (
  <div className="w-full py-spacing-2xl animate-in fade-in duration-500">
    <div className="max-w-7xl mx-auto px-spacing-md space-y-spacing-xl">
      <div className="h-spacing-xl w-spacing-4xl bg-muted/20 rounded-premium animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-spacing-4xl bg-muted/10 rounded-premium border border-primary/5 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export const RitualSkeleton = () => (
  <div className="w-full rounded-premium border border-primary/5 bg-card/50 p-spacing-lg space-y-spacing-lg animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-spacing-md w-spacing-4xl bg-muted/20 rounded-premium" />
      <div className="h-spacing-md w-spacing-4xl bg-muted/10 rounded-premium" />
    </div>
    <div className="h-spacing-4xl bg-muted/10 rounded-premium" />
    <div className="space-y-spacing-sm">
      <div className="h-spacing-md w-full bg-muted/20 rounded-premium" />
      <div className="h-spacing-md w-spacing-sm/4 bg-muted/20 rounded-premium" />
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-spacing-lg space-y-spacing-xl animate-in fade-in duration-700">
    <div className="h-spacing-2xl w-spacing-2xl bg-muted/20 rounded-premium animate-bounce" />
    <div className="space-y-spacing-md items-center flex flex-col">
      <div className="h-spacing-2xl w-spacing-4xl md:w-spacing-4xl bg-muted/20 rounded-premium" />
      <div className="h-spacing-lg w-spacing-4xl md:w-spacing-4xl bg-muted/10 rounded-premium" />
    </div>
    <div className="flex gap-spacing-md">
      <div className="h-spacing-2xl w-spacing-4xl bg-muted/20 rounded-premium" />
      <div className="h-spacing-2xl w-spacing-4xl bg-muted/10 rounded-premium" />
    </div>
  </div>
);
