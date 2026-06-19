'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import {
  groupReads,
  groupByBin,
  type IotRow,
  type Read,
  type Slot,
  type BinGroup,
  type GroupStats
} from './iot-grouping';

type Status = 'idle' | 'loading' | 'success' | 'error';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('mn-MN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

const pct = (n: number, total: number) =>
  total ? `${Math.round((n / total) * 100)}%` : '0%';

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

/** Single slot cell — green tick with value when present, red X when missing. */
function SlotCell({ slot, label }: { slot: Slot; label: string }) {
  if (slot.received) {
    return (
      <div className='flex items-center gap-1.5'>
        <Icons.check className='h-3.5 w-3.5 shrink-0 text-green-500' />
        <span className='font-mono text-xs'>{slot.value || '—'}</span>
      </div>
    );
  }
  return (
    <div className='flex items-center gap-1.5 text-red-500'>
      <Icons.close className='h-3.5 w-3.5 shrink-0' />
      <span className='text-xs'>{label}</span>
    </div>
  );
}

function StatBox({
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

// ---------------------------------------------------------------------------
// Reads table — used inside the detail dialog
// ---------------------------------------------------------------------------

function rowTone(r: Read): string {
  if (r.complete) return '';
  if (!r.card.received) return 'bg-red-500/5';
  return 'bg-amber-500/5';
}

function ReadsTable({ reads }: { reads: Read[] }) {
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
  return (
    <>
      {reads.map((r, i) => (
        <TableRow
          key={`${r.binId}-${r.at}-${i}`}
          className={rowTone(r)}
        >
          <TableCell className='font-mono text-xs whitespace-nowrap'>
            {fmtTime(r.at)}
          </TableCell>
          <TableCell className='font-mono text-xs font-medium'>
            {r.binId}
          </TableCell>
          <TableCell>
            <SlotCell slot={r.battery} label='battery' />
          </TableCell>
          <TableCell>
            <SlotCell slot={r.storage} label='storage' />
          </TableCell>
          <TableCell>
            <div className='flex items-center gap-1.5'>
              <SlotCell slot={r.card} label='card' />
              {r.duplicates > 0 && (
                <Badge variant='outline' className='h-5 px-1.5 text-[10px]'>
                  +{r.duplicates} retry
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
                {r.presentCount}/3 ({r.missing.length} дутуу)
              </Badge>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------

function PaginationBar({
  page,
  pageCount,
  onPage
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  // Build a compact window: first, prev-2..cur+2, last with ellipses
  const pages: (number | 'ellipsis')[] = [];
  const WINDOW = 2;

  for (let p = 1; p <= pageCount; p++) {
    if (
      p === 1 ||
      p === pageCount ||
      (p >= page - WINDOW && p <= page + WINDOW)
    ) {
      pages.push(p);
    } else if (
      pages[pages.length - 1] !== 'ellipsis'
    ) {
      pages.push('ellipsis');
    }
  }

  return (
    <Pagination className='mt-3'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            onClick={(e) => { e.preventDefault(); if (page > 1) onPage(page - 1); }}
            aria-disabled={page === 1}
            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href='#'
                isActive={p === page}
                onClick={(e) => { e.preventDefault(); onPage(p); }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href='#'
            onClick={(e) => { e.preventDefault(); if (page < pageCount) onPage(page + 1); }}
            aria-disabled={page === pageCount}
            className={page === pageCount ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// ---------------------------------------------------------------------------
// Detail dialog — shows all reads for one bin with search + pagination
// ---------------------------------------------------------------------------

function BinDetailDialog({
  group,
  open,
  onOpenChange
}: {
  group: BinGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Reset search/page whenever the dialog opens for a (new) bin
  useEffect(() => {
    if (open) {
      setSearch('');
      setPage(1);
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
  useEffect(() => { setPage(1); }, [search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = group?.stats;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] w-full max-w-5xl overflow-hidden flex flex-col gap-0 p-0'>
        <DialogHeader className='px-6 pt-6 pb-4 border-b'>
          <DialogTitle className='font-mono text-lg'>
            {group?.binId ?? '—'} — Дэлгэрэнгүй уншуулалт
          </DialogTitle>
          <DialogDescription>
            Бүх уншуулалт (хамгийн шинэ нь эхэнд). Хайх эсвэл хуудаслан
            харна уу.
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
              : `Нийт ${group?.reads.length ?? 0} уншуулалт`}
          </p>
        </div>

        {/* Table */}
        <div className='flex-1 overflow-auto px-6 py-3'>
          <div className='overflow-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[140px]'>Цаг</TableHead>
                  <TableHead className='w-[90px]'>Сав</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead className='w-[120px] text-right'>
                    Бүрэн бүтэн
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ReadsTable reads={paginated} />
              </TableBody>
            </Table>
          </div>

          <PaginationBar page={page} pageCount={pageCount} onPage={setPage} />

          <p className='text-muted-foreground mt-2 text-center text-xs'>
            {filtered.length > 0
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} / ${filtered.length}`
              : ''}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Grouped summary row — one per bin
// ---------------------------------------------------------------------------

function BinSummaryRow({
  group,
  onClick
}: {
  group: BinGroup;
  onClick: () => void;
}) {
  const { binId, latest, stats } = group;
  const completePct = pct(stats.complete, stats.totalReads);
  const healthTone =
    stats.complete === stats.totalReads
      ? 'text-green-500'
      : stats.complete / stats.totalReads >= 0.7
        ? 'text-amber-500'
        : 'text-red-500';

  return (
    <TableRow
      className='cursor-pointer hover:bg-muted/60 transition-colors'
      onClick={onClick}
    >
      {/* Bin ID */}
      <TableCell className='font-mono text-sm font-semibold'>
        {binId}
      </TableCell>
      {/* Latest reading time */}
      <TableCell className='font-mono text-xs whitespace-nowrap'>
        {fmtTime(latest.at)}
      </TableCell>
      {/* Latest battery */}
      <TableCell>
        <SlotCell slot={latest.battery} label='battery' />
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
      {/* Total reads + health */}
      <TableCell className='text-right'>
        <span className='text-muted-foreground text-xs'>
          {stats.totalReads} удаа
        </span>
        <span className={`ml-2 text-xs font-medium ${healthTone}`}>
          {completePct} бүрэн
        </span>
      </TableCell>
      {/* Action hint */}
      <TableCell className='text-right'>
        <Button variant='ghost' size='sm' className='h-7 px-2 text-xs'>
          Дэлгэрэнгүй
          <Icons.chevronRight className='ml-1 h-3.5 w-3.5' />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Global stats banner — across all bins
// ---------------------------------------------------------------------------

function GlobalStats({ stats }: { stats: GroupStats }) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
      <StatBox
        label='Нийт уншуулалт'
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
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function IotGroupedCard() {
  const [rows, setRows] = useState<IotRow[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [search, setSearch] = useState('');
  const [selectedBin, setSelectedBin] = useState<BinGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRows = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await apiClient.fetchWithAuth(
        '/api/raw-data/iot-request-log?limit=2000'
      );
      if (res.ok) {
        setRows((await res.json()) as IotRow[]);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const { reads, stats } = useMemo(() => groupReads(rows ?? []), [rows]);
  const binGroups = useMemo(() => groupByBin(reads, rows ?? []), [reads, rows]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return binGroups;
    return binGroups.filter((g) => g.binId.toLowerCase().includes(q));
  }, [binGroups, search]);

  const handleBinClick = (group: BinGroup) => {
    setSelectedBin(group);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className='space-y-3 pb-3'>
          <div className='flex flex-row items-start justify-between space-y-0'>
            <div className='space-y-1'>
              <CardTitle className='text-base font-semibold'>
                Бүлэглэсэн уншуулалт (нэг карт = 3 хүсэлт)
              </CardTitle>
              <CardDescription className='text-xs'>
                Савнууд бүлэглэгдсэн — хамгийн сүүлийн уншуулалт харагдана.
                Савын мөрийг дарж дэлгэрэнгүй бүх уншуулалтыг харна уу.
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {status === 'loading' && (
                <Icons.spinner className='text-muted-foreground h-4 w-4 animate-spin' />
              )}
              {status === 'success' && (
                <Icons.check className='h-4 w-4 text-green-500' />
              )}
              {status === 'error' && (
                <Icons.warning className='h-4 w-4 text-red-500' />
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={fetchRows}
                disabled={status === 'loading'}
              >
                Татах
              </Button>
            </div>
          </div>

          {status === 'success' && <GlobalStats stats={stats} />}

          <div className='relative'>
            <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='binId-аар хайх...'
              className='pl-8'
              disabled={status !== 'success'}
            />
          </div>
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
              Өгөгдөл татахад алдаа гарлаа.
            </p>
          )}
          {status === 'success' && (
            <div className='overflow-auto rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[90px]'>Сав</TableHead>
                    <TableHead className='w-[140px]'>Сүүлийн цаг</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead className='w-[100px]'>Бүрэн бүтэн</TableHead>
                    <TableHead className='text-right'>Нийт / Бүрэн</TableHead>
                    <TableHead className='w-[110px] text-right'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((g) => (
                    <BinSummaryRow
                      key={g.binId}
                      group={g}
                      onClick={() => handleBinClick(g)}
                    />
                  ))}
                  {filteredGroups.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className='text-muted-foreground text-center text-sm'
                      >
                        Илэрц алга.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BinDetailDialog
        group={selectedBin}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
