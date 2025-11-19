'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RadarPerformanceChartProps {
  data: Array<{
    month: string;
    efficiency: number;
    coverage: number;
  }>;
  className?: string;
}

const radarChartConfig = {
  efficiency: {
    label: "Үр ашиг",
    color: "hsl(var(--chart-efficiency))",
  },
  coverage: {
    label: "Хамрах хүрээ",
    color: "hsl(var(--chart-coverage))",
  },
} satisfies ChartConfig;

export function RadarPerformanceChart({ data, className }: RadarPerformanceChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="items-center pb-4">
        <CardTitle>Системийн гүйцэтгэл</CardTitle>
        <CardDescription>
          Сүүлийн 6 сарын үр ашиг ба хамрах хүрээний харьцуулалт
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={radarChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={data}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid radialLines={false} />
            <Radar
              dataKey="efficiency"
              fill="var(--chart-efficiency)"
              fillOpacity={0}
              stroke="var(--chart-efficiency)"
              strokeWidth={2}
            />
            <Radar
              dataKey="coverage"
              fill="var(--chart-coverage)"
              fillOpacity={0}
              stroke="var(--chart-coverage)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 