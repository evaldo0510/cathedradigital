import React from 'react';
import { Card } from '@/components/ui/card';

export const BibleSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto space-y-12 py-xl animate-in fade-in duration-700">
    <div className="space-y-6 text-center">
      <div className="w-2xl h-2xl rounded-premium bg-primary/5 border border-primary/10 mx-auto animate-pulse" />
      <div className="h-xl w-64 bg-muted/40 rounded-full mx-auto animate-pulse" />
      <div className="h-md w-48 bg-muted/20 rounded-full mx-auto animate-pulse" />
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="h-40 rounded-premium bg-muted/20 border-border/20 animate-pulse duration-700" />
      ))}
    </div>
  </div>
);

export const CatechismSkeleton = () => (
  <div className="w-full max-w-5xl mx-auto space-y-12 py-xl animate-in fade-in duration-700">
    <div className="space-y-6 text-center">
      <div className="w-2xl h-2xl rounded-premium bg-primary/5 border border-primary/10 mx-auto animate-pulse" />
      <div className="h-xl w-80 bg-muted/40 rounded-full mx-auto animate-pulse" />
    </div>

    <div className="space-y-8 max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-xl w-48 bg-muted/40 rounded-full animate-pulse duration-700" />
          <div className="space-y-2">
            <div className="h-md w-full bg-muted/20 rounded-full animate-pulse duration-700" />
            <div className="h-md w-full bg-muted/20 rounded-full animate-pulse duration-700" />
            <div className="h-md w-xs/3 bg-muted/20 rounded-full animate-pulse duration-700" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const LogosSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto h-[70vh] flex flex-col space-y-6 md:space-y-8 py-lg md:py-xl animate-in fade-in duration-700">
    <div className="flex items-center gap-md border-b border-border/5 pb-lg md:pb-xl">
      <div className="w-2xl h-2xl rounded-premium bg-primary/5 border border-primary/10 animate-pulse" />
      <div className="space-y-2">
        <div className="h-md w-4xl bg-muted/40 rounded-full animate-pulse" />
        <div className="h-sm w-4xl bg-muted/20 rounded-full animate-pulse" />
      </div>
    </div>
    
    <div className="flex-1 space-y-8 overflow-hidden">
      <div className="flex justify-start gap-md">
        <div className="w-xl h-xl rounded-full bg-muted/30 animate-pulse" />
        <div className="h-3xl w-xs/3 bg-muted/10 rounded-premium animate-pulse" />
      </div>
      <div className="flex justify-end gap-md">
        <div className="h-2xl w-2xs/2 bg-primary/5 rounded-premium animate-pulse" />
        <div className="w-xl h-xl rounded-full bg-primary/5 animate-pulse" />
      </div>
      <div className="flex justify-start gap-md">
        <div className="w-xl h-xl rounded-full bg-muted/30 animate-pulse" />
        <div className="h-4xl w-sm/4 bg-muted/10 rounded-premium animate-pulse" />
      </div>
    </div>
    
    <div className="pt-xl border-t border-border/5">
      <div className="h-2xl w-full bg-muted/5 rounded-full border border-border/10 animate-pulse" />
    </div>
  </div>
);
