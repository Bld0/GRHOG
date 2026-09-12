'use client';

import { Icons } from '@/components/icons';
import type { Slot } from '../iot-grouping';

export function SlotCell({ slot, label }: { slot: Slot; label: string }) {
  if (slot.received) {
    return (
      <div className='flex items-center gap-1.5'>
        <Icons.check className='h-3.5 w-3.5 shrink-0 text-green-500' />
        <span className='font-mono text-sm'>{slot.value || '—'}</span>
        {/* Ingestion төлөв: DONE бол цэггүй, PENDING шар, FAILED улаан */}
        {slot.status === 'PENDING' && (
          <span
            title='PENDING — queue-д хүлээгдэж байна'
            className='h-2 w-2 shrink-0 rounded-full bg-amber-500'
          />
        )}
        {slot.status === 'FAILED' && (
          <span
            title='FAILED — боловсруулалт бүтэлгүйтсэн'
            className='h-2 w-2 shrink-0 rounded-full bg-red-500'
          />
        )}
      </div>
    );
  }
  return (
    <div className='flex items-center gap-1.5 text-red-500'>
      <Icons.close className='h-3.5 w-3.5 shrink-0' />
      <span className='text-sm'>{label}</span>
    </div>
  );
}

export function StatBox({
  label,
  value,
  sub,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-green-500'
      : tone === 'warn'
        ? 'text-amber-500'
        : tone === 'bad'
          ? 'text-red-500'
          : 'text-foreground';
  return (
    <div className='bg-muted/40 rounded-lg border p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className='text-muted-foreground text-xs'>{sub}</p>}
    </div>
  );
}
