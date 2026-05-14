import React from 'react';
import { SectionSkeleton, HeroSkeleton } from './HomeSkeletons';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full pt-12 pb-24">
      <div className="w-full max-w-[640px] px-6">
        <HeroSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </div>
  );
};
