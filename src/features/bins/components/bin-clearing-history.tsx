'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
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
import { BinClearing } from '@/types';

/**
 * Ачилтын мэдээллийн төлөв.
 *
 * Чип уншуулах нь "ачилт хийлээ" гэсэн мэдүүлэг тул савны дүүрэлтийн заалттай
 * харьцуулж баталгаажуулна — зөрүүтэй мэдээлэл эндээс шууд харагдана.
 */
function ClearingStatusBadge({ clearing }: { clearing: BinClearing }) {
  // Мэдрэгчээр илэрсэн ачилтыг мэдрэгч өөрөө нотолж байгаа тул нэмэлт төлөвгүй.
  // Хуучин мөрүүд (төлөвгүй) мөн адил.
  const status = clearing.verificationStatus ?? 'CONFIRMED';

  const styles: Record<string, string> = {
    CONFIRMED:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    NOT_CONFIRMED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    ALREADY_EMPTY:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    NO_TELEMETRY:
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  };

  const labels: Record<string, string> = {
    CONFIRMED: 'Баталгаажсан',
    PENDING: 'Шалгаж байна',
    NOT_CONFIRMED: 'Зөрүүтэй',
    ALREADY_EMPTY: 'Хоосон сав байсан',
    NO_TELEMETRY: 'Мэдээлэлгүй'
  };

  return (
    <Badge
      variant='outline'
      className={`border-transparent ${styles[status]}`}
      title={clearing.verificationNote || undefined}
    >
      {labels[status]}
    </Badge>
  );
}


const FULL_DATE = new Intl.DateTimeFormat('mn-MN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

/** Савны хоослох түүх — огнооны шүүлт, хуудаслалт, ачилтын төлөв. */
export function BinClearingHistory({ clearings }: { clearings: any[] }) {
  const [dateFilter, setDateFilter] = useState<'7' | '30' | 'all'>('30');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const formatDate = (date: Date) => FULL_DATE.format(date);

  // Шүүлт нэг л удаа бодогдоно — өмнө нь `getFilteredClearings()` нэг рендерт
  // гурван удаа (нийт тоо, хуудасны тоо, хуудасны мөр) дуудагдаж бүх
  // жагсаалтыг дахин шүүж, дахин эрэмбэлдэг байв.
  const filtered = useMemo(() => {
    let rows = clearings;
    if (startDate && endDate) {
      rows = rows.filter((clearing) => {
        const at = new Date(clearing.clearedAt);
        return at >= startDate && at <= endDate;
      });
    } else if (dateFilter !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(dateFilter));
      rows = rows.filter((clearing) => new Date(clearing.clearedAt) >= cutoff);
    }
    return [...rows].sort(
      (a, b) =>
        new Date(b.clearedAt).getTime() - new Date(a.clearedAt).getTime()
    );
  }, [clearings, startDate, endDate, dateFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageRows = filtered.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Хоослох түүх</CardTitle>
          <div className='flex items-center gap-4'>
            {/* Date Range Picker */}
            <div className='flex items-center gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-[200px] justify-start text-left font-normal'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {startDate ? (
                      endDate ? (
                        <>
                          {format(startDate, 'LLL dd, y', { locale: mn })} -{' '}
                          {format(endDate, 'LLL dd, y', { locale: mn })}
                        </>
                      ) : (
                        format(startDate, 'LLL dd, y', { locale: mn })
                      )
                    ) : (
                      <span>Огноо сонгох</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    initialFocus
                    mode='range'
                    defaultMonth={startDate}
                    selected={{
                      from: startDate,
                      to: endDate
                    }}
                    onSelect={(range) => {
                      setStartDate(range?.from);
                      setEndDate(range?.to);
                      setCurrentPage(0);
                    }}
                    numberOfMonths={2}
                    locale={mn}
                  />
                </PopoverContent>
              </Popover>
              {(startDate || endDate) && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setCurrentPage(0);
                  }}
                >
                  Цэвэрлэх
                </Button>
              )}
            </div>

            {/* Rows Per Page Selection */}
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
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='20'>20</SelectItem>
                  <SelectItem value='25'>25</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter Buttons */}
            <div className='flex items-center gap-2'>
              <Button
                variant={dateFilter === '7' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setDateFilter('7');
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setCurrentPage(0);
                }}
              >
                7 хоног
              </Button>
              <Button
                variant={dateFilter === '30' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setDateFilter('30');
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setCurrentPage(0);
                }}
              >
                30 хоног
              </Button>
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setDateFilter('all');
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setCurrentPage(0);
                }}
              >
                Бүгд
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <div className='w-full min-w-[560px]'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Хоослосон огноо</TableHead>
                  <TableHead>Ачилт хийсэн</TableHead>
                  <TableHead>Нэвтрэлтийн тоо</TableHead>
                  <TableHead>Дүүргэлт (өмнө → дараа)</TableHead>
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
                      Сонгосон хугацаанд хоослох түүх байхгүй
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((clearing, index) => (
                    <TableRow key={clearing.id || index}>
                      <TableCell>
                        {formatDate(new Date(clearing.clearedAt))}
                      </TableCell>
                      <TableCell>
                        {clearing.source === 'CARD' ? (
                          <div>
                            <div className='text-sm font-medium'>
                              {clearing.clearedByName || 'Жолооч'}
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
                      <TableCell>
                        <span className='text-sm font-medium'>
                          {clearing.penetrationCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <div className='h-2 w-16 rounded-full bg-gray-200'>
                            <div
                              className='h-2 rounded-full bg-green-600'
                              style={{
                                width: `${clearing.fillLevelBeforeClearPercent || 0}%`
                              }}
                            />
                          </div>
                          <span className='text-sm font-medium'>
                            {(
                              clearing.fillLevelBeforeClearPercent || 0
                            ).toFixed(2)}
                            %
                          </span>
                          {/* Ачилтын дараах заалт ирсэн бол харьцуулж харуулна */}
                          {clearing.fillLevelAfterClear !== undefined &&
                            clearing.fillLevelAfterClear >= 0 && (
                              <span className='text-muted-foreground text-sm'>
                                → {clearing.fillLevelAfterClear.toFixed(2)}%
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ClearingStatusBadge clearing={clearing} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
