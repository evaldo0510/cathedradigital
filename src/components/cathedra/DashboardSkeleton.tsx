import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-4 animate-pulse">
      <div className="desktop-layout pt-0 md:pt-10 lg:pt-20 pb-24 w-full h-full max-w-2xl mx-auto lg:max-w-none lg:mx-0 overflow-hidden">
        <div className="desktop-main space-y-20 w-full">
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
      </div>
    </div>
  );
};
