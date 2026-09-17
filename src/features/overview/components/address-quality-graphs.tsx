'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useAddressStats } from '@/features/address/api/use-address-stats';

const chartConfig = {
  value: { label: 'Тоо', color: 'var(--primary)' }
} satisfies ChartConfig;

/**
 * Өрх бүрт хэдэн карт ноогдож байгаа нь.
 *
 * Хоёр зүйлийг зэрэг харуулна: бодит олон карттай айлууд, ба эвдэрсэн өгөгдөл —
 * "4+" багана хэт өндөр бол нэг байрны бүх айлыг нэг тоот дор бүртгэсэн байна
 * гэсэн үг (backfill-ийн V3 шалгалтын байнгын харагдац).
 */
export function AddressCardDistributionGraph({
  district = ''
}: {
  district?: string;
}) {
  const { stats, loading, error } = useAddressStats(district);

  const data = React.useMemo(
    () =>
      stats.cardDistribution.map((row) => ({
        name: row.cards >= 4 ? '4+ карт' : `${row.cards} карт`,
        value: row.addresses
      })),
    [stats]
  );

  const totalAddresses = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className='@container/card flex h-full flex-col'>
      <CardHeader className='border-b'>
        <CardTitle>Өрхийн картын тархалт</CardTitle>
        <CardDescription>
          Нийт {totalAddresses} хаяг — өрхөд ноогдох картын тоогоор
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 px-2 pt-4 sm:px-6 sm:pt-6'>
        {loading ? (
          <div className='bg-muted h-[240px] w-full animate-pulse rounded' />
        ) : error ? (
          <div className='text-destructive p-4 text-sm'>Алдаа: {error}</div>
        ) : totalAddresses === 0 ? (
          <div className='text-muted-foreground p-4 text-sm'>
            Хаягийн бүртгэл хоосон байна.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-full w-full'
            style={{ minHeight: 240 }}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey='name' tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip
                  cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey='value' fill='var(--primary)' radius={4}>
                  <LabelList
                    dataKey='value'
                    position='top'
                    className='fill-foreground'
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Хаяггүй үлдсэн картууд хороогоор — цэвэрлэх ажлын жагсаалт.
 *
 * "Ажилтан" төрлийн карт хаяггүй байх нь зөв тул тооллогоос гардаг. Өгөгдөл
 * цэгцрэх тусам энэ чарт өөрөө тэглэрнэ.
 */
export function MissingAddressGraph({
  district = ''
}: {
  district?: string;
}) {
  const { stats, loading, error } = useAddressStats(district);

  const data = React.useMemo(
    () =>
      stats.incompleteByKhoroo
        .map((row) => ({
          name: row.khoroo != null ? `${row.khoroo}-р хороо` : 'Хороо дутуу',
          district: row.district ?? 'Дүүрэг дутуу',
          value: row.cards
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
    [stats]
  );

  const totalMissing = stats.incompleteByKhoroo.reduce(
    (sum, row) => sum + row.cards,
    0
  );

  return (
    <Card className='@container/card flex h-full flex-col'>
      <CardHeader className='border-b'>
        <CardTitle>Хаяг дутуу карт</CardTitle>
        <CardDescription>
          Өрхөд холбогдоогүй — нийт {totalMissing}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 px-2 pt-4 sm:px-6 sm:pt-6'>
        {loading ? (
          <div className='bg-muted h-[240px] w-full animate-pulse rounded' />
        ) : error ? (
          <div className='text-destructive p-4 text-sm'>Алдаа: {error}</div>
        ) : totalMissing === 0 ? (
          <div className='text-muted-foreground p-4 text-sm'>
            Бүх карт хаягтай. 👍
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-full w-full'
            style={{ minHeight: Math.max(240, data.length * 30) }}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={data}
                layout='vertical'
                margin={{ left: 12, right: 36 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type='number' tickLine={false} axisLine={false} />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={96}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                  content={
                    <ChartTooltipContent
                      className='w-[200px]'
                      labelFormatter={(label, payload) => {
                        const row: any = payload?.[0]?.payload;
                        return row ? `${row.district} ${label}` : String(label);
                      }}
                    />
                  }
                />
                <Bar dataKey='value' fill='var(--primary)' radius={4}>
                  <LabelList
                    dataKey='value'
                    position='right'
                    className='fill-foreground'
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
