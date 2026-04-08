import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RechartsCharts = lazy(() => import('./AdminChartsRecharts'));

interface AdminChartsTabProps {
  userGrowth: any[];
  revenueData: any[];
}

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-56 mt-1" />
    </CardHeader>
    <CardContent className="h-[300px] flex items-center justify-center">
      <Skeleton className="h-full w-full rounded" />
    </CardContent>
  </Card>
);

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
