'use client';

import { useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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

import { BATTERY_JUMP_V, type BinGroup } from './iot-grouping';
import { BinDetailDialog } from './iot/bin-detail-dialog';
import { BinSummaryRow } from './iot/bin-summary-row';
import { GlobalStats } from './iot/global-stats';
import {
  AUTO_REFRESH_MS,
  BATTERY_GROUP_LEFT,
  BATTERY_GROUP_RIGHT,
  MAX_READS_PER_BIN
} from './iot/iot-format';
import { useIotSnapshot } from './iot/use-iot-snapshot';

/**
 * IoT логийн бүлэглэсэн харагдац — зохицуулалт л хийнэ.
 *
 * Таталт `useIotSnapshot`-д, мөрийн/цонхны JSX `iot/` доторх component-уудад.
 * Өмнө нь энэ бүхэн 1099 мөрийн нэг файлд байв.
 */
export function IotGroupedCard() {
  const {
    status,
    stats,
    binGroups,
    meta,
    lastFetchedAt,
    autoRefresh,
    setAutoRefresh,
    refetch
  } = useIotSnapshot();

  const [search, setSearch] = useState('');
  // Зөвхөн binId-г хадгална — ингэснээр auto-refresh дээр нээлттэй байгаа
  // дэлгэрэнгүй цонх хуучин snapshot дээр гацахгүй, шинэ өгөгдлөө дагана.
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
                    autoRefresh
                      ? 'animate-pulse bg-green-400'
                      : 'bg-muted-foreground'
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
                    {/* Battery-г агуулгад нь багтаан хумьсан тул "сольсон
                        огноо" нь тайлбарлаж буй вольтныхоо хажууд наалдана. */}
                    <TableHead className={`w-[110px] ${BATTERY_GROUP_LEFT}`}>
                      Battery
                    </TableHead>
                    <TableHead
                      className={`w-[150px] ${BATTERY_GROUP_RIGHT}`}
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
