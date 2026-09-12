'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';

import { type IotRow } from './iot-grouping';
import {
  ENDPOINT_BADGE_CLASS,
  ENDPOINT_LABEL,
  PAGE_SIZE,
  type EndpointFilter,
  type StatusFilter,
  fmtLatency,
  fmtTime,
  isStuckPending,
  rowValue
} from './ingestion/ingestion-format';
import { RowDetailDialog } from './ingestion/row-detail-dialog';
import { StatChip, StatusBadge } from './ingestion/status-badge';
import { useIngestionRows } from './ingestion/use-ingestion-rows';

/**
 * IoT хүсэлтийн түүхий лог — зохицуулалт л хийнэ.
 *
 * Таталт `useIngestionRows`-д, мөрийн/цонхны JSX `ingestion/` доторх
 * component-уудад. Өмнө нь энэ бүхэн 686 мөрийн нэг файлд байв.
 */
export function IngestionTable() {
  const {
    rows,
    status,
    nowMs,
    autoRefresh,
    setAutoRefresh,
    lastFetchedAt,
    refetch
  } = useIngestionRows();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [endpointFilter, setEndpointFilter] = useState<EndpointFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<IotRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const counts = useMemo(() => {
    const all = rows ?? [];
    return {
      total: all.length,
      done: all.filter((r) => r.status === 'DONE').length,
      pending: all.filter((r) => r.status === 'PENDING').length,
      failed: all.filter((r) => r.status === 'FAILED').length,
      stuck: all.filter((r) => isStuckPending(r, nowMs)).length
    };
  }, [rows, nowMs]);

  const filtered = useMemo(() => {
    let out = rows ?? [];
    if (statusFilter === 'STUCK') {
      out = out.filter((r) => isStuckPending(r, nowMs));
    } else if (statusFilter !== 'ALL') {
      out = out.filter((r) => r.status === statusFilter);
    }
    if (endpointFilter !== 'ALL') {
      out = out.filter((r) => r.endpoint === endpointFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const { binId, value } = rowValue(r);
        return (
          binId.toLowerCase().includes(q) ||
          value.toLowerCase().includes(q) ||
          (r.raw_body ?? '').toLowerCase().includes(q)
        );
      });
    }
    return out;
  }, [rows, statusFilter, endpointFilter, search, nowMs]);

  // Шүүлтүүр өөрчлөгдөхөд 1-р хуудас руу буцна
  useEffect(() => {
    setPage(1);
  }, [statusFilter, endpointFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (f: StatusFilter) =>
    setStatusFilter((prev) => (prev === f ? 'ALL' : f));

  return (
    <>
      <Card>
        <CardHeader className='space-y-3 pb-3'>
          <div className='flex flex-row items-start justify-between space-y-0'>
            <div className='space-y-1'>
              <CardTitle className='text-base font-semibold'>
                Ingestion лог — мөр бүр = төхөөрөмжөөс ирсэн 1 хүсэлт
              </CardTitle>
              <CardDescription className='text-xs'>
                Хамгийн сүүлд ирсэн нь хамгийн эхэнд. DONE = боловсруулагдсан,
                PENDING = хүлээгдэж буй, FAILED = бүтэлгүйтсэн. Мөр дээр дарж
                ирсэн өгөгдөл болон алдааг харна.
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {status === 'loading' && (
                <Icons.spinner className='text-muted-foreground h-4 w-4 animate-spin' />
              )}
              {status === 'error' && (
                <Icons.warning className='h-4 w-4 text-red-500' />
              )}
              {lastFetchedAt && status === 'success' && (
                <span className='text-muted-foreground text-xs whitespace-nowrap'>
                  {new Date(lastFetchedAt).toLocaleTimeString('mn-MN', {
                    hour12: false
                  })}
                </span>
              )}
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size='sm'
                onClick={() => setAutoRefresh((v) => !v)}
                title={
                  autoRefresh
                    ? '10 сек тутам автоматаар шинэчилж байна — дарж зогсооно'
                    : 'Автомат шинэчлэлт зогссон — дарж асаана'
                }
                className='gap-1.5'
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoRefresh ? 'animate-pulse bg-green-400' : 'bg-muted-foreground'
                  }`}
                />
                Live
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetch()}
                disabled={status === 'loading'}
              >
                Татах
              </Button>
            </div>
          </div>

          {/* Төлвийн тоолуур + шүүлтүүр */}
          <div className='flex flex-wrap items-center gap-2'>
            <StatChip
              label='Нийт'
              count={counts.total}
              active={statusFilter === 'ALL'}
              tone='default'
              onClick={() => setStatusFilter('ALL')}
            />
            <StatChip
              label='DONE'
              count={counts.done}
              active={statusFilter === 'DONE'}
              tone='good'
              onClick={() => toggleStatus('DONE')}
            />
            <StatChip
              label='PENDING'
              count={counts.pending}
              active={statusFilter === 'PENDING'}
              tone='warn'
              onClick={() => toggleStatus('PENDING')}
            />
            <StatChip
              label='FAILED'
              count={counts.failed}
              active={statusFilter === 'FAILED'}
              tone='bad'
              onClick={() => toggleStatus('FAILED')}
            />
            <StatChip
              label='Гацсан PENDING (>2мин)'
              count={counts.stuck}
              active={statusFilter === 'STUCK'}
              tone={counts.stuck > 0 ? 'bad' : 'default'}
              onClick={() => toggleStatus('STUCK')}
            />
          </div>

          {/* Endpoint шүүлтүүр + хайлт */}
          <div className='flex flex-wrap items-center gap-2'>
            {(
              [
                ['ALL', 'Бүх endpoint'],
                ['/on-read-card', 'Карт'],
                ['/battery-level', 'Battery'],
                ['/storage', 'Storage']
              ] as [EndpointFilter, string][]
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={endpointFilter === value ? 'default' : 'outline'}
                size='sm'
                className='h-8'
                onClick={() => setEndpointFilter(value)}
              >
                {label}
              </Button>
            ))}
            <div className='relative min-w-[220px] flex-1'>
              <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='binId, cardId эсвэл raw body-оор хайх...'
                className='h-8 pl-8'
                disabled={status !== 'success'}
              />
            </div>
          </div>

          {status === 'success' && (
            <p className='text-muted-foreground text-xs'>
              {filtered.length} / {counts.total} мөр
            </p>
          )}
        </CardHeader>

        <CardContent>
          {status === 'idle' && (
            <p className='text-muted-foreground text-sm'>
              Өгөгдөл татагдаагүй байна.
            </p>
          )}
          {status === 'loading' && (
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Icons.spinner className='h-4 w-4 animate-spin' />
              <span>Татаж байна...</span>
            </div>
          )}
          {status === 'error' && (
            <p className='text-sm text-red-500'>
              Өгөгдөл татахад алдаа гарлаа. (Эрх шаардлагатай: DEVELOPER эсвэл
              SUPER_ADMIN)
            </p>
          )}
          {status === 'success' && (
            <>
              <div className='overflow-auto rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[52px]'>№</TableHead>
                      <TableHead className='w-[70px]'>ID</TableHead>
                      <TableHead className='w-[140px]'>Ирсэн цаг</TableHead>
                      <TableHead className='w-[90px]'>Endpoint</TableHead>
                      <TableHead className='w-[90px]'>Bin</TableHead>
                      <TableHead>Утга</TableHead>
                      <TableHead className='w-[110px]'>Төлөв</TableHead>
                      <TableHead className='w-[90px] text-right'>
                        Оролдлого
                      </TableHead>
                      <TableHead className='w-[90px] text-right'>
                        Хоцролт
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((row, i) => {
                      const { binId, value } = rowValue(row);
                      return (
                        <TableRow
                          key={row.id}
                          onClick={() => {
                            setSelected(row);
                            setDialogOpen(true);
                          }}
                          className={`hover:bg-muted/60 cursor-pointer transition-colors ${
                            row.status === 'FAILED'
                              ? 'bg-red-500/5'
                              : isStuckPending(row, nowMs)
                                ? 'bg-amber-500/5'
                                : ''
                          }`}
                        >
                          {/* Жагсаалтын дугаар — хуудсаар үргэлжилнэ */}
                          <TableCell className='text-muted-foreground font-mono text-xs'>
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </TableCell>
                          <TableCell className='font-mono text-xs'>
                            {row.id}
                          </TableCell>
                          <TableCell className='font-mono text-xs whitespace-nowrap'>
                            {fmtTime(row.received_at)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={ENDPOINT_BADGE_CLASS[row.endpoint] ?? ''}
                            >
                              {ENDPOINT_LABEL[row.endpoint] ?? row.endpoint}
                            </Badge>
                          </TableCell>
                          <TableCell className='font-mono text-xs'>
                            {binId}
                          </TableCell>
                          <TableCell className='font-mono text-xs'>
                            {value}
                          </TableCell>
                          <TableCell>
                            <StatusBadge row={row} nowMs={nowMs} />
                          </TableCell>
                          <TableCell className='text-right font-mono text-xs'>
                            {row.attempts ?? 0}
                          </TableCell>
                          <TableCell className='text-right font-mono text-xs'>
                            {fmtLatency(row)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className='text-muted-foreground text-center text-sm'
                        >
                          Илэрц алга.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Хуудаслалт */}
              {pageCount > 1 && (
                <div className='mt-3 flex items-center justify-between'>
                  <p className='text-muted-foreground text-xs'>
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} /{' '}
                    {filtered.length}
                  </p>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Өмнөх
                    </Button>
                    <span className='text-xs'>
                      {page} / {pageCount}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={page === pageCount}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Дараах
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <RowDetailDialog
        row={selected}
        nowMs={nowMs}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
