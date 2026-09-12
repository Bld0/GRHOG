'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IotRow } from '../iot-grouping';
import { fmtLatency, isStuckPending } from './ingestion-format';

export function StatusBadge({ row, nowMs }: { row: IotRow; nowMs: number }) {
  if (row.status === 'DONE') {
    return (
      <Badge className='bg-green-500/15 text-green-600 hover:bg-green-500/15'>
        DONE
      </Badge>
    );
  }
  if (row.status === 'FAILED') {
    return <Badge className='bg-red-600 text-white hover:bg-red-700'>FAILED</Badge>;
  }
  if (row.status === 'PENDING') {
    return isStuckPending(row, nowMs) ? (
      <Badge className='bg-red-500/15 text-red-600 hover:bg-red-500/15'>
        PENDING ⚠
      </Badge>
    ) : (
      <Badge className='bg-amber-500/15 text-amber-600 hover:bg-amber-500/15'>
        PENDING
      </Badge>
    );
  }
  // status NULL — queue-д ороогүй хуучин мөр
  return <Badge variant='outline'>—</Badge>;
}

/** Summary chip — тоолуур + шүүлтүүрийн товч. */
export function StatChip({
  label,
  count,
  active,
  tone,
  onClick
}: {
  label: string;
  count: number;
  active: boolean;
  tone: 'default' | 'good' | 'warn' | 'bad';
  onClick: () => void;
}) {
  const dotClass =
    tone === 'good'
      ? 'bg-green-500'
      : tone === 'warn'
        ? 'bg-amber-500'
        : tone === 'bad'
          ? 'bg-red-500'
          : 'bg-muted-foreground';
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size='sm'
      onClick={onClick}
      className='h-8 gap-1.5'
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
      <span className='font-mono text-xs'>{count}</span>
    </Button>
  );
}
