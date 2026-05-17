import React from 'react';

export const LiturgiaSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-pulse">
      <div className="space-y-4 text-center">
        <div className="h-10 w-64 bg-muted rounded-xl mx-auto" />
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-2xl" />
          <div className="h-5 w-48 bg-muted rounded mx-auto" />
          <div className="w-12 h-12 bg-muted rounded-2xl" />
        </div>
      </div>

      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted/40 h-64 rounded-3xl border border-border" />
        ))}
      </div>
    </div>
  );
};
