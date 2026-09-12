'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  IconCalendar,
  IconCreditCard,
  IconEdit,
  IconSearch,
  IconUser
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { EditableCard } from './card-edit-dialog';

/** Хүснэгтэд харуулах нэг мөр. */
export interface CardRow extends EditableCard {
  cardIdDec: string | null;
  totalAccess: number;
  cardUsedAt: Date | null;
  createdAt: Date;
}

/** Шүүлтүүртэй багана бүрийн тодорхойлолт — JSX-д 12 мөр давтахын оронд. */
const COLUMNS: Array<{
  field: string;
  label: string;
  type: 'text' | 'number' | 'date';
}> = [
  { field: 'district', label: 'Дүүрэг', type: 'text' },
  { field: 'khoroo', label: 'Хороо', type: 'number' },
  { field: 'streetBuilding', label: 'Байр/гудамж', type: 'text' },
  { field: 'apartmentNumber', label: 'Тоот', type: 'text' },
  { field: 'type', label: 'Төрөл', type: 'text' },
  { field: 'name', label: 'Нэр', type: 'text' },
  { field: 'cardIdDec', label: 'Карт ID', type: 'text' },
  { field: 'totalAccess', label: 'Нэвтрэлт', type: 'number' },
  { field: 'cardUsedAt', label: 'Сүүлийн нэвтрэлт', type: 'date' },
  { field: 'createdAt', label: 'Бүртгэгдсэн огноо', type: 'date' },
  { field: 'phone', label: 'Утасны дугаар', type: 'text' }
];

const HEAD_CLASS =
  'relative text-center sticky top-0 z-10 bg-background';

interface CardTableProps {
  rows: CardRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (row: CardRow) => void;
  canEdit: boolean;
  hasActiveFilters: boolean;
  activeFilters: ActiveFilter[];
  sortConfig: SortConfig | undefined;
  onSort: (field: string) => void;
  onFilterChange: (filters: ActiveFilter[]) => void;
}

export function CardTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onEdit,
  canEdit,
  hasActiveFilters,
  activeFilters,
  sortConfig,
  onSort,
  onFilterChange
}: CardTableProps) {
  const router = useRouter();
  const openCard = (row: CardRow) =>
    router.push(`/dashboard/card/${row.cardId}`);

  return (
    <div className='flex-1 overflow-auto rounded-md border relative'>
      <Table className='w-full'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[50px] text-center sticky top-0 z-10 bg-background'>
              <Checkbox
                checked={rows.length > 0 && selectedIds.size === rows.length}
                onCheckedChange={onToggleAll}
                aria-label='Select all'
              />
            </TableHead>
            {COLUMNS.map((column) => (
              <TableHead key={column.field} className={HEAD_CLASS}>
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
            <TableHead className='text-center sticky top-0 z-10 bg-background'>
              Үйлдэл
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className='hover:bg-muted/50 cursor-pointer'
              onClick={() => openCard(row)}
            >
              <TableCell className='text-center'>
                <Checkbox
                  checked={selectedIds.has(String(row.id))}
                  onCheckedChange={() => onToggleRow(String(row.id))}
                  onClick={(e) => e.stopPropagation()}
                  aria-label='Select row'
                />
              </TableCell>
              <PlainCell value={row.district} bold />
              <PlainCell value={row.khoroo} />
              <PlainCell value={row.streetBuilding} />
              <PlainCell value={row.apartmentNumber} />
              <TableCell>
                <div className='flex items-center gap-2 text-center'>
                  <Badge variant='outline' className='text-xs'>
                    {row.type || '-'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <CopyableCell value={row.name} toastLabel='Нэр' />
              </TableCell>
              <TableCell>
                <div className='flex flex-col gap-1 text-center'>
                  <div className='flex items-center gap-2'>
                    <IconCreditCard className='text-muted-foreground h-4 w-4' />
                    <span
                      className='bg-muted hover:bg-muted/70 cursor-pointer rounded px-2 py-1 font-mono text-sm transition-colors'
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(row.cardIdDec ?? '');
                        toast.success('Карт ID хуулагдлаа');
                      }}
                      title='Хуулахын тулд дарна уу'
                    >
                      {row.cardIdDec}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className='text-center font-medium'>{row.totalAccess}</div>
              </TableCell>
              <DateCell value={row.cardUsedAt} />
              <DateCell value={row.createdAt} />
              <TableCell>
                <CopyableCell value={row.phone} toastLabel='Утасны дугаар' />
              </TableCell>
              <TableCell className='text-center'>
                <div className='flex items-center justify-end gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      openCard(row);
                    }}
                  >
                    <IconUser className='h-4 w-4' />
                  </Button>
                  {canEdit && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row);
                      }}
                    >
                      <IconEdit className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 2} className='py-8 text-center'>
                <div className='flex flex-col items-center gap-2'>
                  <IconSearch className='text-muted-foreground h-8 w-8' />
                  <p className='text-muted-foreground'>
                    {hasActiveFilters
                      ? 'Хайлтын үр дүн олдсонгүй'
                      : 'Бүртгэлтэй карт байхгүй'}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PlainCell({
  value,
  bold = false
}: {
  value: string | number | null | undefined;
  bold?: boolean;
}) {
  return (
    <TableCell>
      <div className={`text-center text-sm${bold ? ' font-medium' : ''}`}>
        {value || '-'}
      </div>
    </TableCell>
  );
}

function DateCell({ value }: { value: Date | null }) {
  return (
    <TableCell>
      <div className='flex items-center gap-2 text-center'>
        <IconCalendar className='text-muted-foreground h-4 w-4' />
        <span className='text-sm'>
          {value ? value.toLocaleString('mn-MN') : '-'}
        </span>
      </div>
    </TableCell>
  );
}

/** Дарахад агуулгыг санах ойд хуулна. */
function CopyableCell({
  value,
  toastLabel
}: {
  value: string | undefined;
  toastLabel: string;
}) {
  return (
    <div
      className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-center font-medium transition-colors'
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value ?? '');
        toast.success(`${toastLabel} хуулагдлаа`);
      }}
      title='Хуулахын тулд дарна уу'
    >
      {value}
    </div>
  );
}
