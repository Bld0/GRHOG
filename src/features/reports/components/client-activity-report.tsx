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
import { Input } from '@/components/ui/input';
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
  IconSearch,
  IconUsersGroup,
  IconUserOff,
  IconUserCheck
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BUCKET_LABEL,
  ClientActivityReport as ActivityReport,
  InactiveClient,
  InactivityBucket,
  ReportFilters,
  toQuery
} from '../types';

const PAGE_SIZE = 20;

/** Идэвхтэй/идэвхгүй харьцааг нэг мөрөнд харуулах зурвас. */
function ActivityBar({ activePercent }: { activePercent: number }) {
  return (
    <div className='flex items-center gap-2'>
      <div className='h-2 w-24 overflow-hidden rounded-full bg-red-200 dark:bg-red-900/40'>
        <div
          className='h-2 rounded-full bg-green-600'
          style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }}
        />
      </div>
      <span className='text-sm font-medium tabular-nums'>
        {activePercent.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Хороогоор хэрэглэгчийн ашиглалтын идэвх.
 *
 * Зорилго нь зөвхөн тоо харуулах биш — саваа ашиглахгүй байгаа хэрэглэгчийг
 * нэрээр нь илрүүлэх явдал. Тиймээс идэвхгүйн тоо бүр дарагдах ба доорх
 * жагсаалтыг шууд шүүнэ.
 */
export function ClientActivityReport({ filters }: { filters: ReportFilters }) {
  const router = useRouter();

  const [report, setReport] = useState<ActivityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [bucket, setBucket] = useState<InactivityBucket>('all');
  const [khorooFilter, setKhorooFilter] = useState<number | null>(null);
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [page, setPage] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/reports/client-activity?${toQuery(filters)}`
      );
      if (!response.ok) throw new Error('Идэвхийн тайлан татахад алдаа гарлаа');
      setReport(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchClients = useCallback(async () => {
    setListLoading(true);
    try {
      const query = toQuery(
        {
          ...filters,
          khoroo: khorooFilter != null ? String(khorooFilter) : filters.khoroo
        },
        {
          bucket: bucket === 'all' ? undefined : bucket,
          search: debouncedSearch.trim() || undefined,
          page,
          size: PAGE_SIZE
        }
      );
      const response = await apiClient.fetchWithAuth(
        `/api/reports/client-activity/inactive?${query}`
      );
      if (!response.ok)
        throw new Error('Идэвхгүй хэрэглэгчийн жагсаалт татахад алдаа гарлаа');
      const data = await response.json();
      setClients(data.content ?? []);
      setTotalClients(data.totalElements ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setListLoading(false);
    }
  }, [filters, khorooFilter, bucket, debouncedSearch, page]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Шүүлтүүр солигдвол эхний хуудас руу буцна.
  useEffect(() => {
    setPage(0);
  }, [bucket, khorooFilter, debouncedSearch, filters]);

  const totalPages = Math.max(1, Math.ceil(totalClients / PAGE_SIZE));
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('mn-MN') : '—';

  const stats = [
    {
      title: 'Нийт хэрэглэгч',
      value: report?.totalClients ?? 0,
      hint: 'Сонгосон хороонд бүртгэлтэй',
      icon: IconUsersGroup,
      tone: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Идэвхтэй',
      value: report?.activeClients ?? 0,
      hint: `Нийтийн ${report?.activePercent ?? 0}%`,
      icon: IconUserCheck,
      tone: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Идэвхгүй',
      value: report?.inactiveClients ?? 0,
      hint: `Нийтийн ${report?.inactivePercent ?? 0}%`,
      icon: IconUserOff,
      tone: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Хэзээ ч ашиглаагүй',
      value: report?.buckets.never ?? 0,
      hint: 'Картаа огт эхлүүлээгүй',
      icon: IconUserOff,
      tone: 'text-amber-600 dark:text-amber-400'
    }
  ];

  const buckets: { key: InactivityBucket; count: number }[] = [
    { key: '7', count: report?.buckets.days7 ?? 0 },
    { key: '14', count: report?.buckets.days14 ?? 0 },
    { key: '30', count: report?.buckets.days30 ?? 0 },
    { key: 'never', count: report?.buckets.never ?? 0 }
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
                <Skeleton className='h-8 w-16' />
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

      <Card>
        <CardHeader>
          <CardTitle>Хороогоор</CardTitle>
          <CardDescription>
            Идэвхгүйн тоо дээр дарж тухайн хорооны хэрэглэгчдийг доор харна
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : !report?.byKhoroo.length ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              Сонгосон нөхцөлд хэрэглэгч олдсонгүй.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дүүрэг</TableHead>
                    <TableHead>Хороо</TableHead>
                    <TableHead className='text-right'>Нийт</TableHead>
                    <TableHead className='text-right'>Идэвхтэй</TableHead>
                    <TableHead className='text-right'>Идэвхгүй</TableHead>
                    <TableHead>Идэвхтэйн хувь</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byKhoroo.map((row) => (
                    <TableRow
                      key={`${row.district}-${row.khoroo}`}
                      className={
                        khorooFilter === row.khoroo ? 'bg-muted/60' : undefined
                      }
                    >
                      <TableCell>{row.district || '—'}</TableCell>
                      <TableCell>
                        {row.khoroo != null ? `${row.khoroo}-р хороо` : '—'}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.total}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.active}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2 font-semibold text-red-600 tabular-nums hover:text-red-700 dark:text-red-400'
                          onClick={() =>
                            setKhorooFilter(
                              khorooFilter === row.khoroo ? null : row.khoroo
                            )
                          }
                        >
                          {row.inactive}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <ActivityBar activePercent={row.activePercent} />
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
          <div className='flex flex-col gap-1'>
            <CardTitle>Идэвхгүй хэрэглэгчид</CardTitle>
            <CardDescription>
              Хамгийн удаан ашиглаагүй нь эхэнд. Мөр дээр дарж дэлгэрэнгүй рүү
              орно
            </CardDescription>
          </div>

          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant={bucket === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setBucket('all')}
              >
                {BUCKET_LABEL.all}
              </Button>
              {buckets.map((item) => (
                <Button
                  key={item.key}
                  variant={bucket === item.key ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setBucket(item.key)}
                >
                  {BUCKET_LABEL[item.key]}
                  <Badge variant='secondary' className='ml-2 tabular-nums'>
                    {item.count}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className='flex items-center gap-2'>
              {khorooFilter != null && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setKhorooFilter(null)}
                >
                  {khorooFilter}-р хороо ✕
                </Button>
              )}
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Нэр, утас, хаяг...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='w-full pl-8 sm:w-60'
                />
              </div>
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
          ) : clients.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              Энэ ангилалд хэрэглэгч алга — бүгд саваа ашиглаж байна.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Нэр</TableHead>
                    <TableHead>Утас</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead>Сүүлд ашигласан</TableHead>
                    <TableHead className='text-right'>
                      Ашиглаагүй хоног
                    </TableHead>
                    <TableHead className='text-right'>Нийт хэрэглээ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() =>
                        client.cardId &&
                        router.push(`/dashboard/card/${client.cardId}`)
                      }
                    >
                      <TableCell className='font-medium'>
                        {client.name || '—'}
                      </TableCell>
                      <TableCell>{client.phone || '—'}</TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {client.district || '—'}
                          {client.khoroo != null
                            ? `, ${client.khoroo}-р хороо`
                            : ''}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {client.streetBuilding || client.address || '—'}
                          {client.apartmentNumber
                            ? ` — ${client.apartmentNumber}`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.neverUsed ? (
                          <Badge
                            variant='outline'
                            className='border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          >
                            Хэзээ ч
                          </Badge>
                        ) : (
                          formatDate(client.lastUsedAt)
                        )}
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {client.daysInactive ?? '—'}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-right tabular-nums'>
                        {client.totalAccess}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalClients > PAGE_SIZE && (
            <div className='flex items-center justify-between pt-4'>
              <div className='text-muted-foreground text-sm'>
                Нийт {totalClients} хэрэглэгч · {page + 1}/{totalPages}-р хуудас
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
