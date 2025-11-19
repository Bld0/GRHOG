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
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface LineTrendsChartProps {
  data: Array<{
    month: string;
    collected: number;
    recycled: number;
  }>;
  className?: string;
}

const lineChartConfig = {
  collected: {
    label: "Цуглуулсан хог",
    color: "hsl(var(--chart-collected))",
  },
  recycled: {
    label: "Дахин боловсруулсан",
    color: "hsl(var(--chart-recycled))",
  },
} satisfies ChartConfig;

export function LineTrendsChart({ data, className }: LineTrendsChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Хогийн цуглуулалтын чиг хандлага</CardTitle>
        <CardDescription>1-р сар - 6-р сар 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={lineChartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="collected"
              type="monotone"
              stroke="var(--chart-collected)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="recycled"
              type="monotone"
              stroke="var(--chart-recycled)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 