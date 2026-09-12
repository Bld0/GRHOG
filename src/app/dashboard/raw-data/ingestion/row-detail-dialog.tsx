'use client';

import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import type { IotRow } from '../iot-grouping';
import {
  ENDPOINT_BADGE_CLASS,
  ENDPOINT_LABEL,
  fmtLatency,
  fmtTime
} from './ingestion-format';
import { DetailField, RawBodyView } from './raw-body-view';
import { StatusBadge } from './status-badge';

export function RowDetailDialog({
  row,
  nowMs,
  open,
  onOpenChange
}: {
  row: IotRow | null;
  nowMs: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const parsedPretty = useMemo(() => {
    if (!row?.parsed_data) return null;
    try {
      return JSON.stringify(JSON.parse(row.parsed_data), null, 2);
    } catch {
      return row.parsed_data;
    }
  }, [row]);

  if (!row) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 font-mono text-base'>
            #{row.id}
            <Badge className={ENDPOINT_BADGE_CLASS[row.endpoint] ?? ''}>
              {ENDPOINT_LABEL[row.endpoint] ?? row.endpoint}
            </Badge>
            <StatusBadge row={row} nowMs={nowMs} />
          </DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {row.endpoint}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Timeline */}
          <div className='bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border p-3 text-xs'>
            <span>
              Ирсэн: <span className='font-mono'>{fmtTime(row.received_at)}</span>
            </span>
            <Icons.chevronRight className='text-muted-foreground h-3 w-3' />
            <span>
              Боловсруулсан:{' '}
              <span className='font-mono'>{fmtTime(row.processed_at)}</span>
            </span>
            <span className='text-muted-foreground'>
              (хоцролт {fmtLatency(row)}, оролдлого {row.attempts ?? 0})
            </span>
          </div>

          <DetailField label='Ирсэн түүхий өгөгдөл (raw_body)'>
            <RawBodyView raw={row.raw_body} />
          </DetailField>

          <DetailField label='Backend-ийн ойлгосон өгөгдөл (parsed_data)'>
            {parsedPretty ? (
              <pre className='bg-muted overflow-auto rounded-lg p-3 font-mono text-xs whitespace-pre-wrap'>
                {parsedPretty}
              </pre>
            ) : (
              <p className='text-muted-foreground text-sm'>
                Parse хийгдээгүй
              </p>
            )}
          </DetailField>

          {row.last_error && (
            <DetailField label='Сүүлийн алдаа (last_error)'>
              <pre className='overflow-auto rounded-lg border border-red-500/30 bg-red-500/5 p-3 font-mono text-xs break-all whitespace-pre-wrap text-red-600 dark:text-red-400'>
                {row.last_error}
              </pre>
            </DetailField>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
