'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Sector,
  Label,
} from 'recharts';
import { PieSectorDataItem } from "recharts/types/polar/Pie";

interface PieInteractiveChartProps {
  data: Array<{
    month: string;
    binCount: number;
    fill: string;
  }>;
  className?: string;
}

const pieInteractiveConfig = {
  binCount: {
    label: "Савны тоо",
  },
  khoroolol_a: {
    label: "А хороолол",
    color: "hsl(var(--chart-efficiency))",
  },
  khoroolol_b: {
    label: "Б хороолол",
    color: "hsl(var(--chart-coverage))",
  },
  khoroolol_c: {
    label: "В хороолол",
    color: "hsl(var(--chart-coverage))",
  },
  khoroolol_d: {
    label: "Г хороолол",
    color: "hsl(var(--chart-collected))",
  },
  khoroolol_e: {
    label: "Д хороолол",
    color: "hsl(var(--chart-recycled))",
  },
} satisfies ChartConfig;

export function PieInteractiveChart({ data, className }: PieInteractiveChartProps) {
  const [activeMonth, setActiveMonth] = useState(data[0].month);
  const activeIndex = React.useMemo(
    () => data.findIndex((item) => item.month === activeMonth),
    [activeMonth, data]
  );
  const months = React.useMemo(() => data.map((item) => item.month), [data]);

  return (
    <Card data-chart="pie-interactive" className={`flex flex-col ${className}`}>
      <ChartStyle id="pie-interactive" config={pieInteractiveConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Хороололын савны тархац</CardTitle>
          <CardDescription>А - Д хороололын савны тоо</CardDescription>
        </div>
        <Select value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Сар сонгох" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {months.map((key) => {
              const config = pieInteractiveConfig[key as keyof typeof pieInteractiveConfig]

              if (!config) {
                return null
              }

              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: "var(--primary)"
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id="pie-interactive"
          config={pieInteractiveConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="binCount"
              nameKey="month"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {data[activeIndex].binCount.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Савны тоо
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 