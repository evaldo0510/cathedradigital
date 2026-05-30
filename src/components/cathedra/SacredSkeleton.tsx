import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


/**
 * Standardized skeleton styles:
 * - Layout: matching the domain layout (page header, grid, list)
 * - Height: consistent with actual components
 * - Animations: standard pulse or shimmer
 */

export const PageHeaderSkeleton: React.FC = () => (
  <div className="text-center space-y-spacing-md pt-spacing-xl mb-spacing-xl animate-pulse">
    <div className="w-spacing-2xl h-spacing-2xl mx-auto rounded-premium bg-muted" />
    <div className="h-spacing-xl w-spacing-4xl mx-auto bg-muted rounded-premium" />
    <div className="h-spacing-md w-spacing-4xl mx-auto bg-muted/60 rounded-premium" />
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="h-spacing-4xl rounded-premium bg-muted/30 border border-border/40 shadow-premium-md" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-spacing-md animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-spacing-3xl rounded-premium bg-muted/20 border border-border/30" />
    ))}
  </div>
);


export const SaintCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden animate-pulse h-spacing-4xl">
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-spacing-2xs/3 bg-muted h-spacing-4xl md:h-auto" />
      <div className="flex-1 p-spacing-xl space-y-spacing-lg">
        <div className="h-spacing-md w-spacing-4xl bg-muted rounded" />
        <div className="h-spacing-xl w-spacing-4xl bg-muted rounded" />
        <div className="space-y-spacing-sm">
          <div className="h-spacing-sm w-full bg-muted rounded" />
          <div className="h-spacing-sm w-full bg-muted rounded" />
          <div className="h-spacing-sm w-spacing-sm/4 bg-muted rounded" />
        </div>
      </div>
    </div>
  </div>
);

export const SaintGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-spacing-md animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-spacing-4xl rounded-premium bg-muted" />
    ))}
  </div>
);


export const BibleChapterSkeleton: React.FC = () => (
  <div className="space-y-spacing-lg animate-pulse">
    <div className="h-spacing-xl w-spacing-4xl bg-muted rounded mx-auto" />
    <div className="space-y-spacing-md">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="h-spacing-md w-full bg-muted rounded" />
      ))}
    </div>
  </div>
);

export const CatechismParagraphSkeleton: React.FC<{ paragraph?: number }> = ({ paragraph }) => (
  <div className="space-y-spacing-md animate-pulse py-spacing-md">
    <div className="flex items-center gap-spacing-xs">
      <div className="h-spacing-xl w-spacing-2xl bg-muted rounded" />
      <div className="h-px flex-1 bg-muted/30" />
    </div>
    <div className="space-y-spacing-sm">
      <div className="h-spacing-md w-full bg-muted rounded" />
      <div className="h-spacing-md w-full bg-muted rounded" />
      <div className="h-spacing-md w-spacing-md/6 bg-muted rounded" />
    </div>
  </div>
);

export const LogosChatSkeleton = () => (
  <div className="flex flex-col h-full space-y-spacing-lg p-spacing-md animate-pulse">
    <div className="flex justify-start gap-spacing-sm">
      <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-muted shrink-0" />
      <div className="space-y-spacing-xs">
        <div className="h-spacing-3xl w-[200px] rounded-premium rounded-tl-none bg-muted/60" />
        <div className="h-spacing-sm w-spacing-2xl bg-muted/30 rounded" />
      </div>
    </div>
    <div className="flex justify-end gap-spacing-sm">
      <div className="space-y-spacing-xs">
        <div className="h-spacing-2xl w-[150px] rounded-premium rounded-tr-none bg-primary/10" />
        <div className="h-spacing-sm w-spacing-2xl bg-muted/30 rounded ml-auto" />
      </div>
      <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/10 shrink-0" />
    </div>
    <div className="flex justify-start gap-spacing-sm pt-spacing-md">
      <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-muted shrink-0" />
      <div className="space-y-spacing-xs">
        <div className="h-spacing-4xl w-[240px] rounded-premium rounded-tl-none bg-muted/60" />
        <div className="h-spacing-sm w-spacing-2xl bg-muted/30 rounded" />
      </div>
    </div>
  </div>
);

export const ReadingSkeleton = () => (
  <div className="w-full max-w-spacing-3xl mx-auto space-y-spacing-xl py-spacing-2xl animate-in fade-in duration-700">
    <div className="space-y-spacing-md">
      <div className="h-spacing-md w-spacing-4xl mx-auto bg-muted rounded-premium-full" />
      <div className="h-spacing-xl w-spacing-sm/4 mx-auto bg-muted rounded-premium-full" />
    </div>
    <div className="space-y-spacing-lg pt-spacing-xl">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex gap-spacing-md">
          <div className="h-spacing-md w-spacing-lg shrink-0 mt-spacing-2xs bg-muted/30 rounded-premium-full" />
          <div className="space-y-spacing-xs flex-1">
            <div className={`h-spacing-md bg-muted/60 rounded-premium-full ${i % 2 === 0 ? 'w-full' : 'w-[95%]'}`} />
            <div className={`h-spacing-md bg-muted/40 rounded-premium-full ${i % 3 === 0 ? 'w-spacing-md/5' : 'w-[90%]'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

