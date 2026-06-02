import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RechartsCharts = lazy(() => import('./AdminChartsRecharts'));

interface AdminChartsTabProps {
  userGrowth: { name: string; total: number }[];
  revenueData: { name: string; amount: number }[];
}

// Fixed ref warning by wrapping with forwardRef (though we don't use the ref here, 
// some parent component like a motion.div or a Suspense implementation might be trying to pass one)
const ChartSkeleton = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref}>
    <Card>
      <CardHeader>
        <Skeleton className="h-spacing-md w-spacing-4xl" />
        <Skeleton className="h-spacing-md w-spacing-4xl mt-spacing-2xs" />
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-full w-full rounded" />
      </CardContent>
    </Card>
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

const AdminChartsTab: React.FC<AdminChartsTabProps> = ({ userGrowth, revenueData }) => (
  <Suspense fallback={
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-lg">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  }>
    <RechartsCharts userGrowth={userGrowth} revenueData={revenueData} />
  </Suspense>
);

export default AdminChartsTab;
