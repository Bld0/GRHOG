'use client';

import * as React from 'react';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { BarGraphSkeleton } from './bar-graph-skeleton';
import { LeaderAreaBadge } from '@/components/layout/leader-area-badge';
import { useRolePermissions } from '@/hooks/use-role-permissions';

export const description = 'Хорооны ашиглалтын график';

const chartConfig = {
  value: {
    label: ' Ашиглалт',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

type ApiResponse = {
  total: any;
  labels: string[];
  data: number[];
  range?: string;
  type?: Record<string, number[]>;
  district?: string;
  groupBy?: 'location' | 'bin';
};

// Дүүргийн сонголтгүй: хүсэлт үргэлж Чингэлтэйгээр шүүнэ.
const district = 'Чингэлтэй';

export function BarGraph() {
  const { isKhorooLeader } = useRolePermissions();
  const [range, setRange] = React.useState<
    '12month' | 'month' | 'week' | 'today'
  >('month');
  const [khoroo, setKhoroo] = React.useState<number | ''>('');
  const [khorooList, setKhorooList] = React.useState<number[]>([]);
  const [location, setLocation] = React.useState<string>('');
  // Байршлын сонголтууд = хороогоор задалсан хариуны label-ууд
  const [locations, setLocations] = React.useState<string[]>([]);
  const [groupBy, setGroupBy] = React.useState<'khoroo' | 'location' | 'bin'>(
    'khoroo'
  );
  const [data, setData] = React.useState<
    Array<{ name: string; value: number }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch khoroo list
  React.useEffect(() => {
    let mounted = true;
    apiClient
      .fetchWithAuth(
        buildApiUrl(
          API_CONFIG.ENDPOINTS.DASHBOARD.GET_KHOROO +
            `?district=${encodeURIComponent(district)}`
        )
      )
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        setKhorooList(
          Array.isArray(json)
            ? json.map((n: any) => Number(n)).filter((x) => !Number.isNaN(x))
            : []
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Хороо солигдвол байршлын сонголт хуучирна
  React.useEffect(() => {
    setLocation('');
    setLocations([]);
  }, [khoroo]);

  // Fetch khoroo usage when range or filters change
  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('district', district);
    if (range) params.set('range', range);
    if (khoroo !== '') params.set('khoroo', String(khoroo));
    if (location) params.set('location', location);

    apiClient
      .fetchWithAuth(
        buildApiUrl(`/dashboard/khoroo-usage?${params.toString()}`)
      )
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json: ApiResponse) => {
        if (!mounted) return;
        const labels = Array.isArray(json.labels) ? json.labels : [];
        const values = Array.isArray(json.data) ? json.data : [];
        setGroupBy(json.groupBy ?? 'khoroo');
        if (json.groupBy === 'location') setLocations(labels);

        // chartData үүсгэх - tooltip-д ашиглах
        const chartData = labels.map((label, idx) => {
          const item: any = {
            name: label,
            total: values[idx] ?? 0 // json.data-аас total авах
          };

          // type талбаруудыг нэмэх
          for (const typeKey in json.type) {
            item[typeKey] = json.type[typeKey][idx] ?? 0;
          }

          return item;
        });

        // Bar chart-д ашиглах data
        const mapped = labels.map((label, i) => ({
          name: label,
          value: Number(values[i] ?? 0), // Bar-ын өндөр
          type: chartData // Tooltip-д ашиглах бүх өгөгдөл
        }));

        setData(mapped);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(typeof err === 'string' ? err : (err.message ?? 'Алдаа'));
        setData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [range, khoroo, location]);

  // client-only guard (chart libs may reference window)
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => setIsClient(true), []);
  if (!isClient) return null;

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Хорооны ашиглалт</CardTitle>
          <CardDescription>
            <span className='@[540px]/card:hidden'>
              Хугацаа, хороо, байршил
            </span>
          </CardDescription>
        </div>
        <div className='flex items-center gap-2 px-4 py-3'>
          {/* range buttons */}
          {(['12month', 'month', 'week', 'today'] as const).map((r) => (
            <button
              key={r}
              data-active={range === r}
              onClick={() => setRange(r)}
              className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative rounded px-3 py-2 text-sm'
            >
              {r === '12month'
                ? '12 сар'
                : r === 'month'
                  ? 'Сар'
                  : r === 'week'
                    ? '7 хоног'
                    : 'Өнөөдөр'}
            </button>
          ))}

          <div className='ml-3 flex items-center gap-2'>
            {/* Дарга ганц дүүрэг/хороо хардаг — шүүлтүүрийн оронд статик
                шошго (pie-graph, reports-view-тэй ижил зарчим). */}
            {isKhorooLeader ? (
              <LeaderAreaBadge />
            ) : (
              <Select
                value={khoroo === '' ? '__all' : String(khoroo)}
                onValueChange={(v) => setKhoroo(v === '__all' ? '' : Number(v))}
              >
                <SelectTrigger className='w-[130px] rounded border px-2 py-1 text-sm'>
                  <SelectValue placeholder='Бүх хороо' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__all'>Бүх хороо</SelectItem>
                  {khorooList.map((k) => (
                    <SelectItem key={k} value={String(k)}>
                      {k}-р хороо
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Хороо сонгоогүй үед идэвхгүй (дарга өөрийн хороотой) */}
            <Select
              value={location === '' ? '__all' : location}
              onValueChange={(v) => setLocation(v === '__all' ? '' : v)}
              disabled={!isKhorooLeader && khoroo === ''}
            >
              <SelectTrigger className='w-[180px] rounded border px-2 py-1 text-sm'>
                <SelectValue placeholder='Бүх байршил' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__all'>Бүх байршил</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[300px] w-full'
        >
          {loading ? (
            <BarGraphSkeleton />
          ) : error ? (
            <div className='text-destructive p-4 text-sm'>Алдаа: {error}</div>
          ) : data.length === 0 ? (
            <div className='text-muted-foreground p-4 text-sm'>
              Мэдээлэл олдсонгүй
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data} margin={{ left: 12, right: 12 }}>
                <defs>
                  <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='0%'
                      stopColor={chartConfig.value.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset='100%'
                      stopColor={chartConfig.value.color}
                      stopOpacity={0.2}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey='name'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={{ fill: chartConfig.value.color, opacity: 0.05 }}
                  content={
                    <ChartTooltipContent
                      className='w-[160px]'
                      nameKey='value'
                      labelFormatter={(value) =>
                        groupBy === 'khoroo' ? `Хороо ${value}` : String(value)
                      }
                      formatter={(value, name, props) => {
                        const row = props?.payload ?? {};

                        // type array-с data.name-тэй тэнцэх мэдээллийг олох
                        if (row.type && Array.isArray(row.type)) {
                          const matchedType = row.type.find(
                            (item: any) => item.name === row.name
                          );

                          if (matchedType) {
                            // 0-ээс их утгатай талбаруудыг шүүх
                            const breakdown = Object.entries(matchedType)
                              .filter(([k, v]) => {
                                // exclude name/total keys
                                if (k === 'name' || k === 'total') return false;
                                // coerce/validate numeric value
                                const num =
                                  typeof v === 'number' ? v : Number(v as any);
                                return !Number.isNaN(num) && num > 0;
                              })
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(', ');

                            return (
                              <div className='space-y-1'>
                                <div className='font-semibold'>
                                  Нийт: {matchedType.total}
                                </div>
                                {breakdown && (
                                  <div className='text-muted-foreground text-xs'>
                                    {breakdown}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        }

                        // Тохирох өгөгдөл олдоогүй бол энгийн утга харуулах
                        return [`${value || 0}`];
                      }}
                    />
                  }
                />
                <Bar
                  dataKey='value'
                  fill='url(#fillBar)'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
