import { Icons } from "@/constants";

export const SectionSkeleton = () => (
  <div className="w-full py-2xl animate-in fade-in duration-500">
    <div className="max-w-7xl mx-auto px-md space-y-8">
      <div className="h-xl w-48 bg-muted/20 rounded-premium animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted/10 rounded-premium border border-primary/5 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export const RitualSkeleton = () => (
  <div className="w-full rounded-premium border border-primary/5 bg-card/50 p-lg space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-md w-4xl bg-muted/20 rounded-premium" />
      <div className="h-md w-4xl bg-muted/10 rounded-premium" />
    </div>
    <div className="h-4xl bg-muted/10 rounded-premium" />
    <div className="space-y-3">
      <div className="h-md w-full bg-muted/20 rounded-premium" />
      <div className="h-md w-sm/4 bg-muted/20 rounded-premium" />
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-lg space-y-8 animate-in fade-in duration-700">
    <div className="h-2xl w-2xl bg-muted/20 rounded-premium animate-bounce" />
    <div className="space-y-4 items-center flex flex-col">
      <div className="h-2xl w-64 md:w-96 bg-muted/20 rounded-premium" />
      <div className="h-lg w-48 md:w-64 bg-muted/10 rounded-premium" />
    </div>
    <div className="flex gap-md">
      <div className="h-2xl w-40 bg-muted/20 rounded-premium" />
      <div className="h-2xl w-40 bg-muted/10 rounded-premium" />
    </div>
  </div>
);
