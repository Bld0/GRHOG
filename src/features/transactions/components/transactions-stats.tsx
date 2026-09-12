'use client';

import {
  IconActivity,
  IconTrash,
  IconTrendingUp,
  IconWeight
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useActiveBinsToday,
  useOverallAverage,
  useTodayAverage,
  useTodayUsage
} from '@/hooks/use-transaction-stats';

/** Ашиглалтын түүхийн дээрх дөрвөн нэгдсэн үзүүлэлт. */
export function TransactionsStats() {
  const { data: todayUsage, loading: todayUsageLoading } = useTodayUsage();
  const { data: todayAverage, loading: todayAverageLoading } = useTodayAverage();
  const { data: activeBins, loading: activeBinsLoading } = useActiveBinsToday();
  const { data: overallAverage, loading: overallAverageLoading } =
    useOverallAverage();

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Өнөөдрийн ашиглалт'
        icon={<IconActivity className='text-muted-foreground h-4 w-4' />}
        value={todayUsageLoading ? '...' : String(todayUsage?.todayCount || 0)}
        hint='нэвтрэлт'
      />

      <StatCard
        title='Өнөөдрийн дундаж'
        icon={<IconTrendingUp className='text-muted-foreground h-4 w-4' />}
        value={
          todayAverageLoading
            ? '...'
            : `${todayAverage?.todayAverage.toFixed(1) || '0.0'}%`
        }
        hint='дүүргэлтийн түвшин'
      />

      <StatCard
        title='Ашигласан сав'
        icon={<IconTrash className='text-muted-foreground h-4 w-4' />}
        value={
          activeBinsLoading ? '...' : String(activeBins?.todayActiveBins || 0)
        }
        hint={`Нийт ${activeBins?.totalBins || 0} савнаас`}
      />

      <StatCard
        title='Нийт дундаж'
        icon={<IconWeight className='text-muted-foreground h-4 w-4' />}
        value={
          overallAverageLoading
            ? '...'
            : `${overallAverage?.overallAverage.toFixed(1) || '0.0'}%`
        }
        hint='бүх хугацааны'
      />
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  hint
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span>{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
