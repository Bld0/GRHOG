'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  IconEyeOff,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  ReportFilters,
  SENSOR_STATUS_LABEL,
  SENSOR_STATUS_STYLE,
  SensorHealthRow,
  toQuery
} from '../types';

/** Тоолж харуулах эрэмбийн сонголт — бүгд клиент талд, backend sortBy авдаггүй. */
type SortOption = 'default' | 'failurePercent' | 'totalMessages' | 'lastSensorOkAt';

function StatusBadge({ status }: { status: SensorHealthRow['status'] }) {
  return (
    <Badge
      variant='outline'
      className={`border-transparent ${SENSOR_STATUS_STYLE[status]}`}
    >
      {SENSOR_STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * Мэдрэгчийн эрүүл мэндийн тайлан.
 *
 * Backend savны storageLevel-ийн алдааг цоожтой "хоосон сав" гэж андуурахаа
 * больсон — зөв, гэвч энэ нь мэдрэгч эвдэрсэн савыг "юу ч мэдээлэхгүй" болгоно.
 * Энэ таб нь "хоосолгүй" ба "мэдрэгч эвдэрсэн" хоёрыг ялгаж харуулна.
 */
export function SensorHealthReport({ filters }: { filters: ReportFilters }) {
  const router = useRouter();

  const [rows, setRows] = useState<SensorHealthRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/reports/sensor-health?${toQuery(filters)}`
      );
      if (!response.ok) {
        throw new Error('Мэдрэгчийн тайлан татахад алдаа гарлаа');
      }
      setRows(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    switch (sortBy) {
      case 'totalMessages':
        return copy.sort((a, b) => b.totalMessages - a.totalMessages);
      case 'lastSensorOkAt':
        // Хамгийн удаан ажилладаагүй нь эхэнд — null (хэзээ ч ажиллаагүй) хамгийн түрүүнд.
        return copy.sort((a, b) => {
          const aTime = a.lastSensorOkAt ? new Date(a.lastSensorOkAt).getTime() : -Infinity;
          const bTime = b.lastSensorOkAt ? new Date(b.lastSensorOkAt).getTime() : -Infinity;
          return aTime - bTime;
        });
      case 'failurePercent':
        return copy.sort((a, b) => b.failurePercent - a.failurePercent);
      default:
        // Аюулын дараалал: Сохор → Завсардсан → Эрүүл, тус бүрийн дотор алдааны хувиар буурахаар.
        return copy.sort((a, b) => {
          const rank = { BLIND: 0, INTERMITTENT: 1, HEALTHY: 2 };
          if (rank[a.status] !== rank[b.status]) {
            return rank[a.status] - rank[b.status];
          }
          return b.failurePercent - a.failurePercent;
        });
    }
  }, [rows, sortBy]);

  const counts = useMemo(
    () => ({
      BLIND: rows.filter((r) => r.status === 'BLIND').length,
      INTERMITTENT: rows.filter((r) => r.status === 'INTERMITTENT').length,
      HEALTHY: rows.filter((r) => r.status === 'HEALTHY').length
    }),
    [rows]
  );

  const stats = [
    {
      title: 'Сохор',
      value: counts.BLIND,
      hint: '6 цагийн турш хүчинтэй хэмжилт өгөөгүй — юу ч харагдахгүй байна',
      icon: IconEyeOff,
      tone: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Завсардсан',
      value: counts.INTERMITTENT,
      hint: 'Алдаа 10%-иас дээш — хэмжилт заримдаа алга болдог',
      icon: IconAlertTriangle,
      tone: 'text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Эрүүл',
      value: counts.HEALTHY,
      hint: 'Хэмжилт тогтмол ирж байна',
      icon: IconCircleCheck,
      tone: 'text-green-600 dark:text-green-400'
    }
  ];

  // 24 цагийн формат — mn-MN locale биш toLocaleString() бол AM/PM гарна.
  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString('mn-MN') : '—';

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
              <p className='text-muted-foreground truncate pt-1 text-xs'>
                {stat.hint}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Гурван тооны ард заавар. Тоо өөрөө юу гэсэн үг болохоо хэлдэггүй:
            "Сохор 13" гэдгийг уншиж чадахгүй хүнд энэ тайлан утгагүй бөгөөд
            бүр аюултай — хоослолтын тоо бүрэн мэт харагдуулна. */}
        <Card className='bg-muted/40'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              Хэрхэн унших вэ
            </CardTitle>
            <IconInfoCircle className='text-muted-foreground h-5 w-5' />
          </CardHeader>
          <CardContent className='text-muted-foreground space-y-1.5 pt-1 text-xs'>
            <p>
              Сав бүр дүүрэлтээ тогтмол мэдээлдэг. Мэдрэгч уншиж чадаагүй үед
              хэмжилт огт ирэхгүй — энэ нь сав хоосон гэсэн үг{' '}
              <span className='font-medium'>биш</span>.
            </p>
            <p>
              <span className='font-medium text-red-600 dark:text-red-400'>
                Сохор
              </span>{' '}
              савыг хоослосон эсэхийг систем мэдэхгүй тул хоослолтын тайланд
              огт харагдахгүй. Мэдрэгчийг нь засах шаардлагатай.
            </p>
            <p>
              <span className='font-medium text-amber-600 dark:text-amber-400'>
                Завсардсан
              </span>{' '}
              савны мэдээлэл ирдэг ч тасалддаг тул дүүргэлт, хоослолт хожимдож
              шинэчлэгдэнэ.
            </p>
            <p>
              <span className='font-mono'>NO_RESPONSE</span> — мэдрэгч хариу
              өгөөгүй; ихэвчлэн холболт эсвэл тэжээлийн асуудал.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <CardTitle>Мэдрэгчийн эрүүл мэнд</CardTitle>
              <CardDescription>
                &quot;Сохор&quot; гэдэг нь сав мессеж илгээж байгаа хэдий ч 6
                цагийн турш хүчинтэй хэмжилт өгөөгүй гэсэн үг — сав хоослогдсон
                эсэхийг мэдэх боломжгүй болно. Мөр дээр дарж савны дэлгэрэнгүйг
                харна.
              </CardDescription>
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className='w-full lg:w-64'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='default'>Хамгийн аюултай эхэнд</SelectItem>
                <SelectItem value='failurePercent'>
                  Алдааны хувь өндөр эхэнд
                </SelectItem>
                <SelectItem value='totalMessages'>
                  Нийт мессеж ихтэй эхэнд
                </SelectItem>
                <SelectItem value='lastSensorOkAt'>
                  Хамгийн удаан ажиллаагүй эхэнд
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
          ) : sortedRows.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              Сонгосон хугацаанд мэдрэгчийн мэдээлэл бүртгэгдээгүй байна.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сав</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead className='text-right'>Нийт мессеж</TableHead>
                    <TableHead className='text-right'>Хүчинтэй</TableHead>
                    <TableHead className='text-right'>Амжилтгүй</TableHead>
                    <TableHead className='text-right'>Алдааны хувь</TableHead>
                    <TableHead>Сүүлд ажилласан</TableHead>
                    <TableHead>Алдааны код</TableHead>
                    <TableHead>Төлөв</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((row) => (
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
                      <TableCell className='text-right tabular-nums'>
                        {row.totalMessages}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.validCount}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.failedCount}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.failurePercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className='text-sm'>
                        {formatDateTime(row.lastSensorOkAt)}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {row.dominantErrorCode || '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
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
