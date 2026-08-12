import { Skeleton } from "@/components/ui/skeleton";

export const PreviewSkeleton = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        <Skeleton className="h-64 w-full rounded-xl" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
};
