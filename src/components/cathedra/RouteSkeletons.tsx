import React from 'react';
import { Card } from '@/components/ui/card';

export const BibleSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto space-y-spacing-2xl py-spacing-xl animate-in fade-in duration-700">
    <div className="space-y-spacing-lg text-center">
      <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 border border-primary/10 mx-auto animate-pulse" />
      <div className="h-spacing-xl w-spacing-4xl bg-muted/40 rounded-premium-full mx-auto animate-pulse" />
      <div className="h-spacing-md w-spacing-4xl bg-muted/20 rounded-premium-full mx-auto animate-pulse" />
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-lg">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="h-spacing-4xl rounded-premium bg-muted/20 border-border/20 animate-pulse duration-700" />
      ))}
    </div>
  </div>
);

export const CatechismSkeleton = () => (
  <div className="w-full max-w-5xl mx-auto space-y-spacing-2xl py-spacing-xl animate-in fade-in duration-700">
    <div className="space-y-spacing-lg text-center">
      <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 border border-primary/10 mx-auto animate-pulse" />
      <div className="h-spacing-xl w-spacing-4xl bg-muted/40 rounded-premium-full mx-auto animate-pulse" />
    </div>

    <div className="space-y-spacing-xl max-w-spacing-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-spacing-md">
          <div className="h-spacing-xl w-spacing-4xl bg-muted/40 rounded-premium-full animate-pulse duration-700" />
          <div className="space-y-spacing-xs">
            <div className="h-spacing-md w-full bg-muted/20 rounded-premium-full animate-pulse duration-700" />
            <div className="h-spacing-md w-full bg-muted/20 rounded-premium-full animate-pulse duration-700" />
            <div className="h-spacing-md w-spacing-xs/3 bg-muted/20 rounded-premium-full animate-pulse duration-700" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const LogosSkeleton = () => (
  <div className="w-full max-w-spacing-4xl mx-auto h-[70vh] flex flex-col space-y-spacing-lg md:space-y-spacing-xl py-spacing-lg md:py-spacing-xl animate-in fade-in duration-700">
    <div className="flex items-center gap-spacing-md border-b border-border/5 pb-spacing-lg md:pb-spacing-xl">
      <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 border border-primary/10 animate-pulse" />
      <div className="space-y-spacing-xs">
        <div className="h-spacing-md w-spacing-4xl bg-muted/40 rounded-premium-full animate-pulse" />
        <div className="h-spacing-sm w-spacing-4xl bg-muted/20 rounded-premium-full animate-pulse" />
      </div>
    </div>
    
    <div className="flex-1 space-y-spacing-xl overflow-hidden">
      <div className="flex justify-start gap-spacing-md">
        <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-muted/30 animate-pulse" />
        <div className="h-spacing-3xl w-spacing-xs/3 bg-muted/10 rounded-premium animate-pulse" />
      </div>
      <div className="flex justify-end gap-spacing-md">
        <div className="h-spacing-2xl w-spacing-2xs/2 bg-primary/5 rounded-premium animate-pulse" />
        <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/5 animate-pulse" />
      </div>
      <div className="flex justify-start gap-spacing-md">
        <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-muted/30 animate-pulse" />
        <div className="h-spacing-4xl w-spacing-sm/4 bg-muted/10 rounded-premium animate-pulse" />
      </div>
    </div>
    
    <div className="pt-spacing-xl border-t border-border/5">
      <div className="h-spacing-2xl w-full bg-muted/5 rounded-premium-full border border-border/10 animate-pulse" />
    </div>
  </div>
);
