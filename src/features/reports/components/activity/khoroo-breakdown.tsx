'use client';

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
import type { ActivityTab, KhorooActivityRow } from '../../types';

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
interface KhorooBreakdownProps {
  byKhoroo: KhorooActivityRow[];
  loading: boolean;
  tab: ActivityTab;
  selectedKhoroo: number | null;
  onSelect: (target: ActivityTab, khoroo: number | null) => void;
}

/** Хороо бүрийн идэвхтэй/идэвхгүйн задаргаа — тоо дээр дарж шүүнэ. */
export function KhorooBreakdown({
  byKhoroo,
  loading,
  tab,
  selectedKhoroo,
  onSelect
}: KhorooBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хороогоор</CardTitle>
        <CardDescription>
          Идэвхтэй/идэвхгүйн тоо дээр дарж тухайн хорооны хэрэглэгчдийг доор
          харна
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className='h-12 w-full' />
            ))}
          </div>
        ) : !byKhoroo.length ? (
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
                {byKhoroo.map((row) => (
                  <TableRow
                    key={`${row.district}-${row.khoroo}`}
                    className={
                      selectedKhoroo === row.khoroo ? 'bg-muted/60' : undefined
                    }
                  >
                    <TableCell>{row.district || '—'}</TableCell>
                    <TableCell>
                      {row.khoroo != null ? `${row.khoroo}-р хороо` : '—'}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {row.total}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 px-2 font-semibold text-green-600 tabular-nums hover:text-green-700 dark:text-green-400'
                        onClick={() => onSelect('active', row.khoroo)}
                      >
                        {row.active}
                      </Button>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 px-2 font-semibold text-red-600 tabular-nums hover:text-red-700 dark:text-red-400'
                        onClick={() => onSelect('inactive', row.khoroo)}
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
  );
}
