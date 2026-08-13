import React from 'react';
import { ContentSkeleton } from './primitives';

/**
 * RouteSkeletons — consolidados no Sprint P2 (Logos 2030).
 * APIs públicas preservadas (BibleSkeleton, CatechismSkeleton, LogosSkeleton).
 * Todos consomem a primitiva unificada `ContentSkeleton`.
 */

const RouteSkeletons = ({ Component, ...props }: { Component: string }) => {
  if (Component === 'BibleSkeleton') return <BibleSkeleton {...props} />;
  if (Component === 'CatechismSkeleton') return <CatechismSkeleton {...props} />;
  if (Component === 'LogosSkeleton') return <LogosSkeleton {...props} />;
  return null;
};

export default RouteSkeletons;


export const BibleSkeleton = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Carregando Bíblia"
    className="w-full max-w-lg mx-auto min-h-[50vh] flex flex-col items-center justify-center gap-spacing-md py-spacing-2xl px-4 animate-in fade-in duration-500"
  >
    <div className="w-10 h-10 rounded-full border-2 border-secondary/20 border-t-secondary animate-spin" />
    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary/60">
      Abrindo Cânone Sagrado
    </p>
    <p className="text-xs font-serif italic text-muted-foreground">
      um instante…
    </p>
  </div>
);

export const CatechismSkeleton = () => (
  <div
    className="w-full max-w-5xl mx-auto space-y-spacing-2xl py-spacing-xl animate-in fade-in duration-700"
    aria-hidden="true"
    aria-busy="true"
  >
    <div className="space-y-spacing-lg text-center flex flex-col items-center">
      <ContentSkeleton variant="circle" className="w-spacing-2xl h-spacing-2xl" />
      <ContentSkeleton variant="block" className="h-spacing-xl w-[280px]" />
    </div>

    <div className="space-y-spacing-xl max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-spacing-md">
          <ContentSkeleton variant="block" className="h-spacing-xl w-[220px]" />
          <ContentSkeleton variant="text" lines={3} />
        </div>
      ))}
    </div>
  </div>
);

export const LogosSkeleton = () => (
  <div
    className="w-full max-w-4xl mx-auto h-[70vh] flex flex-col space-y-spacing-lg md:space-y-spacing-xl py-spacing-lg md:py-spacing-xl animate-in fade-in duration-700"
    aria-hidden="true"
    aria-busy="true"
  >
    <div className="flex items-center gap-spacing-md border-b border-border/5 pb-spacing-lg md:pb-spacing-xl">
      <ContentSkeleton variant="circle" className="w-spacing-2xl h-spacing-2xl" />
      <div className="space-y-spacing-xs flex-1 max-w-[280px]">
        <ContentSkeleton variant="block" className="h-spacing-md w-[70%]" />
        <ContentSkeleton variant="block" className="h-spacing-sm w-[45%]" />
      </div>
    </div>

    <div className="flex-1 space-y-spacing-xl overflow-hidden">
      <div className="flex justify-start gap-spacing-md">
        <ContentSkeleton variant="circle" className="w-spacing-xl h-spacing-xl shrink-0" />
        <ContentSkeleton variant="block" className="h-spacing-3xl w-[60%]" />
      </div>
      <div className="flex justify-end gap-spacing-md">
        <ContentSkeleton variant="block" className="h-spacing-2xl w-[45%]" />
        <ContentSkeleton variant="circle" className="w-spacing-xl h-spacing-xl shrink-0" />
      </div>
      <div className="flex justify-start gap-spacing-md">
        <ContentSkeleton variant="circle" className="w-spacing-xl h-spacing-xl shrink-0" />
        <ContentSkeleton variant="block" className="h-spacing-4xl w-[70%]" />
      </div>
    </div>

    <div className="pt-spacing-xl border-t border-border/5">
      <ContentSkeleton variant="pill" className="h-spacing-2xl w-full" />
    </div>
  </div>
);
