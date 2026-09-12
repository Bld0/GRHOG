'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconSearch,
  IconTrash,
  IconWifi
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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

/** Хүснэгтэд харуулах нэг сав. */
export interface BinRow {
  id: number;
  binId?: string;
  binName: string;
  location: string;
  fillPercentage: number;
  batteryLevel: number;
  clearedAt: string | null;
  active: boolean;
  storageLevelBeforeClear: number;
  coordinates: { lat: number; lng: number };
  usageCount?: number;
  penetrationsSinceLastClear: number;
  khoroo?: number | null;
  phone?: string | null;
  details?: string | null;
}

/** Шүүлтүүртэй багана бүрийн тодорхойлолт. */
const COLUMNS: Array<{
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  width: string;
}> = [
  { field: 'binName', label: 'Нэр', type: 'text', width: 'w-[150px]' },
  { field: 'isActive', label: 'Холболт', type: 'boolean', width: 'w-[100px]' },
  {
    field: 'storageLevelPercent',
    label: 'Дүүргэлт (%)',
    type: 'number',
    width: 'w-[120px]'
  },
  {
    field: 'penetrationsSinceLastClear',
    label: 'Сүүлийн хоослолтоос',
    type: 'number',
    width: 'w-[100px]'
  },
  {
    field: 'batteryLevelPercent',
    label: 'Батарей',
    type: 'number',
    width: 'w-[120px]'
  },
  {
    field: 'clearedAt',
    label: 'Хоослосон огноо',
    type: 'date',
    width: 'w-[150px]'
  },
  {
    field: 'storageLevelBeforeClearPercent',
    label: 'Хоослох үеийн дүүргэлт',
    type: 'number',
    width: 'w-[150px]'
  },
  { field: 'location', label: 'Байршил', type: 'text', width: 'w-[200px]' }
];

interface BinsTableProps {
  rows: BinRow[];
  hasActiveFilters: boolean;
  activeFilters: ActiveFilter[];
  sortConfig: SortConfig | undefined;
  onSort: (field: string) => void;
  onFilterChange: (filters: ActiveFilter[]) => void;
  onEdit: (row: BinRow) => void;
  onDelete: (row: BinRow) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function BinsTable({
  rows,
  hasActiveFilters,
  activeFilters,
  sortConfig,
  onSort,
  onFilterChange,
  onEdit,
  onDelete,
  canEdit,
  canDelete
}: BinsTableProps) {
  const router = useRouter();
  const openBin = (row: BinRow) => router.push(`/dashboard/bins/${row.id}`);

  return (
    <div className='overflow-x-auto rounded-md border'>
      <ScrollArea className='w-full'>
        <Table className='w-full'>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead
                  key={column.field}
                  className={`relative text-center ${column.width}`}
                >
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
              <TableHead className='w-[80px] text-right'>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className='hover:bg-muted/50 cursor-pointer'
                onClick={() => openBin(row)}
              >
                <TableCell className='font-medium'>
                  <CopyableText value={row.binName} label='Савны нэр' />
                </TableCell>
                <TableCell>
                  <Badge variant={row.active ? 'default' : 'secondary'}>
                    <IconWifi className='mr-1 h-3 w-3' />
                    {row.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </Badge>
                </TableCell>
                <ProgressCell value={row.fillPercentage} />
                <TableCell>
                  <span className='text-sm font-medium'>
                    {row.penetrationsSinceLastClear}
                  </span>
                </TableCell>
                <TableCell>
                  <span className='text-sm font-medium'>
                    {row.batteryLevel.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell>
                  {row.clearedAt
                    ? new Date(row.clearedAt).toLocaleString('mn-MN')
                    : '-'}
                </TableCell>
                <ProgressCell value={row.storageLevelBeforeClear} />
                <TableCell className='max-w-[200px] truncate'>
                  <CopyableText
                    value={row.location}
                    label='Байршил'
                    title={`${row.location} - Хуулахын тулд дарна уу`}
                  />
                </TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openBin(row);
                        }}
                      >
                        <IconEye className='mr-2 h-4 w-4' />
                        Харах
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                        >
                          <IconEdit className='mr-2 h-4 w-4' />
                          Засах
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row);
                          }}
                          className='text-red-600 focus:text-red-600'
                        >
                          <IconTrash className='mr-2 h-4 w-4' />
                          Устгах
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + 1}
                  className='py-8 text-center'
                >
                  <div className='flex flex-col items-center gap-2'>
                    <IconSearch className='text-muted-foreground h-8 w-8' />
                    <p className='text-muted-foreground'>
                      {hasActiveFilters
                        ? 'Хайлтын үр дүн олдсонгүй'
                        : 'Бүртгэлтэй сав байхгүй'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

function ProgressCell({ value }: { value: number }) {
  return (
    <TableCell>
      <div className='flex items-center space-x-2'>
        <Progress value={value} className='h-2 w-16' />
        <span className='text-sm font-medium'>{value.toFixed(2)}%</span>
      </div>
    </TableCell>
  );
}

/** Дарахад агуулгыг санах ойд хуулна. */
function CopyableText({
  value,
  label,
  title
}: {
  value: string;
  label: string;
  title?: string;
}) {
  return (
    <div
      className='hover:bg-muted/30 cursor-pointer truncate rounded px-2 py-1 transition-colors'
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast.success(`${label} хуулагдлаа`);
      }}
      title={title ?? 'Хуулахын тулд дарна уу'}
    >
      {value}
    </div>
  );
}
