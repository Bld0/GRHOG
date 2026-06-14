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
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import { groupReads, type IotRow, type Read, type Slot } from './iot-grouping';

type Status = 'idle' | 'loading' | 'success' | 'error';

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
    hour12: false // 24 цагийн форматтай болгоно
  });
}

/** Нэг хүсэлтийн нүд: ирсэн бол ногоон утга, дутуу бол улаан "дутуу". */
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

const pct = (n: number, total: number) =>
  total ? `${Math.round((n / total) * 100)}%` : '0%';

export function IotGroupedCard() {
  const [rows, setRows] = useState<IotRow[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [search, setSearch] = useState('');

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reads;
    return reads.filter((r) => {
      if (r.binId.toLowerCase().includes(q)) return true;
      const cardId = r.card.received ? (r.card.cardId ?? '') : '';
      return cardId.toLowerCase().includes(q);
    });
  }, [reads, search]);

  // Бүрэн бус мөрийг ялгаж онцлох өнгө
  const rowTone = (r: Read): string => {
    if (r.complete) return '';
    if (!r.card.received) return 'bg-red-500/5';
    return 'bg-amber-500/5';
  };

  return (
    <Card>
      <CardHeader className='space-y-3 pb-3'>
        <div className='flex flex-row items-start justify-between space-y-0'>
          <div className='space-y-1'>
            <CardTitle className='text-base font-semibold'>
              Бүлэглэсэн уншуулалт (нэг карт = 3 хүсэлт)
            </CardTitle>
            <CardDescription className='text-xs'>
              battery → storage → on-read-card-г binId ба цаг хугацаагаар нэг
              уншуулалт болгон бүлэглэв. Дутуу хүсэлт улаанаар тэмдэглэгдэнэ.
              (Heuristic correlation)
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

        {status === 'success' && (
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
        )}

        <div className='relative'>
          <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='binId эсвэл cardId-аар хайх...'
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
          <p className='text-sm text-red-500'>Өгөгдөл татахад алдаа гарлаа.</p>
        )}
        {status === 'success' && (
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
                {filtered.map((r, i) => (
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
                          <Badge
                            variant='outline'
                            className='h-5 px-1.5 text-[10px]'
                          >
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
  );
}
