import React from 'react';

export const LiturgiaSkeleton: React.FC = () => {
  return (
    <div className="max-w-spacing-2xl mx-auto space-y-spacing-xl animate-pulse">
      <div className="space-y-spacing-md text-center">
        <div className="h-spacing-xl w-spacing-4xl bg-muted rounded-premium mx-auto" />
        <div className="flex items-center justify-center gap-spacing-md">
          <div className="w-spacing-2xl h-spacing-2xl bg-muted rounded-premium" />
          <div className="h-spacing-md w-spacing-4xl bg-muted rounded mx-auto" />
          <div className="w-spacing-2xl h-spacing-2xl bg-muted rounded-premium" />
        </div>
      </div>

      <div className="space-y-spacing-xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted/40 h-spacing-4xl rounded-premium border border-border" />
        ))}
      </div>
    </div>
  );
};
