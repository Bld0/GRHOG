'use client';

import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import type { BinGroup } from '../iot-grouping';
import { MAX_READS_PER_BIN, PAGE_SIZE, fmtTime, pct } from './iot-format';
import { ReadsTable } from './reads-table';
import { StatBox } from './slot-cell';

export function BinDetailDialog({
  group,
  open,
  onOpenChange
}: {
  group: BinGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  // 0-ээс эхэлсэн индекс — аппын бусад хүснэгттэй ижил.
  const [page, setPage] = useState(0);

  // Reset search/page whenever the dialog opens for a (new) bin
  useEffect(() => {
    if (open) {
      setSearch('');
      setPage(0);
    }
  }, [open, group?.binId]);

  const filtered = useMemo(() => {
    if (!group) return [];
    const q = search.trim().toLowerCase();
    if (!q) return group.reads;
    return group.reads.filter((r) => {
      if (r.binId.toLowerCase().includes(q)) return true;
      const cardId = r.card.received ? (r.card.cardId ?? r.card.value ?? '') : '';
      if (cardId.toLowerCase().includes(q)) return true;
      const bat = r.battery.received ? r.battery.value : '';
      const sto = r.storage.received ? r.storage.value : '';
      return (
        bat.toLowerCase().includes(q) ||
        sto.toLowerCase().includes(q) ||
        fmtTime(r.at).toLowerCase().includes(q)
      );
    });
  }, [group, search]);

  // Reset to page 1 whenever search changes
  useEffect(() => { setPage(0); }, [search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const stats = group?.stats;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1400px]'>
        <DialogHeader className='px-6 pt-6 pb-4 border-b'>
          <DialogTitle className='font-mono text-lg'>
            {group?.binId ?? '—'}
            {group?.binName ? (
              <span className='text-muted-foreground'> ({group.binName})</span>
            ) : null}
            {' — Дэлгэрэнгүй уншуулалт'}
          </DialogTitle>
          <DialogDescription>
            {group?.isActive === false && 'Идэвхгүй бүртгэлтэй сав. '}
            Сүүлийн {MAX_READS_PER_BIN} уншуулалт (хамгийн шинэ нь эхэнд).
            {group?.truncated
              ? ' Үүнээс өмнөх уншуулалтууд энд харагдахгүй.'
              : ''}{' '}
            Хайх эсвэл хуудаслан харна уу.
          </DialogDescription>
        </DialogHeader>

        {/* Stats row */}
        {stats && (
          <div className='grid grid-cols-3 gap-2 px-6 py-3 sm:grid-cols-6 border-b'>
            <StatBox
              label='Нийт'
              value={stats.totalReads}
              sub={`${stats.totalRows} хүсэлт`}
            />
            <StatBox
              label='Бүрэн (3/3)'
              value={stats.complete}
              sub={pct(stats.complete, stats.totalReads)}
              tone='good'
            />
            <StatBox
              label='Battery дутуу'
              value={stats.missingBattery}
              sub={pct(stats.missingBattery, stats.totalReads)}
              tone={stats.missingBattery ? 'warn' : 'default'}
            />
            <StatBox
              label='Storage дутуу'
              value={stats.missingStorage}
              sub={pct(stats.missingStorage, stats.totalReads)}
              tone={stats.missingStorage ? 'warn' : 'default'}
            />
            <StatBox
              label='Давхар card'
              value={stats.duplicateCards}
              sub='retry'
              tone={stats.duplicateCards ? 'warn' : 'default'}
            />
            <StatBox
              label='Parse алдаа'
              value={stats.parseFailures}
              sub={pct(stats.parseFailures, stats.totalRows)}
              tone={stats.parseFailures ? 'bad' : 'default'}
            />
          </div>
        )}

        {/* Search */}
        <div className='px-6 py-3 border-b'>
          <div className='relative'>
            <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='cardId, battery, storage эсвэл цагаар хайх...'
              className='pl-8'
            />
          </div>
          <p className='text-muted-foreground mt-1.5 text-xs'>
            {search.trim()
              ? `${filtered.length} / ${group?.reads.length ?? 0} мөр тохирлоо`
              : `${group?.reads.length ?? 0} уншуулалт харуулж байна${
                  group?.truncated
                    ? ` (хамгийн сүүлийн ${MAX_READS_PER_BIN}-аар хязгаарласан)`
                    : ''
                }`}
          </p>
        </div>

        {/* Table */}
        <div className='flex-1 overflow-y-auto px-6 py-3'>
          <div className='rounded-lg border'>
            <table className='w-full table-fixed caption-bottom text-sm'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[5%]'>№</TableHead>
                  <TableHead className='w-[14%]'>Цаг</TableHead>
                  <TableHead className='w-[21%]'>Battery</TableHead>
                  <TableHead className='w-[22%]'>Storage</TableHead>
                  <TableHead className='w-[23%]'>Card</TableHead>
                  <TableHead className='w-[15%] text-right'>
                    Бүрэн бүтэн
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ReadsTable
                  reads={paginated}
                  startIndex={page * PAGE_SIZE}
                />
              </TableBody>
            </table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={pageCount}
            hasPrevious={page > 0}
            hasNext={page < pageCount - 1}
            onPageChange={setPage}
          />

          <p className='text-muted-foreground mt-2 text-center text-xs'>
            {filtered.length > 0
              ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} / ${filtered.length}`
              : ''}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
