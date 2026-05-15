import React from 'react';
import { SectionSkeleton, HeroSkeleton } from './HomeSkeletons';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="app-container section-spacing stack-spacing">
      <HeroSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
};
