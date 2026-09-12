'use client';

import {
  IconAlertTriangle,
  IconBattery,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useAverageBattery,
  useAverageFillLevel,
  useTotalBins,
  useWarningBins
} from '@/hooks/use-bin-stats';

/** Савны жагсаалтын дээрх дөрвөн нэгдсэн үзүүлэлт. */
export function BinStatsCards() {
  const { data: totalBinsData } = useTotalBins();
  const { data: fillLevelData } = useAverageFillLevel();
  const { data: warningData } = useWarningBins();
  const { data: batteryData } = useAverageBattery();

  const totalBins = totalBinsData?.totalBins || 0;
  const activeBins = totalBinsData?.activeBins || 0;
  const criticalBins = warningData?.criticalBins || 0;
  const warningBins = warningData?.warningBins || 0;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Нийт сав'
        icon={<IconTrash className='text-muted-foreground h-4 w-4' />}
        value={String(totalBins)}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span className='text-green-600'>{activeBins} Идэвхтэй</span>
          <span>•</span>
          <span className='text-gray-600'>
            {totalBins - activeBins} Идэвхгүй
          </span>
        </div>
      </StatCard>

      <StatCard
        title='Дундаж дүүргэлтийн түвшин'
        value={`${(fillLevelData?.averageFillLevel || 0).toFixed(2)}%`}
      >
        {/* Дүүргэлт өсөх нь муу шинж — дээш сум. */}
        <TrendLine warning={fillLevelData?.trend.isPositive} direction='up' />
      </StatCard>

      <StatCard
        title='Анхааруулга'
        icon={<IconAlertTriangle className='text-muted-foreground h-4 w-4' />}
        value={String(criticalBins + warningBins)}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span className='text-red-600'>{criticalBins} дүүрэн</span>
          <span>•</span>
          <span className='text-yellow-600'>{warningBins} анхааруулга</span>
        </div>
      </StatCard>

      <StatCard
        title='Дундаж батарей'
        icon={<IconBattery className='text-muted-foreground h-4 w-4' />}
        value={`${(batteryData?.averageBatteryLevel || 0).toFixed(2)}%`}
      >
        {/* Батерей талбарт анхааруулгыг доош сумаар илэрхийлнэ. */}
        <TrendLine warning={batteryData?.trend.isPositive} direction='down' />
      </StatCard>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className='relative flex items-center justify-between pb-3'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Чиг хандлагын мөр. [warning] нь анхааруулгатай эсэх, [direction] нь
 * анхааруулгын үед харуулах сумны чиглэл (дүүргэлт өсөх = дээш, батерей
 * буурах = доош).
 */
function TrendLine({
  warning,
  direction
}: {
  warning: boolean | undefined;
  direction: 'up' | 'down';
}) {
  const WarnIcon = direction === 'up' ? IconTrendingUp : IconTrendingDown;
  const OkIcon = direction === 'up' ? IconTrendingDown : IconTrendingUp;
  const Icon = warning ? WarnIcon : OkIcon;
  const color = warning ? 'text-red-600' : 'text-green-600';
  return (
    <div className='flex items-center gap-1 text-xs'>
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={color}>{warning ? 'анхааруулга' : 'хэвийн'}</span>
    </div>
  );
}
