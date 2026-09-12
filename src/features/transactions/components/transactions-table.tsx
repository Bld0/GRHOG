'use client';

import Link from 'next/link';
import {
  IconBattery,
  IconClock,
  IconMapPin,
  IconSearch,
  IconTrash,
  IconUser,
  IconWeight
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ActiveFilter,
  SortConfig,
  TableHeaderFilter
} from '@/components/ui/table-header-filter';

/** Хүснэгтэд харуулах нэг ашиглалт. */
export interface TransactionRow {
  id: string;
  date: Date;
  residentId: string;
  clientName: string;
  clientType: string;
  clientPhone: string;
  clientAddress: string;
  binId: string;
  binName: string;
  binLocation: string;
  storageLevel: number;
  batteryLevel: number;
}

const COLUMNS: Array<{
  field: string;
  label: string;
  type: 'text' | 'number' | 'date';
}> = [
  { field: 'createdAt', label: 'Огноо цаг', type: 'date' },
  { field: 'clientAddress', label: 'Хаяг', type: 'text' },
  { field: 'clientType', label: 'Төрөл', type: 'text' },
  { field: 'clientName', label: 'Нэр', type: 'text' },
  { field: 'binName', label: 'Сав', type: 'text' },
  { field: 'storageLevelPercent', label: 'Дүүргэлтийн түвшин', type: 'number' },
  { field: 'batteryLevelPercent', label: 'Батарейны түвшин', type: 'number' }
];

/** Мэдрэгчээс заалт ирээгүйг `-1`-ээр тэмдэглэдэг. */
const NO_READING = -1;

const formatDateTime = (date: Date) =>
  new Date(date).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

interface TransactionsTableProps {
  rows: TransactionRow[];
  activeFilters: ActiveFilter[];
  sortConfig: SortConfig | undefined;
  onSort: (field: string) => void;
  onFilterChange: (filters: ActiveFilter[]) => void;
  onClearFilters: () => void;
}

export function TransactionsTable({
  rows,
  activeFilters,
  sortConfig,
  onSort,
  onFilterChange,
  onClearFilters
}: TransactionsTableProps) {
  return (
    <div className='overflow-x-auto rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column.field} className='relative text-center'>
                <TableHeaderFilter
                  field={column.field}
                  label={column.label}
                  type={column.type}
                  currentSort={sortConfig}
                  activeFilters={activeFilters}
                  onSort={onSort}
                  onFilterChange={onFilterChange}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <IconCell icon={<IconClock className='text-muted-foreground h-4 w-4' />}>
                <span className='font-medium'>{formatDateTime(row.date)}</span>
              </IconCell>
              <IconCell icon={<IconMapPin className='text-muted-foreground h-4 w-4' />}>
                <span className='font-medium'>{row.clientAddress}</span>
              </IconCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-xs'>
                    {row.clientType}
                  </Badge>
                </div>
              </TableCell>
              <IconCell icon={<IconUser className='text-muted-foreground h-4 w-4' />}>
                <span className='font-medium'>{row.clientName}</span>
              </IconCell>
              <IconCell icon={<IconTrash className='text-muted-foreground h-4 w-4' />}>
                <Link
                  href={`/dashboard/bins/${row.binId}`}
                  className='text-primary hover:text-primary/80 cursor-pointer font-medium hover:underline'
                >
                  {row.binName}
                </Link>
              </IconCell>
              <IconCell icon={<IconWeight className='text-muted-foreground h-4 w-4' />}>
                <Badge variant={storageTone(row.storageLevel)}>
                  {row.storageLevel === NO_READING
                    ? 'Data coming soon'
                    : `${row.storageLevel.toFixed(1)}%`}
                </Badge>
              </IconCell>
              <IconCell icon={<IconBattery className='text-muted-foreground h-4 w-4' />}>
                <span className='text-sm'>
                  {row.batteryLevel === NO_READING
                    ? 'Data coming soon'
                    : `${row.batteryLevel.toFixed(1)}%`}
                </span>
              </IconCell>
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMNS.length} className='py-8 text-center'>
                <div className='flex flex-col items-center gap-2'>
                  <IconSearch className='text-muted-foreground h-8 w-8' />
                  <p className='text-muted-foreground'>
                    {activeFilters.length > 0
                      ? 'Хайлтын үр дүн олдсонгүй'
                      : 'Ашиглалтын түүх байхгүй'}
                  </p>
                  {activeFilters.length > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={onClearFilters}
                      className='mt-2'
                    >
                      Шүүлтүүр цэвэрлэх
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function storageTone(level: number): 'secondary' | 'destructive' | 'default' {
  if (level === NO_READING) return 'secondary';
  if (level >= 85) return 'destructive';
  if (level >= 50) return 'default';
  return 'secondary';
}

/** Дүрс + агуулга — нүд бүрд давтагддаг хос. */
function IconCell({
  icon,
  children
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TableCell>
      <div className='flex items-center gap-2'>
        {icon}
        {children}
      </div>
    </TableCell>
  );
}
