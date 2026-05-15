import { Icons } from "@/constants";

export const SectionSkeleton = () => (
  <div className="w-full py-16 animate-in fade-in duration-1000">
    <div className="space-y-12">
      <div className="h-4 w-40 bg-muted/30 rounded-full animate-pulse mx-auto opacity-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-muted/10 rounded-premium border border-border/10 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export const RitualSkeleton = () => (
  <div className="w-full rounded-2xl border border-border bg-card/50 p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-4 w-32 bg-muted/20 rounded-2xl" />
      <div className="h-4 w-24 bg-muted/10 rounded-2xl" />
    </div>
    <div className="h-32 bg-muted/10 rounded-2xl" />
    <div className="space-y-3">
      <div className="h-4 w-full bg-muted/20 rounded-2xl" />
      <div className="h-4 w-3/4 bg-muted/20 rounded-2xl" />
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-1000">
    <div className="h-20 w-20 bg-muted/20 rounded-premium-sm animate-pulse" />
    <div className="space-y-6 items-center flex flex-col w-full">
      <div className="h-14 w-full max-w-2xl bg-muted/20 rounded-full animate-pulse" />
      <div className="h-14 w-3/4 max-w-xl bg-muted/20 rounded-full animate-pulse opacity-60" />
      <div className="h-6 w-48 bg-muted/10 rounded-full animate-pulse opacity-40" />
    </div>
    <div className="flex gap-6">
      <div className="h-16 w-48 bg-muted/20 rounded-full animate-pulse" />
      <div className="h-16 w-48 bg-muted/10 rounded-full animate-pulse opacity-60" />
    </div>
  </div>
);
