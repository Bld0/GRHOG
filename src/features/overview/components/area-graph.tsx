'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useCollectionTrends } from '@/hooks/use-api-data';
import { CollectionTrends } from '@/types';

const chartConfig = {
  visitors: {
    label: 'Цуглуулалт',
    color: 'var(--primary)'
  },
  collection: {
    label: 'Хогийн цуглуулалт',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  const { data, loading, error } = useCollectionTrends();

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <div className='h-6 bg-muted animate-pulse rounded mb-2' />
          <div className='h-4 bg-muted animate-pulse rounded' />
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='h-[250px] bg-muted animate-pulse rounded' />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Сарын цуглуулалтын график - Давхарласан</CardTitle>
          <CardDescription>
            Сүүлийн 6 сарын хогийн цуглуулалт
          </CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='h-[250px] flex items-center justify-center text-red-600'>
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.trends.map((trend: any) => ({
    month: trend.month,
    collection: trend.collection
  }));

  const totalCollection = data.totalCollection;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Сарын цуглуулалтын график - Давхарласан</CardTitle>
        <CardDescription>
          Сүүлийн 6 сарын хогийн цуглуулалт
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillCollection' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-collection)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-collection)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='collection'
              type='natural'
              fill='url(#fillCollection)'
              stroke='var(--color-collection)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Нийт цуглуулалт: {totalCollection}
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {chartData[0]?.month} - {chartData[chartData.length - 1]?.month}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
