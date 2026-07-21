import React from 'react';
import { ContentSkeleton } from './primitives';

/**
 * LiturgiaSkeleton — consolidado no Sprint P2 (Logos 2030).
 * Consome a primitiva unificada `ContentSkeleton` mantendo a silhueta original.
 */
export const LiturgiaSkeleton: React.FC = () => {
  return (
    <div
      className="max-w-3xl mx-auto space-y-spacing-xl"
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="space-y-spacing-md text-center flex flex-col items-center">
        <ContentSkeleton variant="block" className="h-spacing-xl w-[240px]" />
        <div className="flex items-center justify-center gap-spacing-md">
          <ContentSkeleton variant="circle" className="w-spacing-2xl h-spacing-2xl" />
          <ContentSkeleton variant="block" className="h-spacing-md w-[180px]" />
          <ContentSkeleton variant="circle" className="w-spacing-2xl h-spacing-2xl" />
        </div>
      </div>

      <div className="space-y-spacing-xl">
        {[1, 2, 3].map((i) => (
          <ContentSkeleton key={i} variant="block" className="h-spacing-4xl w-full" />
        ))}
      </div>
    </div>
  );
};
