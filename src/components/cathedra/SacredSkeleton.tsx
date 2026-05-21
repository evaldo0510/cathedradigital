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
  <div className="text-center space-y-4 pt-8 mb-10 animate-pulse">
    <div className="w-12 h-12 mx-auto rounded-premium bg-muted" />
    <div className="h-10 w-64 mx-auto bg-muted rounded-premium" />
    <div className="h-4 w-80 mx-auto bg-muted/60 rounded-premium" />
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="h-56 rounded-premium bg-muted/30 border border-border/40 shadow-soft" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-20 rounded-premium bg-muted/20 border border-border/30" />
    ))}
  </div>
);


export const SaintCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden animate-pulse h-96">
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-1/3 bg-muted h-64 md:h-auto" />
      <div className="flex-1 p-8 space-y-6">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="space-y-3">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    </div>
  </div>
);

export const SaintGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-48 rounded-premium bg-muted" />
    ))}
  </div>
);


export const BibleChapterSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-48 bg-muted rounded mx-auto" />
    <div className="space-y-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="h-4 w-full bg-muted rounded" />
      ))}
    </div>
  </div>
);

export const CatechismParagraphSkeleton: React.FC<{ paragraph?: number }> = ({ paragraph }) => (
  <div className="space-y-4 animate-pulse py-4">
    <div className="flex items-center gap-2">
      <div className="h-8 w-12 bg-muted rounded" />
      <div className="h-px flex-1 bg-muted/30" />
    </div>
    <div className="space-y-3">
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-5/6 bg-muted rounded" />
    </div>
  </div>
);

export const LogosChatSkeleton = () => (
  <div className="flex flex-col h-full space-y-6 p-4 animate-pulse">
    <div className="flex justify-start gap-3">
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
      <div className="space-y-2">
        <div className="h-16 w-[200px] rounded-2xl rounded-tl-none bg-muted/60" />
        <div className="h-3 w-12 bg-muted/30 rounded" />
      </div>
    </div>
    <div className="flex justify-end gap-3">
      <div className="space-y-2">
        <div className="h-12 w-[150px] rounded-2xl rounded-tr-none bg-primary/10" />
        <div className="h-3 w-12 bg-muted/30 rounded ml-auto" />
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0" />
    </div>
    <div className="flex justify-start gap-3 pt-4">
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
      <div className="space-y-2">
        <div className="h-24 w-[240px] rounded-2xl rounded-tl-none bg-muted/60" />
        <div className="h-3 w-12 bg-muted/30 rounded" />
      </div>
    </div>
  </div>
);

export const ReadingSkeleton = () => (
  <div className="w-full max-w-3xl mx-auto space-y-8 py-12 animate-in fade-in duration-700">
    <div className="space-y-4">
      <div className="h-4 w-24 mx-auto bg-muted rounded-full" />
      <div className="h-10 w-3/4 mx-auto bg-muted rounded-full" />
    </div>
    <div className="space-y-6 pt-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 w-6 shrink-0 mt-1 bg-muted/30 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className={`h-4 bg-muted/60 rounded-full ${i % 2 === 0 ? 'w-full' : 'w-[95%]'}`} />
            <div className={`h-4 bg-muted/40 rounded-full ${i % 3 === 0 ? 'w-4/5' : 'w-[90%]'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

