import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const ReadingSkeleton = () => {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-12 animate-in fade-in duration-700">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 mx-auto" />
        <Skeleton className="h-10 w-3/4 mx-auto" />
      </div>
      
      <div className="space-y-6 pt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-6 shrink-0 mt-1 opacity-30" />
            <div className="space-y-2 flex-1">
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-full' : 'w-[95%]'}`} />
              <Skeleton className={`h-4 ${i % 3 === 0 ? 'w-4/5' : 'w-[90%]'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LogosChatSkeleton = () => {
  return (
    <div className="flex flex-col h-full space-y-6 p-4">
      <div className="flex justify-start gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-[200px] rounded-2xl rounded-tl-none" />
          <Skeleton className="h-3 w-12 opacity-30" />
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <div className="space-y-2">
          <Skeleton className="h-12 w-[150px] rounded-2xl rounded-tr-none bg-primary/20" />
          <Skeleton className="h-3 w-12 ml-auto opacity-30" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-primary/20" />
      </div>

      <div className="flex justify-start gap-3 pt-4">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-24 w-[240px] rounded-2xl rounded-tl-none" />
          <Skeleton className="h-3 w-12 opacity-30" />
        </div>
      </div>
    </div>
  );
};

export const PageHeaderSkeleton = () => {
  return (
    <div className="space-y-4 pt-8 text-center">
      <Skeleton className="w-16 h-16 rounded-premium mx-auto" />
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto opacity-50" />
    </div>
  );
};
