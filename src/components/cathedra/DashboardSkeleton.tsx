import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full pt-12 animate-pulse pb-24">
      <div className="w-full max-w-[640px] px-6 space-y-20">
        {/* Header Skeleton */}
        <div className="text-center space-y-6 pt-4">
          <div className="space-y-4">
            <div className="h-2 w-24 bg-muted/60 rounded-full mx-auto" />
            <div className="h-12 w-full bg-muted/80 rounded-2xl mx-auto" />
            <div className="h-12 w-2/3 bg-muted/60 rounded-2xl mx-auto" />
          </div>
          <div className="flex justify-center gap-4">
            <div className="h-8 w-20 bg-muted/40 rounded-full" />
            <div className="h-8 w-20 bg-muted/40 rounded-full" />
          </div>
        </div>

        {/* Continue Journey Skeleton */}
        <div className="space-y-4">
          <div className="h-2 w-32 bg-muted/30 rounded-full" />
          <div className="h-24 w-full bg-muted/50 rounded-3xl" />
        </div>

        {/* Ritual Skeleton */}
        <div className="space-y-4">
          <div className="h-2 w-32 bg-muted/30 rounded-full" />
          <div className="h-64 w-full bg-muted/50 rounded-3xl" />
        </div>

        {/* Doors Skeleton */}
        <div className="space-y-4">
          <div className="h-2 w-32 bg-muted/30 rounded-full" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted/40 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
