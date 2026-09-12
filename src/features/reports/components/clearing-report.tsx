'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  IconAlertTriangle,
  IconGauge,
  IconNfc,
  IconTruck
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { BinClearing } from '@/types';
import {
  ClearingReport as Report,
  ReportFilters,
  STATUS_LABEL,
  STATUS_STYLE,
  toQuery
} from '../types';
import { ReportStatsGrid } from './report-stats-grid';

const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant='outline'
      className={`border-transparent ${STATUS_STYLE[status] ?? ''}`}
    >
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

/**
 * Хоослолтын тайлан: хэдэн ачилт, хаана, хэн хийсэн, ямар дүүрэлттэй байхад.
 *
 * Чипээр мэдэгдсэн эсэх ба баталгаажуулалтын төлөв нь ачилт бодитоор хийгдсэн
 * эсэхэд хяналт тавих гол хоёр үзүүлэлт тул эхний эгнээнд харагдана.
 */
export function ClearingReport({ filters }: { filters: ReportFilters }) {
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [details, setDetails] = useState<BinClearing[]>([]);
  const [totalDetails, setTotalDetails] = useState(0);
  const [page, setPage] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [source, setSource] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [binId, setBinId] = useState<number | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/reports/clearings?${toQuery(filters)}`
      );
      if (!response.ok)
        throw new Error('Хоослолтын тайлан татахад алдаа гарлаа');
      setReport(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchDetails = useCallback(async () => {
    setDetailsLoading(true);
    try {
      const query = toQuery(filters, {
        source: source === 'ALL' ? undefined : source,
        status: status === 'ALL' ? undefined : status,
        binId: binId ?? undefined,
        page,
        size: PAGE_SIZE
      });
      const response = await apiClient.fetchWithAuth(
        `/api/reports/clearings/details?${query}`
      );
      if (!response.ok)
        throw new Error('Хоослолтын жагсаалт татахад алдаа гарлаа');
      const data = await response.json();
      setDetails(data.content ?? []);
      setTotalDetails(data.totalElements ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setDetailsLoading(false);
    }
  }, [filters, source, status, binId, page]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    setPage(0);
  }, [source, status, binId, filters]);

  const totalPages = Math.max(1, Math.ceil(totalDetails / PAGE_SIZE));
  const formatDateTime = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString('mn-MN') : '—';
  const formatPercent = (value: number | null | undefined) =>
    value == null || value < 0 ? '—' : `${value.toFixed(1)}%`;

  const notConfirmed = report?.byStatus?.NOT_CONFIRMED ?? 0;

  const stats = [
    {
      title: 'Нийт хоослолт',
      value: report?.totalClearings ?? 0,
      hint: `${report?.binCount ?? 0} саван дээр`,
      icon: IconTruck,
      tone: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Чипээр мэдэгдсэн',
      value: report?.bySource?.CARD ?? 0,
      hint: `Нийтийн ${report?.cardReportedPercent ?? 0}% · мэдрэгчээр ${report?.bySource?.SENSOR ?? 0}`,
      icon: IconNfc,
      tone: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Дундаж дүүрэлт',
      value:
        report?.averageFillBeforeClear != null
          ? `${report.averageFillBeforeClear}%`
          : '—',
      hint: 'Хоослохын өмнөх',
      icon: IconGauge,
      tone: 'text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Зөрүүтэй ачилт',
      value: notConfirmed,
      hint: 'Мэдэгдсэн ч дүүрэлт буураагүй',
      icon: IconAlertTriangle,
      tone: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className='space-y-6'>
      <ReportStatsGrid stats={stats} loading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle>Баталгаажуулалтын төлөв</CardTitle>
          <CardDescription>
            Чип уншуулж мэдэгдсэн ачилтыг савны дүүрэлттэй харьцуулсан дүн
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className='h-10 w-full' />
          ) : (
            <div className='flex flex-wrap gap-3'>
              {Object.entries(report?.byStatus ?? {}).map(([key, count]) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => setStatus(status === key ? 'ALL' : key)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                    status === key
                      ? 'border-primary'
                      : 'bg-muted/50 border-transparent'
                  }`}
                >
                  <StatusBadge status={key} />
                  <span className='font-semibold tabular-nums'>{count}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Хороогоор</CardTitle>
            <CardDescription>Хоослолтын тоо ба дундаж дүүрэлт</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-32 w-full' />
            ) : !report?.byKhoroo.length ? (
              <div className='text-muted-foreground py-6 text-center text-sm'>
                Мэдээлэл алга.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дүүрэг</TableHead>
                      <TableHead>Хороо</TableHead>
                      <TableHead className='text-right'>Хоослолт</TableHead>
                      <TableHead className='text-right'>
                        Дундаж дүүрэлт
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byKhoroo.map((row) => (
                      <TableRow key={`${row.district}-${row.khoroo}`}>
                        <TableCell>{row.district || '—'}</TableCell>
                        <TableCell>
                          {row.khoroo != null ? `${row.khoroo}-р хороо` : '—'}
                        </TableCell>
                        <TableCell className='text-right font-medium tabular-nums'>
                          {row.count}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {formatPercent(row.averageFillBeforeClear)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Жолоочоор</CardTitle>
            <CardDescription>
              Чип уншуулсан ачилт ба түүний хэд нь дүүрэлтээр баталгаажсан
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-32 w-full' />
            ) : !report?.byCollector.length ? (
              <div className='text-muted-foreground py-6 text-center text-sm'>
                Энэ хугацаанд чип уншуулсан ачилт алга.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Жолооч</TableHead>
                      <TableHead className='text-right'>Ачилт</TableHead>
                      <TableHead className='text-right'>Баталгаажсан</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byCollector.map((row) => (
                      <TableRow key={row.cardId}>
                        <TableCell>
                          <div className='font-medium'>{row.name || '—'}</div>
                          <div className='text-muted-foreground font-mono text-xs'>
                            {row.cardId}
                          </div>
                        </TableCell>
                        <TableCell className='text-right font-medium tabular-nums'>
                          {row.count}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {row.confirmedCount} ({row.confirmedPercent}%)
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

      <Card>
        <CardHeader>
          <CardTitle>Хогийн савуудаар</CardTitle>
          <CardDescription>
            Хоослолтын тоогоор эрэмбэлэв. Мөр дээр дарж савны дэлгэрэнгүй рүү
            орно
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className='h-40 w-full' />
          ) : !report?.byBin.length ? (
            <div className='text-muted-foreground py-6 text-center text-sm'>
              Сонгосон хугацаанд хоослолт бүртгэгдээгүй.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Хогийн сав</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead className='text-right'>Хоослолт</TableHead>
                    <TableHead className='text-right'>Дундаж дүүрэлт</TableHead>
                    <TableHead>Сүүлд хоослосон</TableHead>
                    <TableHead className='text-right'>Жагсаалт</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byBin.map((row) => (
                    <TableRow key={row.id} className='hover:bg-muted/50'>
                      <TableCell
                        className='cursor-pointer'
                        onClick={() => router.push(`/dashboard/bins/${row.id}`)}
                      >
                        <div className='font-medium'>
                          {row.binName || row.binId}
                        </div>
                        <div className='text-muted-foreground font-mono text-xs'>
                          {row.binId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>{row.location || '—'}</div>
                        <div className='text-muted-foreground text-xs'>
                          {row.district || '—'}
                          {row.khoroo != null ? `, ${row.khoroo}-р хороо` : ''}
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {row.count}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatPercent(row.averageFillBeforeClear)}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {formatDateTime(row.lastClearedAt)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant={binId === row.id ? 'default' : 'outline'}
                          size='sm'
                          onClick={() =>
                            setBinId(binId === row.id ? null : row.id)
                          }
                        >
                          {binId === row.id ? 'Шүүлт арилгах' : 'Шүүх'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='space-y-4'>
          <div>
            <CardTitle>Хоослолтын дэлгэрэнгүй</CardTitle>
            <CardDescription>
              Огноо, сав, жолооч, чип уншуулсан эсэх, дүүрэлтийн харьцуулалт
            </CardDescription>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Эх сурвалж' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Бүх эх сурвалж</SelectItem>
                <SelectItem value='CARD'>Чип уншуулсан</SelectItem>
                <SelectItem value='SENSOR'>Мэдрэгчээр илэрсэн</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-52'>
                <SelectValue placeholder='Төлөв' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Бүх төлөв</SelectItem>
                {Object.keys(STATUS_LABEL).map((key) => (
                  <SelectItem key={key} value={key}>
                    {STATUS_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {binId != null && (
              <Button variant='ghost' size='sm' onClick={() => setBinId(null)}>
                Нэг савны шүүлт ✕
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {detailsLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : details.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              Сонгосон шүүлтүүрт тохирох хоослолт алга.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Огноо, цаг</TableHead>
                    <TableHead>Хогийн сав</TableHead>
                    <TableHead>Ачилт хийсэн</TableHead>
                    <TableHead className='text-right'>Нэвтрэлт</TableHead>
                    <TableHead>Дүүрэлт (өмнө → дараа)</TableHead>
                    <TableHead>Төлөв</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className='text-sm whitespace-nowrap'>
                        {formatDateTime(row.clearedAt)}
                      </TableCell>
                      <TableCell
                        className='hover:text-primary cursor-pointer'
                        onClick={() =>
                          row.bin?.id &&
                          router.push(`/dashboard/bins/${row.bin.id}`)
                        }
                      >
                        <div className='font-medium'>
                          {row.bin?.binName || '—'}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {row.bin?.khoroo != null
                            ? `${row.bin.khoroo}-р хороо`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.source === 'CARD' ? (
                          <div>
                            <div className='text-sm font-medium'>
                              {row.clearedByName || 'Жолооч'}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              чип уншуулсан
                            </div>
                          </div>
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            Мэдрэгчээр илэрсэн
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.penetrationCount ?? 0}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatPercent(row.fillLevelBeforeClearPercent)}
                        {row.fillLevelAfterClear != null &&
                          row.fillLevelAfterClear >= 0 && (
                            <span className='text-muted-foreground'>
                              {' '}
                              → {row.fillLevelAfterClear.toFixed(1)}%
                            </span>
                          )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={row.verificationStatus ?? 'CONFIRMED'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalDetails > PAGE_SIZE && (
            <div className='flex items-center justify-between pt-4'>
              <div className='text-muted-foreground text-sm'>
                Нийт {totalDetails} хоослолт · {page + 1}/{totalPages}-р хуудас
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Өмнөх
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Дараах
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
