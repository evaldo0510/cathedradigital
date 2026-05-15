import React, { Suspense, lazy } from 'react';
import { CathedraCard as Card, CathedraCardContent as CardContent, CathedraCardHeader as CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RechartsCharts = lazy(() => import('./AdminChartsRecharts'));

interface AdminChartsTabProps {
  userGrowth: any[];
  revenueData: any[];
}

// Fixed ref warning by wrapping with forwardRef (though we don't use the ref here, 
// some parent component like a motion.div or a Suspense implementation might be trying to pass one)
const ChartSkeleton = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref}>
    <Card>
      <CathedraCardHeader as CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CathedraCardHeader as CardHeader>
      <CathedraCardContent as CardContent className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-full w-full rounded" />
      </CathedraCardContent as CardContent>
    </Card>
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

const AdminChartsTab: React.FC<AdminChartsTabProps> = ({ userGrowth, revenueData }) => (
  <Suspense fallback={
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  }>
    <RechartsCharts userGrowth={userGrowth} revenueData={revenueData} />
  </Suspense>
);

export default AdminChartsTab;
