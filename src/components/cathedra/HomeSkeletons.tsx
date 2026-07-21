import { ContentSkeleton, SkeletonGrid } from './primitives';

/**
 * HomeSkeletons — API pública preservada (SectionSkeleton, RitualSkeleton, HeroSkeleton).
 * Implementação consolidada no Sprint P2 (Logos 2030) para consumir a primitiva
 * unificada `ContentSkeleton` / `SkeletonGrid` e o shimmer `.cathedra-shimmer`
 * (respeita `prefers-reduced-motion`).
 */

export const SectionSkeleton = () => (
  <div className="w-full py-spacing-2xl cinematic-fade-in">
    <div className="max-w-7xl mx-auto px-spacing-md space-y-spacing-xl">
      <ContentSkeleton variant="block" className="h-[24px] w-[240px]" />
      <SkeletonGrid count={3} cols={3} />
    </div>
  </div>
);

export const RitualSkeleton = () => (
  <div
    className="w-full rounded-premium border border-primary/5 bg-card/50 p-spacing-lg space-y-spacing-lg"
    aria-hidden="true"
    aria-busy="true"
  >
    <div className="flex justify-between items-center gap-spacing-md">
      <ContentSkeleton variant="block" className="h-spacing-md w-[220px]" />
      <ContentSkeleton variant="block" className="h-spacing-md w-[100px]" />
    </div>
    <ContentSkeleton variant="block" className="h-spacing-4xl w-full" />
    <ContentSkeleton variant="text" lines={2} />
  </div>
);

export const HeroSkeleton = () => (
  <div
    className="w-full min-h-[80vh] flex flex-col items-center justify-center p-spacing-lg space-y-spacing-xl animate-in fade-in duration-700"
    aria-hidden="true"
    aria-busy="true"
  >
    <ContentSkeleton variant="circle" className="h-spacing-2xl w-spacing-2xl" />
    <div className="space-y-spacing-md items-center flex flex-col w-full max-w-xl">
      <ContentSkeleton variant="block" className="h-spacing-2xl w-[70%]" />
      <ContentSkeleton variant="block" className="h-spacing-lg w-[45%]" />
    </div>
    <div className="flex gap-spacing-md">
      <ContentSkeleton variant="pill" className="h-spacing-2xl w-[160px]" />
      <ContentSkeleton variant="pill" className="h-spacing-2xl w-[140px]" />
    </div>
  </div>
);
