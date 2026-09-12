'use client';

import type { Icon } from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface ReportStat {
  title: string;
  value: React.ReactNode;
  hint: string;
  icon: Icon;
  tone: string;
}

/**
 * Тайлангийн нэгдсэн үзүүлэлтийн тор.
 *
 * Идэвх, хоослолт, батерейн гурван тайлан тус бүрдээ ижил 22 мөр JSX-ийг
 * давтаж бичсэн байв — зөвхөн `stats` массив нь ялгаатай.
 */
export function ReportStatsGrid({
  stats,
  loading
}: {
  stats: ReportStat[];
  loading: boolean;
}) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.tone}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <div className='text-2xl font-bold tabular-nums'>
                {stat.value}
              </div>
            )}
            <p className='text-muted-foreground truncate pt-1 text-xs'>
              {stat.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
