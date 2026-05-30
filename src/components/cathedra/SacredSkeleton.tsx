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
  <div className="text-center space-y-4 pt-xl mb-xl animate-pulse">
    <div className="w-2xl h-2xl mx-auto rounded-premium bg-muted" />
    <div className="h-xl w-64 mx-auto bg-muted rounded-premium" />
    <div className="h-md w-80 mx-auto bg-muted/60 rounded-premium" />
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="h-56 rounded-premium bg-muted/30 border border-border/40 shadow-soft" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-3xl rounded-premium bg-muted/20 border border-border/30" />
    ))}
  </div>
);


export const SaintCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden animate-pulse h-96">
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-2xs/3 bg-muted h-64 md:h-auto" />
      <div className="flex-1 p-xl space-y-6">
        <div className="h-md w-4xl bg-muted rounded" />
        <div className="h-xl w-64 bg-muted rounded" />
        <div className="space-y-3">
          <div className="h-sm w-full bg-muted rounded" />
          <div className="h-sm w-full bg-muted rounded" />
          <div className="h-sm w-sm/4 bg-muted rounded" />
        </div>
      </div>
    </div>
  </div>
);

export const SaintGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-48 rounded-premium bg-muted" />
    ))}
  </div>
);


export const BibleChapterSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-xl w-48 bg-muted rounded mx-auto" />
    <div className="space-y-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="h-md w-full bg-muted rounded" />
      ))}
    </div>
  </div>
);

export const CatechismParagraphSkeleton: React.FC<{ paragraph?: number }> = ({ paragraph }) => (
  <div className="space-y-4 animate-pulse py-md">
    <div className="flex items-center gap-xs">
      <div className="h-xl w-2xl bg-muted rounded" />
      <div className="h-px flex-1 bg-muted/30" />
    </div>
    <div className="space-y-3">
      <div className="h-md w-full bg-muted rounded" />
      <div className="h-md w-full bg-muted rounded" />
      <div className="h-md w-md/6 bg-muted rounded" />
    </div>
  </div>
);

export const LogosChatSkeleton = () => (
  <div className="flex flex-col h-full space-y-6 p-md animate-pulse">
    <div className="flex justify-start gap-sm">
      <div className="w-xl h-xl rounded-full bg-muted shrink-0" />
      <div className="space-y-2">
        <div className="h-3xl w-[200px] rounded-premium rounded-tl-none bg-muted/60" />
        <div className="h-sm w-2xl bg-muted/30 rounded" />
      </div>
    </div>
    <div className="flex justify-end gap-sm">
      <div className="space-y-2">
        <div className="h-2xl w-[150px] rounded-premium rounded-tr-none bg-primary/10" />
        <div className="h-sm w-2xl bg-muted/30 rounded ml-auto" />
      </div>
      <div className="w-xl h-xl rounded-full bg-primary/10 shrink-0" />
    </div>
    <div className="flex justify-start gap-sm pt-md">
      <div className="w-xl h-xl rounded-full bg-muted shrink-0" />
      <div className="space-y-2">
        <div className="h-4xl w-[240px] rounded-premium rounded-tl-none bg-muted/60" />
        <div className="h-sm w-2xl bg-muted/30 rounded" />
      </div>
    </div>
  </div>
);

export const ReadingSkeleton = () => (
  <div className="w-full max-w-3xl mx-auto space-y-8 py-2xl animate-in fade-in duration-700">
    <div className="space-y-4">
      <div className="h-md w-4xl mx-auto bg-muted rounded-full" />
      <div className="h-xl w-sm/4 mx-auto bg-muted rounded-full" />
    </div>
    <div className="space-y-6 pt-xl">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex gap-md">
          <div className="h-md w-lg shrink-0 mt-2xs bg-muted/30 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className={`h-md bg-muted/60 rounded-full ${i % 2 === 0 ? 'w-full' : 'w-[95%]'}`} />
            <div className={`h-md bg-muted/40 rounded-full ${i % 3 === 0 ? 'w-md/5' : 'w-[90%]'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

