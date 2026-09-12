'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { TableCell, TableRow } from '@/components/ui/table';
import { BATTERY_JUMP_V, type BinGroup } from '../iot-grouping';
import {
  BATTERY_GROUP_LEFT,
  BATTERY_GROUP_RIGHT,
  MAX_READS_PER_BIN,
  fmtTime,
  pct
} from './iot-format';
import { SlotCell } from './slot-cell';

export function BinSummaryRow({
  group,
  index,
  onClick
}: {
  group: BinGroup;
  /** Жагсаалтын дугаар (1-ээс эхэлнэ). */
  index: number;
  onClick: () => void;
}) {
  const { binId, binName, isActive, registered, latest, batteryChange, stats } =
    group;
  const completePct = pct(stats.complete, stats.totalReads);
  const healthTone =
    stats.complete === stats.totalReads
      ? 'text-green-500'
      : stats.complete / stats.totalReads >= 0.7
        ? 'text-amber-500'
        : 'text-red-500';

  return (
    <TableRow
      className={`cursor-pointer hover:bg-muted/60 transition-colors ${
        latest ? '' : 'opacity-60'
      }`}
      onClick={onClick}
    >
      {/* Жагсаалтын дугаар */}
      <TableCell className='text-muted-foreground font-mono text-sm'>
        {index}
      </TableCell>
      {/* Bin ID + савны нэр (bin.bin_name) */}
      <TableCell>
        <div className='flex items-center gap-1.5'>
          <span className='font-mono text-sm font-semibold'>{binId}</span>
          {isActive === false && (
            <Badge
              variant='outline'
              className='text-muted-foreground h-4 shrink-0 px-1 text-xs'
              title='bin.is_active = false — идэвхгүй бүртгэлтэй сав'
            >
              идэвхгүй
            </Badge>
          )}
          {!registered && (
            <Badge
              variant='outline'
              className='h-4 shrink-0 px-1 text-xs text-amber-500'
              title='bin хүснэгтэд бүртгэлгүй — зөвхөн IoT лог дотор байна'
            >
              бүртгэлгүй
            </Badge>
          )}
        </div>
        <div className='text-muted-foreground font-mono text-sm'>
          {binName ?? '—'}
        </div>
      </TableCell>
      {/* Latest reading time */}
      <TableCell className='font-mono text-sm whitespace-nowrap'>
        {latest ? fmtTime(latest.at) : '—'}
      </TableCell>
      {latest ? (
        <>
          {/* Latest battery — доорх "сольсон огноо"-той нэг бүлэг (BATTERY_GROUP_*) */}
          <TableCell className={`whitespace-nowrap ${BATTERY_GROUP_LEFT}`}>
            <SlotCell slot={latest.battery} label='battery' />
          </TableCell>
          {/* Battery сольсон огноо — вольт хамгийн сүүлд огцом өссөн үе */}
          <TableCell className={`whitespace-nowrap ${BATTERY_GROUP_RIGHT}`}>
            {batteryChange ? (
              <div
                title={`${batteryChange.fromV.toFixed(2)}V → ${batteryChange.toV.toFixed(
                  2
                )}V — баттерей сольсон (+${(
                  batteryChange.toV - batteryChange.fromV
                ).toFixed(2)}V)`}
              >
                <div className='font-mono text-sm'>
                  {fmtTime(batteryChange.at)}
                </div>
                <div className='text-muted-foreground font-mono text-xs'>
                  {batteryChange.fromV.toFixed(2)} → {batteryChange.toV.toFixed(2)}V
                </div>
              </div>
            ) : (
              <span
                className='text-muted-foreground text-sm'
                title={`Сүүлийн ${MAX_READS_PER_BIN} уншуулалтад вольтын огцом өсөлт (≥${BATTERY_JUMP_V}V) илрээгүй`}
              >
                —
              </span>
            )}
          </TableCell>
          {/* Latest storage */}
          <TableCell>
            <SlotCell slot={latest.storage} label='storage' />
          </TableCell>
          {/* Latest card */}
          <TableCell>
            <SlotCell slot={latest.card} label='card' />
          </TableCell>
          {/* Latest integrity */}
          <TableCell>
            {latest.complete ? (
              <Badge className='bg-green-500/15 text-green-600 hover:bg-green-500/15'>
                Бүрэн
              </Badge>
            ) : (
              <Badge className='bg-red-600 text-white hover:bg-red-700'>
                {latest.presentCount}/3
              </Badge>
            )}
          </TableCell>
        </>
      ) : (
        // Battery-гээс эхэлдэг тул бүлгийн зүүн зураас нь тасрахгүй үргэлжилнэ
        <TableCell
          colSpan={5}
          className='text-muted-foreground border-l pl-5 text-sm'
        >
          Уншсан лог алга (хамрагдсан хугацаанд өгөгдөл ирээгүй)
        </TableCell>
      )}
      {/* Total reads + health */}
      <TableCell className='text-right'>
        {latest ? (
          <>
            <span className='text-muted-foreground text-sm'>
              {group.truncated
                ? `${stats.totalReads}+ удаа`
                : `${stats.totalReads} удаа`}
            </span>
            <span className={`ml-2 text-sm font-medium ${healthTone}`}>
              {completePct} бүрэн
            </span>
          </>
        ) : (
          <span className='text-muted-foreground text-sm'>0 удаа</span>
        )}
      </TableCell>
      {/* Action hint */}
      <TableCell className='text-right'>
        <Button variant='ghost' size='sm' className='h-7 px-2 text-sm'>
          Дэлгэрэнгүй
          <Icons.chevronRight className='ml-1 h-3.5 w-3.5' />
        </Button>
      </TableCell>
    </TableRow>
  );
}
