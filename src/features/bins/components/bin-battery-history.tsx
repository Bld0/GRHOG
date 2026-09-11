'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/lib/api-client';

interface BatteryPoint {
  day: string;
  percent: number;
  minPercent: number;
  maxPercent: number;
  voltage: number;
}

const chartConfig = {
  percent: {
    label: 'Өдрийн дундаж',
    color: 'hsl(142 71% 45%)'
  },
  range: {
    label: 'Өдрийн доод–дээд',
    color: 'hsl(142 40% 55%)'
  }
} satisfies ChartConfig;

const RANGES = [
  { label: '7 хоног', days: 7 },
  { label: '30 хоног', days: 30 },
  { label: '90 хоног', days: 90 }
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Савны батерейн өдрийн муруй.
 *
 * Цэнэглэлт (огцом өсөлт) ба зарцуулалтын хурд энэ график дээр нүдэнд шууд
 * харагдана — тухайн савны батерей хэр удаан тэсэж байгааг эндээс мэдэж болно.
 */
export function BinBatteryHistory({ binId }: { binId: string | number }) {
  const [points, setPoints] = useState<BatteryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: daysAgo(days),
        endDate: new Date().toISOString().slice(0, 10)
      });
      const response = await apiClient.fetchWithAuth(
        `/api/bins/${binId}/battery-history?${params}`
      );
      if (response.ok) {
        setPoints(await response.json());
      }
    } catch {
      // График нь савны дэлгэрэнгүйн нэмэлт хэсэг — татагдахгүй бол хуудсыг
      // бүхэлд нь алдаагаар дүүргэхгүй, хоосон төлөв харуулна.
    } finally {
      setIsLoading(false);
    }
  }, [binId, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const latest = points.length > 0 ? points[points.length - 1] : null;

  // Цэг бүр нэг ӨДРИЙН дундаж — тухайн агшны заалт биш. Зөвхөн дундажийг
  // зурвал батерей дуусаад солигдсон өдөр хамгийн сонирхолтой хоёр утга
  // (0% хүртэл унасан, дараа нь 100% болсон) дундажид уусаж алга болно.
  // Доод–дээдийн туузыг ард нь зурж энэ хоёрыг харуулна.
  const chartData = points.map((point) => ({
    ...point,
    range: [point.minPercent, point.maxPercent] as [number, number]
  }));

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Батерейн түүх</CardTitle>
            <CardDescription>
              {latest
                ? `Сүүлийн өдрийн дундаж: ${latest.percent.toFixed(1)}% (${latest.voltage.toFixed(2)}V)`
                : 'Өдрийн дундаж цэнэгийн хувь'}
            </CardDescription>
          </div>
          <div className='flex gap-1'>
            {RANGES.map((range) => (
              <Button
                key={range.days}
                variant={days === range.days ? 'default' : 'outline'}
                size='sm'
                onClick={() => setDays(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-56 w-full' />
        ) : points.length === 0 ? (
          <div className='text-muted-foreground py-12 text-center text-sm'>
            Энэ хугацаанд батерейн хэмжилт бүртгэгдээгүй байна.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='h-56 w-full'>
            <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id='batteryFill' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='0%'
                    stopColor='var(--color-percent)'
                    stopOpacity={0.35}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--color-percent)'
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='day'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(value: number) => `${value}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) =>
                      name === 'range' ? (
                        <span className='text-muted-foreground'>
                          Доод–дээд: {(value as [number, number])[0].toFixed(1)}%
                          – {(value as [number, number])[1].toFixed(1)}%
                        </span>
                      ) : (
                        <span>
                          Өдрийн дундаж:{' '}
                          <span className='font-medium tabular-nums'>
                            {Number(value).toFixed(1)}%
                          </span>{' '}
                          ({item.payload.voltage.toFixed(2)}V)
                        </span>
                      )
                    }
                  />
                }
              />
              <Area
                dataKey='range'
                type='monotone'
                stroke='none'
                fill='var(--color-range)'
                fillOpacity={0.18}
              />
              <Area
                dataKey='percent'
                type='monotone'
                stroke='var(--color-percent)'
                strokeWidth={2}
                fill='url(#batteryFill)'
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
