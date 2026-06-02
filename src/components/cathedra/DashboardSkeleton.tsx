import React from 'react';
import { SectionSkeleton, HeroSkeleton } from './HomeSkeletons';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full pt-spacing-2xl pb-spacing-4xl">
      <div className="w-full px-spacing-lg">
        <HeroSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </div>
  );
};
