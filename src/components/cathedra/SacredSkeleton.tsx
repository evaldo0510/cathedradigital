import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const PageHeaderSkeleton: React.FC = () => (
  <div className="text-center space-y-3 pt-6 mb-8 animate-pulse">
    <div className="w-8 h-8 mx-auto rounded-full bg-muted" />
    <div className="h-8 w-48 mx-auto bg-muted rounded-lg" />
    <div className="h-4 w-64 mx-auto bg-muted rounded-lg" />
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="h-48 rounded-3xl bg-muted/40 border-none" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-16 rounded-2xl bg-muted/30" />
    ))}
  </div>
);
