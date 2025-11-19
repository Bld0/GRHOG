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
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  Label,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RadialPerformanceChartProps {
  data: Array<{
    month: string;
    collected: number;
    target: number;
  }>;
  className?: string;
}

const radialChartConfig = {
  collected: {
    label: "Цуглуулсан",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Зорилго",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function RadialPerformanceChart({ data, className }: RadialPerformanceChartProps) {
  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Цуглуулалтын гүйцэтгэл</CardTitle>
        <CardDescription>Сарын зорилготой харьцуулсан</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={radialChartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={data}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const percentage = Math.round((data[0].collected / data[0].target) * 100);
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {percentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Гүйцэтгэл
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="collected"
              stackId="a"
              cornerRadius={5}
              fill="var(--primary)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="target"
              fill="var(--primary)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
              fillOpacity={0.3}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Зорилго биелэлт 70% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {data[0].collected} кг / {data[0].target} кг
        </div>
      </CardFooter>
    </Card>
  );
} 