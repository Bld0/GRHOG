'use client';

import {
  IconCreditCard,
  IconTrendingDown,
  IconTrendingUp,
  IconUser,
  IconUserCheck
} from '@tabler/icons-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  useActivityRate,
  useTotalAccess,
  useTotalCards
} from '@/hooks/use-card-stats';

/** Картын жагсаалтын дээрх гурван нэгдсэн үзүүлэлт. */
export function CardStatsCards() {
  const { data: totalCards, loading: totalCardsLoading } = useTotalCards();
  const { data: totalAccess, loading: totalAccessLoading } = useTotalAccess();
  const { data: activityRate, loading: activityRateLoading } =
    useActivityRate();

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3 pr-6'>
      <StatCard title='Нийт Карт' icon={<IconUser className='text-muted-foreground h-4 w-4' />}>
        <div className='text-2xl font-bold'>
          {totalCardsLoading ? '...' : totalCards?.totalCards || 0}
        </div>
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span> идэвхтэй карт </span>
        </div>
      </StatCard>

      <StatCard
        title='Нийт нэвтрэлт'
        icon={<IconCreditCard className='text-muted-foreground h-4 w-4' />}
      >
        <div className='text-2xl font-bold'>
          {totalAccessLoading
            ? '...'
            : totalAccess?.totalAccess.toLocaleString() || '0'}
        </div>
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span>
            Дундаж:{' '}
            {totalAccessLoading
              ? '...'
              : totalAccess?.averageAccessPerCard.toFixed(2) || 0}
            /хүн
          </span>
        </div>
      </StatCard>

      <StatCard
        title='Идэвхжил хувь'
        icon={<IconUserCheck className='text-muted-foreground h-4 w-4' />}
      >
        <div className='text-2xl font-bold'>
          {activityRateLoading ? '...' : activityRate?.activityRate.toFixed(2) || 0}%
        </div>
        <div className='flex items-center gap-1 text-xs'>
          {activityRate?.trend ? (
            <ActivityTrend trend={activityRate.trend} />
          ) : (
            <span className='text-muted-foreground'>Өгөгдөл байхгүй</span>
          )}
        </div>
      </StatCard>
    </div>
  );
}

function StatCard({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ActivityTrend({
  trend
}: {
  trend: { isPositive: boolean; changePercentage: number; period: string };
}) {
  const color = trend.isPositive ? 'text-green-600' : 'text-red-600';
  const Icon = trend.isPositive ? IconTrendingUp : IconTrendingDown;
  return (
    <>
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={color}>
        {trend.isPositive ? '+' : ''}
        {trend.changePercentage.toFixed(2)}%
      </span>
      <span className='text-muted-foreground'>{trend.period}</span>
    </>
  );
}
