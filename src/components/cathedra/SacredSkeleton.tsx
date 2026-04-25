import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Standardized skeleton styles:
 * - Layout: matching the domain layout (page header, grid, list)
 * - Height: consistent with actual components
 * - Animations: standard pulse or shimmer
 */

export const PageHeaderSkeleton: React.FC = () => (
  <div className="text-center space-y-4 pt-8 mb-10 animate-pulse">
    <div className="w-12 h-12 mx-auto rounded-2xl bg-muted" />
    <div className="h-10 w-64 mx-auto bg-muted rounded-xl" />
    <div className="h-4 w-80 mx-auto bg-muted/60 rounded-lg" />
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="h-56 rounded-3xl bg-muted/30 border border-border/40 shadow-sm" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-20 rounded-2xl bg-muted/20 border border-border/30" />
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
      <div key={i} className="h-48 rounded-3xl bg-muted" />
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
