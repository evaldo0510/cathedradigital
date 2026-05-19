import { Icons } from "@/constants";

export const SectionSkeleton = () => (
  <div className="w-full py-12 animate-in fade-in duration-500">
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      <div className="h-8 w-48 bg-muted/20 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted/10 rounded-2xl border border-border/50 animate-pulse" />
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
  <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700">
    <div className="h-12 w-12 bg-muted/20 rounded-2xl animate-bounce" />
    <div className="space-y-4 items-center flex flex-col">
      <div className="h-12 w-64 md:w-96 bg-muted/20 rounded-2xl" />
      <div className="h-6 w-48 md:w-64 bg-muted/10 rounded-2xl" />
    </div>
    <div className="flex gap-4">
      <div className="h-14 w-40 bg-muted/20 rounded-2xl" />
      <div className="h-14 w-40 bg-muted/10 rounded-2xl" />
    </div>
  </div>
);
