'use client';

import * as React from 'react';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { authUtils } from '@/lib/auth';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { PieGraphSkeleton } from './pie-graph-skeleton';

export function PieGraph() {
  const [districts, setDistricts] = React.useState<string[]>([]);
  const [district, setDistrict] = React.useState<string>('');
  const [khorooList, setKhorooList] = React.useState<number[]>([]);
  const [khoroo, setKhoroo] = React.useState<number | ''>('');
  const [data, setData] = React.useState<Array<{ type: string; count: number }>>([]);
  const [loading, setLoading] = React.useState(true);

  // Colors palette
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316'];

  // Fetch districts
  React.useEffect(() => {
    let mounted = true;
    fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.GET_DISTRICT), {
      headers: { ...authUtils.getAuthHeader() }
    })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const list = Array.isArray(json) ? json.map((s: any) => String(s)).filter(Boolean) : [];
        setDistricts(list);
      })
      .catch(() => {})
      .finally(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch khoroo list when district changes
  React.useEffect(() => {
    let mounted = true;
    setKhorooList([]);
    setKhoroo('');
    if (!district) return;
    fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.GET_KHOROO + `?district=${encodeURIComponent(district)}`), {
      headers: { ...authUtils.getAuthHeader() }
    })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const list = Array.isArray(json) ? json.map((n: any) => Number(n)).filter((x) => !Number.isNaN(x)) : [];
        setKhorooList(list);
      })
      .catch(() => {})
      .finally(() => {});

    return () => {
      mounted = false;
    };
  }, [district]);

  // Fetch client type counts when district or khoroo changes
  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (district) params.set('district', district);
    if (khoroo !== '') params.set('khoroo', String(khoroo));

    fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.CLIENT_TYPE_COUNTS + `?${params.toString()}`), {
      headers: { ...authUtils.getAuthHeader() }
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => {
        if (!mounted) return;
        const list = Array.isArray(json) ? json.map((x: any) => ({ type: String(x.type), count: Number(x.count) })) : [];
        setData(list);
      })
      .catch(() => {
        if (!mounted) return;
        setData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [district, khoroo]);

  if (typeof window === 'undefined') return null; // client only

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Хэрэглэгчдийн төрөл</CardTitle>
        <CardDescription>
          <div className='flex items-center gap-3'>
            <label className='sr-only'>District</label>
            <Select value={district === '' ? '__all' : district} onValueChange={(v) => setDistrict(v === '__all' ? '' : v)}>
              <SelectTrigger className='rounded border px-2 py-1 text-sm'>
                <SelectValue placeholder='Бүх дүүрэг' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__all'>Бүх дүүрэг</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className='sr-only'>Khoroo</label>
            <Select value={khoroo === '' ? '__all' : String(khoroo)} onValueChange={(v) => setKhoroo(v === '__all' ? '' : Number(v))}>
              <SelectTrigger className='rounded border px-2 py-1 text-sm'>
                <SelectValue placeholder='Бүх хороо' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__all'>Бүх хороо</SelectItem>
                {khorooList.map((k) => (
                  <SelectItem key={k} value={String(k)}>
                    Хороо {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        {loading ? (
          <PieGraphSkeleton />
        ) : data.length === 0 ? (
          <div className='p-4 text-sm text-muted-foreground'>Мэдээлэл олдсонгүй</div>
        ) : (
          <ChartContainer config={{}} className='mx-auto h-[280px] flex items-center justify-center'>
            <div className='w-full'>
              <ResponsiveContainer width='100%' height={280}>
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={data} dataKey='count' nameKey='type' innerRadius={100} outerRadius={130} label={false}>
                    {data.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex flex-col w-full'>
          {data.map((d, idx) => (
            <div key={d.type} className='flex justify-between py-1 items-center'>
              <div className='flex items-center gap-2'>
                <span className='h-3 w-3 rounded-full' style={{ background: colors[idx % colors.length] }} />
                <span>{d.type}</span>
              </div>
              <span className='font-medium' style={{ color: colors[idx % colors.length] }}>{d.count}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
