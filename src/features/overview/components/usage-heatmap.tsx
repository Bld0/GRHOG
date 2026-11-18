'use client';

import * as React from 'react';
import { buildApiUrl } from '@/config/api';
import { apiClient } from '@/lib/api-client';

type HeatmapResponse = {
  locations: string[];
  buckets: string[]; // yyyy-MM-dd эсвэл yyyy-MM
  values: number[][];
};

const LEVELS = 5;

// Өнгөний түвшин бүр тоонуудын ойролцоо мужийг илэрхийлнэ.
function level(v: number, max: number) {
  return v <= 0 || max <= 0 ? 0 : Math.ceil((v / max) * LEVELS);
}

function levelRange(k: number, max: number) {
  if (k === 0) return '0';
  const step = max / LEVELS;
  const hi = Math.floor(k * step);
  const lo = Math.min(Math.floor((k - 1) * step) + 1, hi);
  return lo === hi ? `≈ ${hi}` : `≈ ${lo}–${hi}`;
}

function levelColor(k: number) {
  return k === 0
    ? 'var(--muted)'
    : `color-mix(in oklch, var(--primary) ${(k / LEVELS) * 100}%, transparent)`;
}

export function UsageHeatmap({
  district,
  range,
  khoroo
}: {
  district: string;
  range: 'week' | 'month' | '12month';
  khoroo: number | '';
}) {
  const [data, setData] = React.useState<HeatmapResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setData(null);
    setError(null);
    const params = new URLSearchParams({ district, range });
    if (khoroo !== '') params.set('khoroo', String(khoroo));
    apiClient
      .fetchWithAuth(buildApiUrl(`/dashboard/usage-heatmap?${params}`))
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json: HeatmapResponse) => mounted && setData(json))
      .catch((err) => mounted && setError(err.message ?? 'Алдаа'));
    return () => {
      mounted = false;
    };
  }, [district, range, khoroo]);

  if (error)
    return <div className='text-destructive p-4 text-sm'>Алдаа: {error}</div>;
  if (!data)
    return <div className='bg-muted h-[300px] w-full animate-pulse rounded' />;
  if (data.locations.length === 0)
    return (
      <div className='text-muted-foreground p-4 text-sm'>
        Мэдээлэл олдсонгүй
      </div>
    );

  const max = Math.max(0, ...data.values.flat());
  const monthly = range === '12month';
  const short = (b: string) => (monthly ? b.slice(0, 7) : b.slice(5));

  return (
    <div className='space-y-3'>
      <div className='max-h-[300px] overflow-auto'>
        <div
          className='grid gap-[2px] text-xs'
          style={{
            gridTemplateColumns: `minmax(90px, max-content) repeat(${data.buckets.length}, minmax(14px, 1fr))`
          }}
        >
          {data.locations.map((loc, row) => (
            <React.Fragment key={loc}>
              <div className='text-muted-foreground truncate pr-2 leading-5'>
                {loc}
              </div>
              {data.values[row].map((v, col) => {
                const k = level(v, max);
                return (
                  <div
                    key={col}
                    className='h-5 rounded-sm'
                    style={{ background: levelColor(k) }}
                    title={`${loc} · ${data.buckets[col]}\n${levelRange(k, max)} удаа`}
                  />
                );
              })}
            </React.Fragment>
          ))}
          <div />
          {data.buckets.map((b, i) => (
            <div
              key={b}
              className='text-muted-foreground text-center text-[10px]'
            >
              {/* Өдрийн горимд шошго давхцахгүйн тулд цөөн харуулна */}
              {monthly || data.buckets.length <= 8 || i % 5 === 0
                ? short(b)
                : ''}
            </div>
          ))}
        </div>
      </div>
      <div className='text-muted-foreground flex items-center justify-end gap-1 text-xs'>
        <span>Бага</span>
        {Array.from({ length: LEVELS + 1 }, (_, k) => (
          <div
            key={k}
            className='h-3 w-4 rounded-sm'
            style={{ background: levelColor(k) }}
            title={`${levelRange(k, max)} удаа`}
          />
        ))}
        <span>Их</span>
      </div>
    </div>
  );
}
