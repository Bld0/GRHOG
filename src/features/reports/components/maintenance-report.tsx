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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  IconAlertTriangle,
  IconCoin,
  IconTool,
  IconTrash
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  CATEGORY_LABEL,
  MaintenanceRecord,
  MaintenanceReport as Report,
  ReportFilters,
  toQuery
} from '../types';

const PAGE_SIZE = 20;

/**
 * Засвар үйлчилгээний тайлан.
 *
 * Гол хэрэглээ нь давтамж: ямар гэмтэл дахин дахин гарч байна, аль сав хамгийн
 * олон удаа эвдэрч байна. Тиймээс ангилал ба савны давтамж эхэнд харагдана.
 */
export function MaintenanceReport({ filters }: { filters: ReportFilters }) {
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState<string>('ALL');
  const [listLoading, setListLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/maintenance/report?${toQuery(filters)}`
      );
      if (!response.ok) throw new Error('Засварын тайлан татахад алдаа гарлаа');
      setReport(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchRecords = useCallback(async () => {
    setListLoading(true);
    try {
      const query = toQuery(filters, {
        category: category === 'ALL' ? undefined : category,
        page,
        size: PAGE_SIZE
      });
      const response = await apiClient.fetchWithAuth(
        `/api/maintenance?${query}`
      );
      if (!response.ok)
        throw new Error('Засварын жагсаалт татахад алдаа гарлаа');
      const data = await response.json();
      setRecords(data.content ?? []);
      setTotalRecords(data.totalElements ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setListLoading(false);
    }
  }, [filters, category, page]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setPage(0);
  }, [category, filters]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString('mn-MN') : '—';
  const formatMoney = (value: number | null | undefined) =>
    value == null ? '—' : `${value.toLocaleString('mn-MN')}₮`;

  const stats = [
    {
      title: 'Нийт засвар',
      value: report?.totalRecords ?? 0,
      hint: `${report?.binCount ?? 0} саванд`,
      icon: IconTool,
      tone: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Нэг саванд дунджаар',
      value: report?.averagePerBin ?? 0,
      hint: '2-оос дээш бол давтагдаж буй гэмтэл',
      icon: IconAlertTriangle,
      tone: 'text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Түгээмэл шалтгаан',
      value: report?.topCategory
        ? (CATEGORY_LABEL[report.topCategory] ?? report.topCategory)
        : '—',
      hint: 'Хамгийн олон давтагдсан ангилал',
      icon: IconTrash,
      tone: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Нийт зардал',
      value: formatMoney(report?.totalCost),
      hint: 'Бүртгэсэн зардлын нийлбэр',
      icon: IconCoin,
      tone: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className='space-y-6'>
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
              <p className='text-muted-foreground pt-1 text-xs'>{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Шалтгааны ангиллаар</CardTitle>
            <CardDescription>
              Ангилал дээр дарж тухайн засваруудыг доор харна
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-40 w-full' />
            ) : !report?.byCategory.length ? (
              <div className='text-muted-foreground py-6 text-center text-sm'>
                Сонгосон хугацаанд засвар бүртгэгдээгүй.
              </div>
            ) : (
              <div className='space-y-3'>
                {report.byCategory.map((row) => (
                  <button
                    key={row.category}
                    type='button'
                    onClick={() =>
                      setCategory(
                        category === row.category ? 'ALL' : row.category
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                      category === row.category
                        ? 'border-primary'
                        : 'bg-muted/40 border-transparent'
                    }`}
                  >
                    <span className='w-36 shrink-0 text-sm font-medium'>
                      {CATEGORY_LABEL[row.category] ?? row.category}
                    </span>
                    <div className='h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                      <div
                        className='bg-primary h-2 rounded-full'
                        style={{ width: `${Math.min(100, row.percent)}%` }}
                      />
                    </div>
                    <span className='w-24 shrink-0 text-right text-sm tabular-nums'>
                      {row.count} ({row.percent}%)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Давтамж өндөртэй савнууд</CardTitle>
            <CardDescription>
              Дахин дахин эвдэрч буй сав — солих эсэхийг шийдэх үндэслэл
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-40 w-full' />
            ) : !report?.byBin.length ? (
              <div className='text-muted-foreground py-6 text-center text-sm'>
                Мэдээлэл алга.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Хогийн сав</TableHead>
                      <TableHead>Байршил</TableHead>
                      <TableHead className='text-right'>Засвар</TableHead>
                      <TableHead>Сүүлд</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byBin.slice(0, 10).map((row) => (
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
                        <TableCell className='text-right'>
                          <Badge
                            variant={
                              row.count >= 3 ? 'destructive' : 'secondary'
                            }
                          >
                            {row.count}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>
                          {formatDateTime(row.lastPerformedAt)}
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
          <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <CardTitle>Засварын бүртгэлүүд</CardTitle>
              <CardDescription>
                {category === 'ALL'
                  ? 'Сонгосон хугацааны бүх бүртгэл'
                  : `Шүүлт: ${CATEGORY_LABEL[category] ?? category}`}
              </CardDescription>
            </div>
            <div className='flex gap-2'>
              {category !== 'ALL' && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setCategory('ALL')}
                >
                  Шүүлт арилгах
                </Button>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push('/dashboard/maintenance')}
              >
                Бүртгэл нэмэх
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              Бүртгэл алга. «Бүртгэл нэмэх» товчоор оруулна.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Хогийн сав</TableHead>
                    <TableHead>Ангилал</TableHead>
                    <TableHead>Шалтгаан</TableHead>
                    <TableHead>Гүйцэтгэсэн</TableHead>
                    <TableHead className='text-right'>Зардал</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className='text-sm whitespace-nowrap'>
                        {formatDateTime(record.performedAt)}
                      </TableCell>
                      <TableCell>
                        <div className='font-medium'>
                          {record.bin?.binName || record.bin?.binId || '—'}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {record.bin?.khoroo != null
                            ? `${record.bin.khoroo}-р хороо`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>
                          {CATEGORY_LABEL[record.category] ?? record.category}
                        </Badge>
                      </TableCell>
                      <TableCell className='max-w-xs text-sm'>
                        {record.reason || '—'}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {record.performedBy || '—'}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatMoney(record.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalRecords > PAGE_SIZE && (
            <div className='flex items-center justify-between pt-4'>
              <div className='text-muted-foreground text-sm'>
                Нийт {totalRecords} бүртгэл · {page + 1}/{totalPages}-р хуудас
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
