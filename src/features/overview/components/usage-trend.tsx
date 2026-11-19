'use client';

import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { buildApiUrl } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export type TrendPeriod = 'week' | 'month' | 'quarter' | 'year';

type TrendRow = {
  key: string;
  current: number;
  previous: number;
  series: number[];
};

type TrendResponse = {
  period: TrendPeriod;
  level: 'khoroo' | 'location' | 'bin';
  bucketDays: number;
  buckets: string[]; // bucket бүрийн эхний өдөр, yyyy-MM-dd
  current: { total: number; series: number[] };
  previous: { total: number; series: number[] };
  rows: TrendRow[];
  khoroo: number | null;
};

export const TREND_PERIODS: {
  value: TrendPeriod;
  label: string;
  days: number;
  prev: string;
}[] = [
  { value: 'week', label: '7 хоног', days: 7, prev: 'өмнөх 7 хоногоос' },
  { value: 'month', label: 'Сар', days: 30, prev: 'өмнөх 30 өдрөөс' },
  { value: 'quarter', label: 'Улирал', days: 91, prev: 'өмнөх улирлаас' },
  { value: 'year', label: 'Жил', days: 364, prev: 'өмнөх жилээс' }
];

// Энэ үе = accent цэнхэр, өмнөх үе = саарал (emphasis хэлбэр). Өсөлт/бууралт =
// цэнхэр/улбар шар diverging хос, үргэлж ▲/▼ тэмдэг, тэмдэгтэй хамт.
const COLOR_VARS =
  '[--trend-cur:#2a78d6] [--trend-prev:#898781] [--trend-up:#2a78d6] [--trend-down:#eb6834] ' +
  'dark:[--trend-cur:#3987e5] dark:[--trend-up:#3987e5] dark:[--trend-down:#d95926]';

const fmt = (n: number) => n.toLocaleString('en-US');

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0)
    return (
      <span className='text-muted-foreground'>{cur > 0 ? 'Шинэ' : '—'}</span>
    );
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return <span className='text-muted-foreground'>0%</span>;
  const up = pct > 0;
  return (
    <span className='inline-flex items-center gap-1 tabular-nums'>
      <span
        aria-hidden
        style={{ color: up ? 'var(--trend-up)' : 'var(--trend-down)' }}
      >
        {up ? '▲' : '▼'}
      </span>
      {up ? '+' : '−'}
      {Math.abs(pct)}%
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 96,
    h = 24,
    pad = 3;
  const max = Math.max(1, ...values);
  const x = (i: number) =>
    pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1);
  const y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  const last = values.length - 1;
  return (
    <svg width={w} height={h} aria-hidden className='shrink-0'>
      <polyline
        points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        fill='none'
        stroke='var(--trend-prev)'
        strokeWidth={1.5}
        strokeLinejoin='round'
        strokeLinecap='round'
      />
      {last >= 0 && (
        <circle
          cx={x(last)}
          cy={y(values[last])}
          r={2.5}
          fill='var(--trend-cur)'
        />
      )}
    </svg>
  );
}

const shortDate = (iso: string) => iso.slice(5).replace('-', '/');
const minusDays = (iso: string, d: number) => {
  const t = new Date(iso + 'T00:00:00');
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};

