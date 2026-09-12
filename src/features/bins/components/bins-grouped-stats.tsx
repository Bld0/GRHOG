'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BinsGroupedStatsProps {
  groupCount: number;
  activeBins: number;
  totalBins: number;
  fullBins: number;
  lowBatteryBins: number;
  avgStorage: number;
  avgBattery: number;
}

/** Бүлэглэсэн харагдацын дөрвөн нэгдсэн үзүүлэлт. */
export function BinsGroupedStats({
  groupCount,
  activeBins,
  totalBins,
  fullBins,
  lowBatteryBins,
  avgStorage,
  avgBattery
}: BinsGroupedStatsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <StatCard title='Бүлэг' value={String(groupCount)} hint='Дүүрэг & Хороо' />

      <StatCard
        title='Идэвхтэй сав'
        value={
          <>
            {activeBins}
            {totalBins > activeBins && (
              <span className='text-muted-foreground text-base font-normal'>
                {' / '}
                {totalBins}
              </span>
            )}
          </>
        }
        hint={`Дүүрсэн: ${fullBins} · Цэнэг бага: ${lowBatteryBins}`}
      />

      <StatCard
        title='Дундаж дүүргэлт'
        value={`${avgStorage.toFixed(2)}%`}
        hint='Бүх савны дундаж'
      />

      <StatCard
        title='Дундаж батарей'
        value={`${avgBattery.toFixed(2)}%`}
        hint='Бүх савны дундаж'
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  hint
}: {
  title: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-muted-foreground text-xs'>{hint}</p>
      </CardContent>
    </Card>
  );
}
