import React from 'react';

export const LiturgiaSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-xl animate-pulse">
      <div className="space-y-md text-center">
        <div className="h-xl w-4xl bg-muted rounded-premium mx-auto" />
        <div className="flex items-center justify-center gap-md">
          <div className="w-2xl h-2xl bg-muted rounded-premium" />
          <div className="h-md w-4xl bg-muted rounded mx-auto" />
          <div className="w-2xl h-2xl bg-muted rounded-premium" />
        </div>
      </div>

      <div className="space-y-xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted/40 h-4xl rounded-premium border border-border" />
        ))}
      </div>
    </div>
  );
};
