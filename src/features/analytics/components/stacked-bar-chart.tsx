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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface StackedBarChartProps {
  data: Array<{
    month: string;
    organic: number;
    plastic: number;
    paper: number;
    glass: number;
  }>;
  className?: string;
}

const stackedBarConfig = {
  organic: {
    label: "Органик",
    color: "hsl(var(--chart-organic))",
  },
  plastic: {
    label: "Хуванцар",
    color: "hsl(var(--chart-plastic))",
  },
  paper: {
    label: "Цаас",
    color: "hsl(var(--chart-paper))",
  },
  glass: {
    label: "Шил",
    color: "hsl(var(--chart-glass))",
  },
} satisfies ChartConfig;

export function StackedBarChart({ data, className }: StackedBarChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Хогийн төрлөөр ангилал</CardTitle>
        <CardDescription>1-р сар - 6-р сар 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={stackedBarConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="organic"
              stackId="a"
              fill="var(--chart-organic)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="plastic"
              stackId="a"
              fill="var(--chart-plastic)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="paper"
              stackId="a"
              fill="var(--chart-paper)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="glass"
              stackId="a"
              fill="var(--chart-glass)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 