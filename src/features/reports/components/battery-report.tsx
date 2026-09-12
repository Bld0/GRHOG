'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  IconBattery2,
  IconBatteryOff,
  IconClockHour4,
  IconTrendingDown
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  BatteryBinRow,
  BatteryCoverage,
  BatteryReport as Report,
  ReportFilters,
  toQuery
} from '../types';

/**
 * Баганын тайлбар. Техникийн тодорхойлолт биш, энгийн үг ба жишээ тоогоор —
 * тайланг батерейны нэр томьёо мэдэхгүй хүн ч уншина.
 */
const DRAIN_HINT =
  'Батерей өдөрт хэдэн хувиар цэнэгээ алдаж байгааг харуулна. **Хувь өндөр байх тусам цэнэг хурдан дуусна.** Жишээ нь 3%/хоног гэвэл ойролцоогоор 30 гаруй хоног ажиллана';

const HOLD_HINT =
  'Цэнэглээд хэр удаан ашиглах боломжтой вэ? Сав нэг удаагийн цэнэгээр хэдэн хоног ашиглагдахыг энд харуулна. Хугацаа урт байх тусам цэнэгээ удаан барина. «Хамгийн багадаа» гэж байвал заасан хоног нь баталгаатай доод хугацаа бөгөөд түүнээс илүү хоног ашиглах боломжтой гэсэн үг'

