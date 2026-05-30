import React from 'react';

export const LiturgiaSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-pulse">
      <div className="space-y-4 text-center">
        <div className="h-xl w-64 bg-muted rounded-premium mx-auto" />
        <div className="flex items-center justify-center gap-md">
          <div className="w-2xl h-2xl bg-muted rounded-premium" />
          <div className="h-md w-48 bg-muted rounded mx-auto" />
          <div className="w-2xl h-2xl bg-muted rounded-premium" />
        </div>
      </div>

      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted/40 h-64 rounded-premium border border-border" />
        ))}
      </div>
    </div>
  );
};
