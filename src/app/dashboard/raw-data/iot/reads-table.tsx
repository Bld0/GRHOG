'use client';

import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { Read } from '../iot-grouping';
import { fmtTime, rowTone } from './iot-format';
import { SlotCell } from './slot-cell';

export function ReadsTable({
  reads,
  startIndex = 0
}: {
  reads: Read[];
  /** Хуудаслалтын эхний дугаар — жагсаалт хуудсаар тасрахгүй үргэлжилнэ. */
  startIndex?: number;
}) {
  // "+N" badge дээр дарахад тухайн уншуулалтын хураагдсан retry-үүд дэлгэгдэнэ
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (reads.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={6}
          className='text-muted-foreground text-center text-sm'
        >
          Илэрц алга.
        </TableCell>
      </TableRow>
    );
  }

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      {reads.map((r, i) => {
        const key = `${r.binId}-${r.at}-${i}`;
        const isOpen = expanded.has(key);
        return (
          <React.Fragment key={key}>
            <TableRow className={rowTone(r)}>
              <TableCell className='text-muted-foreground font-mono text-sm'>
                {startIndex + i + 1}
              </TableCell>
              <TableCell className='font-mono text-sm whitespace-nowrap'>
                {fmtTime(r.at)}
              </TableCell>
              <TableCell className='truncate'>
                <SlotCell slot={r.battery} label='battery' />
              </TableCell>
              <TableCell className='truncate'>
                <SlotCell slot={r.storage} label='storage' />
              </TableCell>
              <TableCell>
                <div className='flex min-w-0 items-center gap-1.5'>
                  <span className='truncate'>
                    <SlotCell slot={r.card} label='card' />
                  </span>
                  {r.duplicates > 0 && (
                    <Badge
                      variant='outline'
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(key);
                      }}
                      title='Дарж давхар уншуулалтуудыг харах'
                      className='h-5 shrink-0 cursor-pointer px-1.5 text-xs'
                    >
                      +{r.duplicates} {isOpen ? '▾' : '▸'}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className='text-right'>
                {r.complete ? (
                  <Badge className='bg-green-500/15 text-green-600 hover:bg-green-500/15'>
                    3/3
                  </Badge>
                ) : (
                  <Badge className='bg-red-600 text-white hover:bg-red-700'>
                    {r.presentCount}/3
                  </Badge>
                )}
              </TableCell>
            </TableRow>
            {isOpen &&
              r.retries.map((rt) => (
                <TableRow key={`${key}-retry-${rt.id}`} className='bg-muted/30'>
                  <TableCell />
                  <TableCell className='text-muted-foreground pl-6 font-mono text-sm whitespace-nowrap'>
                    {fmtTime(rt.at)}
                  </TableCell>
                  <TableCell colSpan={2} className='text-muted-foreground text-sm'>
                    давхар уншуулалт (retry)
                  </TableCell>
                  <TableCell className='font-mono text-sm'>{rt.value || '—'}</TableCell>
                  <TableCell className='text-right'>
                    <Badge variant='outline' className='h-5 px-1.5 text-xs'>
                      retry
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
}
