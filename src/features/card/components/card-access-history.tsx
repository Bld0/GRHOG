'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { TablePagination } from '@/components/ui/table-pagination';
import type { AccessHistoryItem } from './use-card-detail';

/**
 * Нэвтрэлтийн түүхийн хугацааны сонголт — Тайлангийн «Түргэн сонголт»-той
 * ижил муж, ижил утгатай.
 *
 * `days` нь ХОНОГИЙН тоо, цагийн зөрүү биш: 0 гэдэг нь өнөөдрийн 00:00-оос
 * хойш, 7 гэдэг нь 7 хоногийн өмнөх өдрийн 00:00-оос хойш. Цагаар нь тоолбол
 * яг 7 хоногийн өмнөх өглөө уншуулсан мөр өдрийн цагаас хамаараад заримдаа
 * багтаж, заримдаа унана — тайлан хоногоор боддогтой зөрнө.
 */
const HISTORY_RANGES: { key: string; label: string; days: number | null }[] = [
  { key: 'today', label: 'Өнөөдөр', days: 0 },
  { key: '7', label: '7 хоног', days: 7 },
  { key: '30', label: '30 хоног', days: 30 },
  { key: '90', label: '90 хоног', days: 90 },
  { key: 'all', label: 'Бүгд', days: null }
];

/** Картын нэвтрэлтийн түүх — хугацааны шүүлт ба хуудаслалт. */
export function CardAccessHistory({
  history
}: {
  history: AccessHistoryItem[];
}) {
  // Өгөгдмөл нь «Бүгд»: энэ хуудас нэг иргэний бүх түүхийн тухай тул хугацааны
  // муж нь асуултыг нарийсгах хэрэгсэл болохоос анхны шүүлт биш.
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Өмнө нь `getFilteredHistory()` нэг рендерт гурван удаа дуудагдаж бүх
  // жагсаалтыг дахин шүүдэг байв.
  const filtered = useMemo(() => {
    const range = HISTORY_RANGES.find((item) => item.key === dateFilter);
    if (!range || range.days == null) return history;

    // Хоногийн эхлэлээс тоолно — тайлангийн quick range-тэй ижил.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    cutoff.setHours(0, 0, 0, 0);
    return history.filter((item) => new Date(item.createdAt) >= cutoff);
  }, [history, dateFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageRows = filtered.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-col gap-1'>
            <CardTitle>Нэвтрэлтийн түүх</CardTitle>
            {/* Сонгосон хугацаанд хэдэн мөр үлдснийг харуулна: 4 уншуулалт
                нь бүх мужид багтдаг тохиолдолд шүүлтүүр ажиллаагүй мэт
                харагддаг байв. */}
            <CardDescription>
              {filtered.length} нэвтрэлт
              {dateFilter !== 'all' && ` · нийт ${history.length}`}
            </CardDescription>
          </div>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm'>Мөр:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className='w-[70px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 25, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              {HISTORY_RANGES.map((range) => (
                <Button
                  key={range.key}
                  variant={dateFilter === range.key ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => {
                    setDateFilter(range.key);
                    setCurrentPage(0);
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Огноо</TableHead>
                <TableHead>Цаг</TableHead>
                <TableHead>Сав</TableHead>
                <TableHead>Байршил</TableHead>
                <TableHead>Төлөв</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-muted-foreground py-8 text-center'
                  >
                    Сонгосон хугацаанд нэвтрэлт байхгүй
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((access, index) => {
                  const at = new Date(access.createdAt);
                  return (
                    <TableRow key={access.id || index}>
                      <TableCell>{at.toLocaleDateString('mn-MN')}</TableCell>
                      <TableCell>
                        {at.toLocaleTimeString('mn-MN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        <Link
                          href={`/dashboard/bins/${access.binId}`}
                          className='text-primary hover:text-primary/80 cursor-pointer font-medium hover:underline'
                        >
                          {access.binName || 'Тодорхойгүй'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {access.binLocation || 'Байршил тодорхойгүй'}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='text-xs'>
                          Амжилттай
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 0}
          hasNext={currentPage < totalPages - 1}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