export function UsageTrend({
  district,
  period,
  isLeader
}: {
  district: string;
  period: TrendPeriod;
  isLeader: boolean;
}) {
  const [khoroo, setKhoroo] = React.useState<number | ''>('');
  const [location, setLocation] = React.useState('');
  const [data, setData] = React.useState<TrendResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ district, period });
    if (khoroo !== '') params.set('khoroo', String(khoroo));
    if (location) params.set('location', location);
    apiClient
      .fetchWithAuth(buildApiUrl(`/dashboard/usage-trend?${params}`))
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json: TrendResponse) => mounted && setData(json))
      .catch((err) => mounted && setError(err.message ?? 'Алдаа'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [district, period, khoroo, location]);

  const meta = TREND_PERIODS.find((p) => p.value === period)!;

  if (error)
    return <div className='text-destructive p-4 text-sm'>Алдаа: {error}</div>;
  if (!data)
    return <div className='bg-muted h-[420px] w-full animate-pulse rounded' />;

  const level = data.level;
  const rowLabel = (key: string) =>
    level === 'khoroo' && key !== 'Тодорхойгүй' ? `${key}-р хороо` : key;
  const drill = (key: string) => {
    if (key === 'Тодорхойгүй') return;
    if (level === 'khoroo') setKhoroo(Number(key));
    else if (level === 'location') setLocation(key);
  };

  const chartData = data.buckets.map((b, i) => ({
    date: b,
    current: data.current.series[i] ?? 0,
    previous: data.previous.series[i] ?? 0
  }));

  const crumbs: { label: string; onClick?: () => void }[] = [];
  if (!isLeader)
    crumbs.push({
      label: 'Бүх хороо',
      onClick:
        khoroo !== ''
          ? () => {
              setKhoroo('');
              setLocation('');
            }
          : undefined
    });
  if (data.khoroo != null)
    crumbs.push({
      label: `${data.khoroo}-р хороо`,
      onClick: location ? () => setLocation('') : undefined
    });
  if (location) crumbs.push({ label: location });

  const levelName =
    level === 'khoroo' ? 'Хороо' : level === 'location' ? 'Байршил' : 'Сав';

  return (
    <div
      className={`${COLOR_VARS} space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}
    >
      {/* Breadcrumb — мөр дээр дарж задална, энд дарж буцна */}
      <nav className='text-muted-foreground flex flex-wrap items-center gap-1 text-sm'>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span aria-hidden>›</span>}
            {c.onClick ? (
              <button
                onClick={c.onClick}
                className='hover:text-foreground underline-offset-4 hover:underline'
              >
                {c.label}
              </button>
            ) : (
              <span className='text-foreground font-medium'>{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Stat tile + энэ үе vs өмнөх үе */}
      <div className='grid gap-4 md:grid-cols-[180px_1fr]'>
        <div className='space-y-1'>
          <div className='text-muted-foreground text-sm'>
            Сүүлийн {meta.days} өдөр
          </div>
          <div className='text-3xl font-semibold'>
            {fmt(data.current.total)}
          </div>
          <div className='text-sm'>
            <Delta cur={data.current.total} prev={data.previous.total} />{' '}
            <span className='text-muted-foreground'>{meta.prev}</span>
          </div>
          <div className='text-muted-foreground text-xs'>
            Өмнөх үе: {fmt(data.previous.total)}
          </div>
          <div className='text-muted-foreground flex flex-col gap-1 pt-3 text-xs'>
            <span className='flex items-center gap-2'>
              <span
                className='inline-block h-0.5 w-4'
                style={{ background: 'var(--trend-cur)' }}
              />
              Энэ үе
            </span>
            <span className='flex items-center gap-2'>
              <span
                className='inline-block h-0.5 w-4'
                style={{ background: 'var(--trend-prev)' }}
              />
              Өмнөх үе
            </span>
          </div>
        </div>
        <div className='h-[200px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke='var(--border)' />
              <XAxis
                dataKey='date'
                tickFormatter={shortDate}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof chartData)[number];
                  const span =
                    data.bucketDays > 1 ? ` (${data.bucketDays} хоног)` : '';
                  return (
                    <div className='bg-popover text-popover-foreground rounded border px-3 py-2 text-xs shadow'>
                      <div className='flex items-center gap-2'>
                        <span
                          className='inline-block h-0.5 w-3'
                          style={{ background: 'var(--trend-cur)' }}
                        />
                        <span className='font-semibold tabular-nums'>
                          {fmt(p.current)}
                        </span>
                        <span className='text-muted-foreground'>
                          {p.date}
                          {span}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span
                          className='inline-block h-0.5 w-3'
                          style={{ background: 'var(--trend-prev)' }}
                        />
                        <span className='font-semibold tabular-nums'>
                          {fmt(p.previous)}
                        </span>
                        <span className='text-muted-foreground'>
                          {minusDays(p.date, meta.days)}
                          {span}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                dataKey='previous'
                stroke='var(--trend-prev)'
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey='current'
                stroke='var(--trend-cur)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Түвшин бүрийн жагсаалт — графикийн хүснэгт хувилбар */}
      {data.rows.length === 0 ? (
        <div className='text-muted-foreground p-4 text-sm'>
          Мэдээлэл олдсонгүй
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='text-muted-foreground text-xs'>
              <tr className='border-b'>
                <th className='py-2 text-left font-normal'>{levelName}</th>
                <th className='py-2 text-left font-normal'>Чиг хандлага</th>
                <th className='py-2 text-right font-normal'>Энэ үе</th>
                <th className='py-2 text-right font-normal'>Өмнөх үе</th>
                <th className='py-2 text-right font-normal'>Өөрчлөлт</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const clickable = level !== 'bin' && r.key !== 'Тодорхойгүй';
                return (
                  <tr
                    key={r.key}
                    onClick={clickable ? () => drill(r.key) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => e.key === 'Enter' && drill(r.key)
                        : undefined
                    }
                    tabIndex={clickable ? 0 : undefined}
                    className={`border-b last:border-0 ${clickable ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
                  >
                    <td className='py-2 pr-3'>
                      {rowLabel(r.key)}
                      {clickable && (
                        <span className='text-muted-foreground ml-1'>›</span>
                      )}
                    </td>
                    <td className='py-2 pr-3'>
                      <Sparkline values={r.series} />
                    </td>
                    <td className='py-2 text-right font-medium tabular-nums'>
                      {fmt(r.current)}
                    </td>
                    <td className='text-muted-foreground py-2 text-right tabular-nums'>
                      {fmt(r.previous)}
                    </td>
                    <td className='py-2 text-right'>
                      <Delta cur={r.current} prev={r.previous} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
