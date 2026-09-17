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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderAreaBadge } from '@/components/layout/leader-area-badge';
import { useAddressStats } from '@/features/address/api/use-address-stats';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { apiClient } from '@/lib/api-client';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import type {
  ClientActivityReport,
  KhorooActivityRow
} from '@/features/reports/types';

export const description = 'Идэвхгүй хэрэглэгч / өрх хороогоор';

const chartConfig = {
  inactive: {
    label: 'Идэвхгүй',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

const ALL = '__all';

/**
 * Тоолох нэгж.
 *
 * `card` — карт тус бүр. `household` — өрх: түүний БҮХ карт уншуулаагүй бол л
 * идэвхгүй. 3 карттай айлын нэг нь хог хаяж байвал картаар тоолоход хоёр
 * "идэвхгүй" гарч тоо хөөрөгдөнө — өрхөөр тоолох нь хог цуглуулалтад
 * ач холбогдолтой тоо.
 */
type Unit = 'card' | 'household';

export function InactiveClientsGraph() {
  const { isKhorooLeader } = useRolePermissions();
  const [unit, setUnit] = React.useState<Unit>('card');
  const [districts, setDistricts] = React.useState<string[]>([]);
  const [district, setDistrict] = React.useState<string>('');
  const [khoroo, setKhoroo] = React.useState<string>('');
  const [report, setReport] = React.useState<ClientActivityReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Дүүргийн жагсаалт — bar-graph-тай ижил эх сурвалж.
  React.useEffect(() => {
    let mounted = true;
    apiClient
      .fetchWithAuth(
        buildApiUrl(
          API_CONFIG.ENDPOINTS.DASHBOARD.GET_DISTRICT ?? '/dashboard/getDistrict'
        )
      )
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        setDistricts(
          Array.isArray(json) ? json.map((d: any) => String(d)).filter(Boolean) : []
        );
      })
      .catch(() => {
        // Жагсаалт татагдаагүй ч "Бүх дүүрэг" ажиллана.
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Дүүргийн шүүлтүүрийг сервер рүү дамжуулна (хорооны шүүлт нь доорх мөрүүд
  // дээр орон нутагт хийгддэг — тэр нь нэмэлт таталт шаардахгүй).
  React.useEffect(() => {
    if (unit !== 'card') return;
    let mounted = true;
    setLoading(true);
    setError(null);
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    apiClient
      .fetchWithAuth(`/api/reports/client-activity${query}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json: ClientActivityReport) => {
        if (!mounted) return;
        setReport(json);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message ?? 'Алдаа');
        setReport(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [district, unit]);

  const {
    stats,
    loading: householdLoading,
    error: householdError
  } = useAddressStats(district, unit === 'household');

  // Хоёр эх сурвалжийг чарт нэг л хэлбэрээр уншина.
  const rows: KhorooActivityRow[] = React.useMemo(() => {
    if (unit === 'household') {
      return stats.byKhoroo.map((row) => ({
        district: row.district,
        khoroo: row.khoroo,
        total: row.total,
        inactive: row.inactive,
        active: row.total - row.inactive,
        inactivePercent: row.total
          ? Math.round((row.inactive / row.total) * 100)
          : 0
      })) as KhorooActivityRow[];
    }
    return report?.byKhoroo ?? [];
  }, [unit, stats, report]);

  const khoroos = React.useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.khoroo).filter((k) => k != null))
      ).sort((a, b) => Number(a) - Number(b)),
    [rows]
  );

  const data = React.useMemo(
    () =>
      rows
        .filter((r) => (khoroo ? String(r.khoroo) === khoroo : true))
        .map((r) => ({
          name: r.khoroo != null ? `${r.khoroo}-р хороо` : 'Тодорхойгүй',
          district: r.district ?? '-',
          inactive: r.inactive,
          total: r.total,
          inactivePercent: r.inactivePercent
        }))
        .sort((a, b) => b.inactive - a.inactive),
    [rows, khoroo]
  );

  const totalInactive = data.reduce((sum, r) => sum + r.inactive, 0);
  const isLoading = unit === 'household' ? householdLoading : loading;
  const activeError = unit === 'household' ? householdError : error;

  return (
    <Card className='@container/card flex h-full flex-col'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-3'>
          <CardTitle>
            {unit === 'household' ? 'Идэвхгүй өрх' : 'Идэвхгүй хэрэглэгч'}
          </CardTitle>
          <CardDescription>
            {unit === 'household'
              ? `Бүх карт нь 30 хоног уншуулаагүй — нийт ${totalInactive}`
              : `Сүүлийн 30 хоногт карт уншуулаагүй — нийт ${totalInactive}`}
          </CardDescription>
        </div>
        <div className='flex items-center gap-2 px-4 py-3'>
          <Tabs value={unit} onValueChange={(value) => setUnit(value as Unit)}>
            <TabsList>
              <TabsTrigger value='card'>Карт</TabsTrigger>
              <TabsTrigger value='household'>Өрх</TabsTrigger>
            </TabsList>
          </Tabs>
          {isKhorooLeader ? (
            <LeaderAreaBadge />
          ) : (
            <>
              <Select
                value={district === '' ? ALL : district}
                onValueChange={(v) => {
                  setDistrict(v === ALL ? '' : v);
                  setKhoroo('');
                }}
              >
                <SelectTrigger className='w-[160px] rounded border px-2 py-1 text-sm'>
                  <SelectValue placeholder='Бүх дүүрэг' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Бүх дүүрэг</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={khoroo === '' ? ALL : khoroo}
                onValueChange={(v) => setKhoroo(v === ALL ? '' : v)}
              >
                <SelectTrigger className='w-[150px] rounded border px-2 py-1 text-sm'>
                  <SelectValue placeholder='Бүх хороо' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Бүх хороо</SelectItem>
                  {khoroos.map((k) => (
                    <SelectItem key={String(k)} value={String(k)}>
                      {k}-р хороо
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className='flex-1 px-2 pt-4 sm:px-6 sm:pt-6'>
        {isLoading ? (
          <div className='bg-muted h-[300px] w-full animate-pulse rounded' />
        ) : activeError ? (
          <div className='text-destructive p-4 text-sm'>Алдаа: {activeError}</div>
        ) : data.length === 0 ? (
          <div className='text-muted-foreground p-4 text-sm'>
            Мэдээлэл олдсонгүй
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-full w-full'
            style={{ minHeight: Math.max(240, data.length * 34) }}
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
                      formatter={(value, _name, item) => {
                        const row: any = item?.payload;
                        return `${value} / ${row?.total ?? 0} (${row?.inactivePercent ?? 0}%)`;
                      }}
                    />
                  }
                />
                <Bar dataKey='inactive' fill='var(--primary)' radius={4}>
                  <LabelList
                    dataKey='inactive'
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