/** Цэнэгийн хувийг өнгөт зурвасаар. */
function BatteryBar({ percent }: { percent: number }) {
  const tone =
    percent <= 20
      ? 'bg-red-600'
      : percent <= 50
        ? 'bg-amber-500'
        : 'bg-green-600';
  return (
    <div className='flex items-center gap-2'>
      <div className='h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className={`h-2 rounded-full ${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className='text-sm font-medium tabular-nums'>
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Батерейн түвшин, хэрэглээний тайлан.
 *
 * Бүх үзүүлэлт `battery_reading` түүхээс гарна. Түүх цуглуулж эхлэхээс өмнөх
 * хугацаанд өгөгдөл байхгүй тул хамрах хүрээг дээр нь харуулна — эс бөгөөс
 * хоосон тайланг эвдрэл гэж ойлгож болзошгүй.
 */
export function BatteryReport({ filters }: { filters: ReportFilters }) {
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [bins, setBins] = useState<BatteryBinRow[]>([]);
  const [coverage, setCoverage] = useState<BatteryCoverage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('drainPerDay');
  const [isBackfilling, setIsBackfilling] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, binsResponse, coverageResponse] =
        await Promise.all([
          apiClient.fetchWithAuth(
            `/api/reports/battery/summary?${toQuery(filters)}`
          ),
          apiClient.fetchWithAuth(
            `/api/reports/battery/bins?${toQuery(filters, { sortBy })}`
          ),
          apiClient.fetchWithAuth('/api/reports/battery/coverage')
        ]);

      if (!summaryResponse.ok || !binsResponse.ok) {
        throw new Error('Батерейн тайлан татахад алдаа гарлаа');
      }

      setReport(await summaryResponse.json());
      setBins(await binsResponse.json());
      if (coverageResponse.ok) {
        setCoverage(await coverageResponse.json());
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /**
   * Түүхийг нөхөх ажлуудыг дараалан дуудна.
   *
   * Эдгээр нь нэг удаагийн засварын ажил: батерей сольсон огноо болон
   * хоослолтын тоо аль аль нь түүхэн өгөгдлөөс л сэргэдэг. Хоослолтыг
   * ЗӨВХӨН dryRun-аар дуудна — мөр устгадаг ажлыг товчоор санамсаргүй
   * ажиллуулах ёсгүй, тоог нь хараад гараар шийднэ.
   */
  const runBackfill = useCallback(async () => {
    setIsBackfilling(true);
    try {
      const steps: { label: string; url: string }[] = [
        { label: 'Батерейн түүх', url: '/api/reports/battery/backfill' },
        { label: 'Батерей сольсон огноо', url: '/api/reports/battery/backfill-replacements' },
        { label: 'Дүүрэлтийн түүх', url: '/api/reports/storage/backfill' },
        {
          label: 'Мэдрэгчийн алдааны түүх',
          url: '/api/reports/sensor-health/backfill'
        },
        {
          label: 'Хоослолтын тооцоо (туршилт)',
          url: '/api/reports/storage/reconcile-clearings?dryRun=true'
        }
      ];

      for (const step of steps) {
        const response = await apiClient.fetchWithAuth(step.url, { method: 'POST' });
        if (!response.ok) {
          toast.error(
            response.status === 403
              ? `${step.label}: зөвхөн SUPER_ADMIN ажиллуулна`
              : `${step.label}: алдаа гарлаа (${response.status})`
          );
          return;
        }
        const result = await response.json();
        toast.success(`${step.label}: ${JSON.stringify(result)}`);
      }

      await fetchAll();
    } catch {
      toast.error('Түүх нөхөх ажиллагаа тасарлаа.');
    } finally {
      setIsBackfilling(false);
    }
  }, [fetchAll]);

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('mn-MN') : '—';

  const stats = [
    {
      title: 'Хэмжилттэй сав',
      value: report?.binCount ?? 0,
      hint: coverage?.earliestReading
        ? `Түүх ${formatDate(coverage.earliestReading)}-наас`
        : 'Түүх хараахан цугларч эхлээгүй',
      icon: IconBattery2,
      tone: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Дундаж цэнэг',
      value: report?.averagePercent != null ? `${report.averagePercent}%` : '—',
      hint: 'Сонгосон хугацааны дундаж',
      icon: IconBattery2,
      tone: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Хамгийн удаан барьсан',
      value: report?.longestHolding
        ? `${report.longestHolding.holdDays} хоног`
        : '—',
      hint: report?.longestHolding?.binName ?? 'Мэдээлэл алга',
      icon: IconClockHour4,
      tone: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Хамгийн хурдан дуусч буй',
      value: report?.fastestDrain
        ? `${report.fastestDrain.drainPerDay}%/хоног`
        : '—',
      hint: report?.fastestDrain?.binName ?? 'Мэдээлэл алга',
      icon: IconTrendingDown,
      tone: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className='space-y-6'>
      {!isLoading && (coverage?.totalReadings ?? 0) === 0 && (
        <Card className='border-amber-300 dark:border-amber-800'>
          <CardContent className='pt-6 text-sm'>
            Батерейн түүх хараахан цугларч эхлээгүй байна. Төхөөрөмжүүд мэдээлэл
            илгээх тусам энэ тайлан бүрдэнэ. Өмнөх өгөгдлийг сэргээхийг хүсвэл
            супер админ{' '}
            <span className='font-mono'>/reports/battery/backfill</span>{' '}
            үйлдлийг ажиллуулна.
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.tone}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-20' />
              ) : (
                <div className='text-2xl font-bold tabular-nums'>
                  {stat.value}
                </div>
              )}
              <p className='text-muted-foreground truncate pt-1 text-xs'>
                {stat.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(report?.lowBatteryBins.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <IconBatteryOff className='h-5 w-5 text-red-600 dark:text-red-400' />
              <CardTitle>Батерей бага савнууд</CardTitle>
            </div>
            <CardDescription>
              {report?.lowPercentThreshold}%-аас доош цэнэгтэй — эхэлж арга
              хэмжээ авах
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Хогийн сав</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead>Одоогийн цэнэг</TableHead>
                    <TableHead>Хүчдэл</TableHead>
                    <TableHead className='text-right' title={DRAIN_HINT}>
                      Зарцуулалт
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report?.lowBatteryBins.map((row) => (
                    <TableRow
                      key={row.id}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() => router.push(`/dashboard/bins/${row.id}`)}
                    >
                      <TableCell>
                        <div className='font-medium'>
                          {row.binName || row.binId}
                        </div>
                        <div className='text-muted-foreground font-mono text-xs'>
                          {row.binId}
                        </div>
                      </TableCell>
                      <TableCell className='text-sm'>
                        {row.district || '—'}
                        {row.khoroo != null ? `, ${row.khoroo}-р хороо` : ''}
                      </TableCell>
                      <TableCell>
                        <BatteryBar percent={row.currentPercent} />
                      </TableCell>
                      <TableCell className='text-sm'>
                        {row.batteryLevel || '—'}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.drainPerDay}%/хоног
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <CardTitle>Савуудын батерейн ашиглалт</CardTitle>
              <CardDescription>
                Мөр дээр дарж батерейн дэлгэрэнгүй түүхийг харна.
                &quot;Зарцуулалт&quot; — хоногт хэдэн хувиар буурч байгаа (их
                бол хурдан суудаг). &quot;Цэнэг барьсан&quot; — нэг цэнэглэлт
                хэдэн хоног хүрдэг (их бол сайн). Дээрх огноог нэг өдрөөр
                сонгосон бол хэмжилт хүрэлцэхгүй тул 0 харагдана — 7 ба түүнээс
                дээш хоногийг сонгоно уу
              </CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={runBackfill}
              disabled={isBackfilling}
            >
              {isBackfilling ? 'Нөхөж байна...' : 'Түүхийг нөхөх'}
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='w-full lg:w-64'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='drainPerDay'>
                  Хурдан зарцуулж буй эхэнд
                </SelectItem>
                <SelectItem value='holdDays'>
                  Удаан цэнэг барьсан эхэнд
                </SelectItem>
                <SelectItem value='currentPercent'>
                  Одоогийн цэнэг багатай эхэнд
                </SelectItem>
                <SelectItem value='averagePercent'>
                  Дундаж цэнэг багатай эхэнд
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : bins.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              Сонгосон хугацаанд батерейн хэмжилт бүртгэгдээгүй байна.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Хогийн сав</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead>Одоогийн цэнэг</TableHead>
                    <TableHead className='text-right'>Дундаж</TableHead>
                    <TableHead className='text-right' title={DRAIN_HINT}>
                      Зарцуулалт
                    </TableHead>
                    <TableHead className='text-right' title={HOLD_HINT}>
                      Цэнэг барьсан
                    </TableHead>
                    <TableHead className='text-right'>Сольсноос хойш</TableHead>
                    <TableHead className='text-right'>Цэнэглэлт</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bins.map((row) => (
                    <TableRow
                      key={row.id}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() => router.push(`/dashboard/bins/${row.id}`)}
                    >
                      <TableCell>
                        <div className='font-medium'>
                          {row.binName || row.binId}
                        </div>
                        <div className='text-muted-foreground font-mono text-xs'>
                          {row.binId}
                        </div>
                      </TableCell>
                      <TableCell className='text-sm'>
                        {row.district || '—'}
                        {row.khoroo != null ? `, ${row.khoroo}-р хороо` : ''}
                      </TableCell>
                      <TableCell>
                        <BatteryBar percent={row.currentPercent} />
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.averagePercent}%
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.drainPerDay}%/хоног
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='tabular-nums'>
                          {row.holdDays} хоног
                        </span>
                        {!row.completeCycle && (
                          <Badge variant='secondary' className='ml-2'>
                            хамгийн багадаа
                          </Badge>
                        )}
                      </TableCell>
                      {/*
                        "Цэнэг барьсан"-аас өөр тоо: тэр нь нэг цэнэг хэдэн
                        хоног хүрснийг (мөчлөгийн урт), энэ нь батерейг
                        сольсноос хойш хэдэн хоног болсныг (эд ангийн нас)
                        хэлнэ. Хоёулаа хоногоор хэмжигддэг тул баганын нэрээр
                        нь ялгаж байна.
                      */}
                      <TableCell className='text-right'>
                        {row.daysSinceBatteryChange != null ? (
                          <>
                            <div className='tabular-nums'>
                              {row.daysSinceBatteryChange} хоног
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {formatDate(row.batteryReplacedAt)}
                            </div>
                          </>
                        ) : (
                          <span
                            className='text-muted-foreground'
                            title='Түүхэнд батерей сольсон шинж (нэг хэмжилтээр 15 нэгжээс дээш өссөн) олдсонгүй'
                          >
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.rechargeCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
