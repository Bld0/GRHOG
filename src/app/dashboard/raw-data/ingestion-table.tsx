'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import {
  extractJson,
  jsonBounds,
  parseTime,
  type IotRow
} from './iot-grouping';

type Status = 'idle' | 'loading' | 'success' | 'error';

const PAGE_SIZE = 25;
// PENDING мөр энэ хугацаанаас удаан хүлээвэл queue worker гацсан гэж үзнэ
const STUCK_PENDING_MS = 2 * 60 * 1000;
// Real-time: энэ интервалаар автоматаар дахин татна
const AUTO_REFRESH_MS = 10 * 1000;

type StatusFilter = 'ALL' | 'DONE' | 'PENDING' | 'FAILED' | 'STUCK';
type EndpointFilter = 'ALL' | '/on-read-card' | '/battery-level' | '/storage';

const ENDPOINT_LABEL: Record<string, string> = {
  '/on-read-card': 'Карт',
  '/battery-level': 'Battery',
  '/storage': 'Storage'
};

const ENDPOINT_BADGE_CLASS: Record<string, string> = {
  '/on-read-card': 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/15',
  '/battery-level': 'bg-violet-500/15 text-violet-600 hover:bg-violet-500/15',
  '/storage': 'bg-teal-500/15 text-teal-600 hover:bg-teal-500/15'
};

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
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

function isStuckPending(row: IotRow, nowMs: number): boolean {
  if (row.status !== 'PENDING') return false;
  const t = parseTime(row.received_at);
  return !Number.isNaN(t) && nowMs - t > STUCK_PENDING_MS;
}

/** received_at → processed_at хоцролт, хүн уншихаар. */
function fmtLatency(row: IotRow): string {
  if (!row.processed_at) return '—';
  const a = parseTime(row.received_at);
  const b = parseTime(row.processed_at);
  if (Number.isNaN(a) || Number.isNaN(b)) return '—';
  const sec = (b - a) / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

/** Мөрийн гол утга — endpoint-оос нь хамаарч cardId / battery / storage. */
function rowValue(row: IotRow): { binId: string; value: string } {
  const obj = extractJson(row);
  const binRaw = (obj?.binId ?? obj?.binID ?? null) as string | null;
  const binId = binRaw ? String(binRaw).trim().toUpperCase() : '—';
  let value = '—';
  if (row.endpoint === '/battery-level') {
    value = obj?.battery_Level != null ? String(obj.battery_Level) : '—';
  } else if (row.endpoint === '/storage') {
    value = obj?.storageLevel != null ? String(obj.storageLevel) : '—';
  } else if (row.endpoint === '/on-read-card') {
    value = obj?.cardId != null ? String(obj.cardId) : '—';
  }
  return { binId, value };
}

function StatusBadge({ row, nowMs }: { row: IotRow; nowMs: number }) {
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
function StatChip({
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

// ---------------------------------------------------------------------------
// Detail dialog — raw body-г шуугиан/JSON-оор ялгаж, алдааг бүтнээр үзүүлнэ
// ---------------------------------------------------------------------------

/** raw_body: модемын шуугианыг улаанаар, жинхэнэ JSON-ийг ногооноор. */
function RawBodyView({ raw }: { raw: string | null }) {
  if (!raw) return <p className='text-muted-foreground text-sm'>Хоосон</p>;
  const b = jsonBounds(raw);
  if (!b) {
    return (
      <pre className='bg-muted overflow-auto rounded-lg p-3 font-mono text-xs break-all whitespace-pre-wrap text-red-500'>
        {raw}
      </pre>
    );
  }
  const prefix = raw.slice(0, b.start);
  const json = raw.slice(b.start, b.end);
  const suffix = raw.slice(b.end);
  return (
    <pre className='bg-muted overflow-auto rounded-lg p-3 font-mono text-xs break-all whitespace-pre-wrap'>
      {prefix && (
        <span className='rounded bg-red-500/15 text-red-500' title='Модемын шуугиан'>
          {prefix}
        </span>
      )}
      <span className='text-green-600 dark:text-green-500'>{json}</span>
      {suffix && (
        <span className='rounded bg-red-500/15 text-red-500' title='Модемын шуугиан'>
          {suffix}
        </span>
      )}
    </pre>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <p className='text-muted-foreground text-xs font-medium'>{label}</p>
      {children}
    </div>
  );
}

function RowDetailDialog({
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

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function IngestionTable() {
  const [rows, setRows] = useState<IotRow[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [endpointFilter, setEndpointFilter] = useState<EndpointFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<IotRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  // silent = true үед spinner үзүүлэхгүй чимээгүй шинэчилнэ (auto-refresh)
  const fetchRows = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const res = await apiClient.fetchWithAuth(
        '/api/raw-data/iot-request-log?limit=5000'
      );
      if (res.ok) {
        const json = (await res.json()) as IotRow[];
        // Хамгийн сүүлд ирсэн нь хамгийн эхэнд
        json.sort(
          (a, b) =>
            parseTime(b.received_at) - parseTime(a.received_at) || b.id - a.id
        );
        setRows(json);
        setNowMs(Date.now());
        setLastFetchedAt(Date.now());
        setStatus('success');
      } else if (!silent) {
        setStatus('error');
      }
    } catch {
      if (!silent) setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Real-time auto-refresh — идэвхтэй tab дээр л ажиллана
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchRows(true);
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchRows]);

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
                onClick={() => fetchRows()}
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
                    {paginated.map((row) => {
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
