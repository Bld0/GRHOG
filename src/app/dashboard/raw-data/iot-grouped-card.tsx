'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  BATTERY_JUMP_V,
  type BatteryChange,
  type IotRow,
  type Read,
  type Slot,
  type BinRef,
  type BinGroup,
  type GroupStats
} from './iot-grouping';

type Status = 'idle' | 'loading' | 'success' | 'error';

const PAGE_SIZE = 20;
// Real-time: энэ интервалаар автоматаар дахин татна (IngestionTable-тэй адил)
const AUTO_REFRESH_MS = 10 * 1000;
// Нэг савд харуулах уншуулалтын дээд хязгаар (дэлгэрэнгүй цонх).
const MAX_READS_PER_BIN = 100;
// Backend-ээс сав тус бүрд татах түүхий мөрийн хязгаар. Нэг уншуулалт = 3
// хүсэлт (battery + storage + card) тул 100 уншуулалтад ~300 мөр хэрэгтэй.
const PER_BIN_ROWS = MAX_READS_PER_BIN * 3;
// Auto-refresh дээр зөвхөн сүүлийн мөрүүдийг татаж, snapshot дээр нэмнэ.
const TAIL_ROWS = 500;

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

/** Шинэ мөрүүдийг хуучин дээр нэмж нэгтгэнэ (id-гаар давхардлыг арилгана). */
function mergeRows(prev: IotRow[] | null, incoming: IotRow[]): IotRow[] {
  const byId = new Map<number, IotRow>();
  for (const r of prev ?? []) byId.set(r.id, r);
  for (const r of incoming) byId.set(r.id, r);
  return Array.from(byId.values()).sort((a, b) => b.id - a.id);
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

/** Single slot cell — green tick with value when present, red X when missing. */
function SlotCell({ slot, label }: { slot: Slot; label: string }) {
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

function ReadsTable({
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
                  startIndex={(page - 1) * PAGE_SIZE}
                />
              </TableBody>
            </table>
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
          {/* Latest battery */}
          <TableCell className='whitespace-nowrap'>
            <SlotCell slot={latest.battery} label='battery' />
          </TableCell>
          {/* Battery сольсон огноо — вольт хамгийн сүүлд огцом өссөн үе */}
          <TableCell className='whitespace-nowrap'>
            {batteryChange ? (
              <div
                title={`${batteryChange.fromV.toFixed(2)}V → ${batteryChange.toV.toFixed(
                  2
                )}V (+${(batteryChange.toV - batteryChange.fromV).toFixed(
                  2
                )}V) — цэнэгтэй баттерей тавьсан гэж үзэв`}
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
        <TableCell colSpan={5} className='text-muted-foreground text-sm'>
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
  // Зөвхөн binId-г хадгална — ингэснээр auto-refresh дээр нээлттэй байгаа
  // дэлгэрэнгүй цонх хуучин snapshot дээр гацахгүй, шинэ өгөгдлөө дагана.
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  // binId → бүртгэлийн мэдээлэл. IoT лог дотор зөвхөн binId ирдэг тул савны
  // нэр/идэвхтэй эсэхийг bin хүснэгтээс тусад нь татаж авна.
  const [bins, setBins] = useState<Map<string, BinRef>>(new Map());
  // binId → сүүлийн баттерей солилт. Backend нь бүх түүхээр хайдаг тул энд
  // татсан цонхноос эрт болсон солилтыг ч олдог.
  const [batteryChanges, setBatteryChanges] = useState<
    Map<string, BatteryChange>
  >(new Map());
  // by-bin snapshot-ийн мета (хэдэн мөр уншсан, гүйцэд хамарсан эсэх)
  const [meta, setMeta] = useState<{
    scanned: number;
    exhausted: boolean;
    perBin: number;
  } | null>(null);

  /**
   * Бүрэн snapshot — сав тус бүрээр цонхолсон (by-bin) таталт.
   * Энгийн "сүүлийн 5000 мөр" таталтад идэвхтэй савууд бүх мөрийг эзэлдэг тул
   * чимээгүй болсон/идэвхгүй савууд цонхноос гарч, хүснэгтээс алга болдог.
   * by-bin нь сав бүрд өөрийн хэсгийг баталгаажуулна.
   */
  const fetchSnapshot = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const res = await apiClient.fetchWithAuth(
        `/api/raw-data/iot-request-log/by-bin?perBin=${PER_BIN_ROWS}`
      );
      if (res.ok) {
        const json = (await res.json()) as
          | IotRow[]
          | { rows: IotRow[]; scanned: number; exhausted: boolean; perBin: number };
        if (Array.isArray(json)) {
          setRows(json);
          setMeta(null);
        } else {
          setRows(json.rows ?? []);
          setMeta({
            scanned: json.scanned ?? 0,
            exhausted: json.exhausted ?? false,
            perBin: json.perBin ?? PER_BIN_ROWS
          });
        }
        setStatus('success');
        setLastFetchedAt(Date.now());
        return;
      }
      // by-bin-гүй хуучин backend дээр ажиллаж байвал хуучин байдлаар татна.
      const legacy = await apiClient.fetchWithAuth(
        '/api/raw-data/iot-request-log?limit=5000'
      );
      if (legacy.ok) {
        setRows((await legacy.json()) as IotRow[]);
        setMeta(null);
        setStatus('success');
        setLastFetchedAt(Date.now());
      } else if (!silent) {
        setStatus('error');
      }
    } catch {
      if (!silent) setStatus('error');
    }
  }, []);

  /**
   * Real-time шинэчлэлт — зөвхөн хамгийн сүүлийн мөрүүдийг татаад snapshot
   * дээр нэмнэ. Ингэснээр 10 сек тутамд бүх түүхийг дахин татахгүй.
   */
  const fetchTail = useCallback(async () => {
    try {
      const res = await apiClient.fetchWithAuth(
        `/api/raw-data/iot-request-log?limit=${TAIL_ROWS}`
      );
      if (!res.ok) return;
      const tail = (await res.json()) as IotRow[];
      setRows((prev) => mergeRows(prev, tail));
      setLastFetchedAt(Date.now());
    } catch {
      /* чимээгүй шинэчлэлт унавал өмнөх өгөгдөл хэвээр үлдэнэ */
    }
  }, []);

  // Савны бүртгэлийг ганц удаа татна — bin бүртгэл 10 сек тутам өөрчлөгддөггүй
  // тул auto-refresh-д оруулах шаардлагагүй. Амжилтгүй болбол хүснэгт зөвхөн
  // логт таарсан савуудаар binId-гаараа хэвийн ажиллана.
  const fetchBins = useCallback(async () => {
    try {
      const res = await apiClient.fetchWithAuth('/api/raw-data/bin?limit=1000');
      if (!res.ok) return;
      const list = (await res.json()) as Record<string, unknown>[];
      const map = new Map<string, BinRef>();
      for (const b of list) {
        const id = b.bin_id;
        if (id == null || !String(id).trim()) continue;
        const name = b.bin_name;
        const active = b.is_active ?? b.isActive ?? b.active;
        map.set(String(id).trim().toUpperCase(), {
          binId: String(id).trim().toUpperCase(),
          binName: name != null && String(name).trim() ? String(name).trim() : null,
          isActive: active == null ? null : active === true || active === 1
        });
      }
      setBins(map);
    } catch {
      /* бүртгэл татагдаагүй нь хүснэгтийг блоклохгүй */
    }
  }, []);

  /**
   * Баттерей солилтыг backend-ээс татна — тэнд бүх түүхээр хайдаг тул
   * дэлгэцэнд татсан {MAX_READS_PER_BIN} уншуулалтаас эрт солигдсон савууд ч
   * олдоно. Backend дээр 5 минут cache-тэй, солилт ховор тул нэг л удаа татна.
   * Амжилтгүй болбол хүснэгт client-side илрүүлэлтээрээ хэвийн ажиллана.
   */
  const fetchBatteryChanges = useCallback(async () => {
    try {
      const res = await apiClient.fetchWithAuth('/api/raw-data/battery-changes');
      if (!res.ok) return;
      const json = (await res.json()) as {
        changes?: Record<string, { at: string; fromV: number; toV: number }>;
      };
      const map = new Map<string, BatteryChange>();
      for (const [binId, c] of Object.entries(json.changes ?? {})) {
        if (!c?.at || c.fromV == null || c.toV == null) continue;
        map.set(binId.trim().toUpperCase(), {
          at: c.at,
          fromV: Number(c.fromV),
          toV: Number(c.toV)
        });
      }
      setBatteryChanges(map);
    } catch {
      /* client-side илрүүлэлт fallback болно */
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    fetchBins();
    fetchBatteryChanges();
  }, [fetchSnapshot, fetchBins, fetchBatteryChanges]);

  // Real-time auto-refresh — идэвхтэй tab дээр л ажиллана, сая уншуулсан сав
  // groupByBin-ийн шинэ эрэмбээр (хамгийн сүүлийн нь эхэнд) автоматаар дээшээ гарна.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchTail();
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchTail]);

  const { reads, stats } = useMemo(() => groupReads(rows ?? []), [rows]);
  const binGroups = useMemo(
    () => groupByBin(reads, rows ?? [], bins, MAX_READS_PER_BIN, batteryChanges),
    [reads, rows, bins, batteryChanges]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return binGroups;
    return binGroups.filter(
      (g) =>
        g.binId.toLowerCase().includes(q) ||
        (g.binName ?? '').toLowerCase().includes(q)
    );
  }, [binGroups, search]);

  const binCounts = useMemo(
    () => ({
      inactive: binGroups.filter((g) => g.isActive === false).length,
      noData: binGroups.filter((g) => !g.latest).length,
      unregistered: binGroups.filter((g) => !g.registered).length
    }),
    [binGroups]
  );

  const selectedBin = useMemo(
    () => binGroups.find((g) => g.binId === selectedBinId) ?? null,
    [binGroups, selectedBinId]
  );

  const handleBinClick = (group: BinGroup) => {
    setSelectedBinId(group.binId);
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
                Бүртгэлтэй БҮХ сав жагсаана (идэвхгүй болон өгөгдөлгүй нь ч
                орно). Хамгийн сүүлд уншуулсан сав хүснэгтийн хамгийн дээр
                (real-time, {AUTO_REFRESH_MS / 1000} сек тутам). Савын мөрийг
                дарж сүүлийн {MAX_READS_PER_BIN} уншуулалтыг харна уу.
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
                    ? `${AUTO_REFRESH_MS / 1000} сек тутам автоматаар шинэчилж байна — дарж зогсооно`
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
                onClick={() => fetchSnapshot()}
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
              placeholder='binId эсвэл савны нэрээр хайх...'
              className='pl-8'
              disabled={status !== 'success'}
            />
          </div>

          {status === 'success' && (
            <p className='text-muted-foreground text-xs'>
              {search.trim()
                ? `${filteredGroups.length} / ${binGroups.length} сав тохирлоо · `
                : `Нийт ${binGroups.length} сав · `}
              {binCounts.inactive} идэвхгүй · {binCounts.noData} өгөгдөлгүй
              {binCounts.unregistered > 0 &&
                ` · ${binCounts.unregistered} бүртгэлгүй`}
              {meta &&
                ` · ${meta.scanned.toLocaleString('mn-MN')} мөр шалгав (сав тус бүр ≤${meta.perBin} мөр)`}
              {meta && !meta.exhausted && ' · хязгаарт хүрсэн'}
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
              Өгөгдөл татахад алдаа гарлаа.
            </p>
          )}
          {status === 'success' && (
            <div className='overflow-auto rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[52px]'>№</TableHead>
                    <TableHead className='w-[150px]'>Сав</TableHead>
                    <TableHead className='w-[150px]'>Сүүлийн цаг</TableHead>
                    {/* Battery-г агуулгад нь багтаан хумиж, "сольсон огноо"-г
                        зэрэгцүүлэн уншихад ойр байлгана. */}
                    <TableHead className='w-[110px]'>Battery</TableHead>
                    <TableHead
                      className='w-[150px]'
                      title={`Вольт хамгийн сүүлд огцом (≥${BATTERY_JUMP_V}V) өссөн үе — цэнэгтэй баттерей тавьсан гэж үзнэ`}
                    >
                      Battery сольсон огноо
                    </TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead className='w-[100px]'>Бүрэн бүтэн</TableHead>
                    <TableHead className='text-right'>Нийт / Бүрэн</TableHead>
                    <TableHead className='w-[110px] text-right'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((g, i) => (
                    <BinSummaryRow
                      key={g.binId}
                      group={g}
                      index={i + 1}
                      onClick={() => handleBinClick(g)}
                    />
                  ))}
                  {filteredGroups.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
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
