'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconX
} from '@tabler/icons-react';

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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useBinUsagesByLocation } from '@/hooks/use-api-data';
import { PaginationParams } from '@/hooks/use-pagination';

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('mn-MN') : '-';

/**
 * Ашиглалт хороо + байршлаар бүлэглэсэн таб.
 *
 * Хуудаслалт нь мөрөөр биш БҮЛГЭЭР явна — backend
 * `/bin-usages/grouped-by-location` бүлгийг бүтнээр нь буцаадаг тул
 * дэлгэгдсэн савуудыг нэмж татах шаардлагагүй.
 */
export function TransactionsGrouped() {
  const [currentPage, setCurrentPage] = useState(0);
  // Байршлын бүлэг цөөн (~21) — анхдагчаар нэг хуудсанд бүгд багтана.
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Бичиж буй утга ба илгээгдсэн утга тусдаа — товчлуур бүрд дахин татахгүй.
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const params: PaginationParams = useMemo(
    () =>
      ({
        page: currentPage,
        size: itemsPerPage,
        ...(searchTerm ? { search: searchTerm } : {})
      }) as PaginationParams,
    [currentPage, itemsPerPage, searchTerm]
  );

  const {
    data: groups,
    loading,
    error,
    pagination,
    refetch
  } = useBinUsagesByLocation(true, params);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (error) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center gap-4 py-10'>
          <p className='text-muted-foreground'>
            Мэдээлэл ачааллахад алдаа гарлаа: {error}
          </p>
          <Button onClick={refetch}>Дахин оролдох</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex flex-wrap items-center gap-4'>
            <div>
              <CardTitle>Хороо & Байршлаар ангилсан ашиглалт</CardTitle>
              <CardDescription>
                {pagination.totalElements} байршил • Хуудаслалт{' '}
                {currentPage + 1}/{pagination.totalPages || 1}
              </CardDescription>
            </div>

            <div className='flex items-center gap-2'>
              <div className='relative'>
                <IconSearch className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    setSearchTerm(searchInput.trim());
                  }}
                  placeholder='Савны нэр, хэрэглэгч, утас...'
                  className='w-[280px] pl-8'
                />
                {searchInput && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                    }}
                    className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2'
                    aria-label='Хайлт цэвэрлэх'
                  >
                    <IconX className='h-4 w-4' />
                  </button>
                )}
              </div>
              <Button
                onClick={() => setSearchTerm(searchInput.trim())}
                size='sm'
              >
                Хайх
              </Button>
            </div>
          </div>

          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className='w-[100px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100, 200].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <ScrollArea className='w-full'>
            <Table className='w-full'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[50px]'></TableHead>
                  <TableHead>Хороо / Байршил</TableHead>
                  <TableHead className='w-[110px] text-center'>
                    Ашиглалт
                  </TableHead>
                  <TableHead className='w-[150px] text-center'>
                    Ашигласан хэрэглэгч
                  </TableHead>
                  <TableHead className='w-[130px] text-center'>
                    Хогийн савны тоо
                  </TableHead>
                  <TableHead className='w-[180px] text-center'>
                    Дундаж дүүрэлт
                  </TableHead>
                  <TableHead className='w-[130px] text-center'>
                    Дундаж батарей
                  </TableHead>
                  <TableHead className='w-[170px] text-center'>
                    Сүүлд ашигласан
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups && groups.length > 0 ? (
                  groups.map((group) => {
                    const key = `${group.district}-${group.khoroo}-${group.location}`;
                    const isExpanded = expanded.has(key);
                    return (
                      <React.Fragment key={key}>
                        <TableRow
                          className='hover:bg-muted/50 cursor-pointer font-medium'
                          onClick={() => toggle(key)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <IconChevronUp className='h-4 w-4' />
                            ) : (
                              <IconChevronDown className='h-4 w-4' />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className='font-semibold'>
                              {group.khoroo} Хороо , {group.location}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {group.district}
                            </div>
                          </TableCell>
                          <TableCell className='text-center font-semibold'>
                            {group.usageCount}
                          </TableCell>
                          <TableCell className='text-center font-semibold'>
                            {group.userCount}
                          </TableCell>
                          <TableCell className='text-center font-semibold'>
                            {group.binCount}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center justify-center gap-2'>
                              <Progress
                                value={group.avgStorageLevelPercent}
                                className='h-2 w-16'
                              />
                              <span className='text-sm font-medium'>
                                {group.avgStorageLevelPercent.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-center'>
                            <Badge
                              variant={
                                group.avgBatteryLevelPercent > 50
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {group.avgBatteryLevelPercent.toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell className='text-center'>
                            {formatDate(group.lastUsedAt)}
                          </TableCell>
                        </TableRow>

                        {isExpanded &&
                          group.bins.map((bin) => (
                            <TableRow
                              key={`${key}-${bin.binName}`}
                              className='bg-muted/20'
                            >
                              <TableCell></TableCell>
                              <TableCell className='pl-8'>
                                <Link
                                  href={`/dashboard/bins/${bin.binId}`}
                                  className='text-primary hover:text-primary/80 font-medium hover:underline'
                                >
                                  {bin.binName}
                                </Link>
                              </TableCell>
                              <TableCell className='text-center'>
                                {bin.usageCount}
                              </TableCell>
                              <TableCell className='text-center'>
                                {bin.userCount}
                              </TableCell>
                              <TableCell className='text-center'>-</TableCell>
                              <TableCell>
                                <div className='flex items-center justify-center gap-2'>
                                  <Progress
                                    value={bin.avgStorageLevelPercent}
                                    className='h-2 w-16'
                                  />
                                  <span className='text-sm'>
                                    {bin.avgStorageLevelPercent.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className='text-center text-sm'>
                                {bin.avgBatteryLevelPercent.toFixed(0)}%
                              </TableCell>
                              <TableCell className='text-center'>
                                {formatDate(bin.lastUsedAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className='py-8 text-center'>
                      <div className='flex flex-col items-center gap-2'>
                        <IconSearch className='text-muted-foreground h-8 w-8' />
                        <p className='text-muted-foreground'>
                          {loading
                            ? 'Ачааллаж байна...'
                            : searchTerm
                              ? 'Хайлтын үр дүн олдсонгүй'
                              : 'Ашиглалтын түүх байхгүй'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          hasPrevious={pagination.hasPrevious}
          hasNext={pagination.hasNext}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
