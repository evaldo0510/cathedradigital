import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="desktop-layout py-6 md:py-10 animate-pulse">
      <div className="desktop-main content-section space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-3 w-24 bg-muted rounded mx-auto" />
            <div className="h-10 w-64 bg-muted rounded mx-auto" />
            <div className="h-4 w-48 bg-muted rounded mx-auto" />
          </div>
          <div className="flex justify-center gap-4">
            <div className="h-8 w-20 bg-muted rounded-2xl" />
            <div className="h-8 w-20 bg-muted rounded-2xl" />
          </div>
        </div>

        {/* Guide Link Skeleton */}
        <div className="h-16 w-full bg-muted rounded-2xl" />

        {/* Main Doors Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-3xl" />
          ))}
        </div>

        {/* Ritual Skeleton */}
        <div className="h-48 bg-muted rounded-3xl" />
      </div>

      {/* Sidebar Skeleton */}
      <aside className="desktop-aside space-y-6 hidden xl:block">
        <div className="p-6 rounded-3xl bg-muted h-64" />
        <div className="p-6 rounded-3xl bg-muted h-32" />
        <div className="p-6 rounded-3xl bg-muted h-48" />
      </aside>
    </div>
  );
};
