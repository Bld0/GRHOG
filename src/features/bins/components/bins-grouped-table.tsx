'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  IconBattery,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconWifi
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
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

interface BinsGroupedTableProps {
  groups: any[] | null;
  selectedBins: Set<number>;
  expandedGroups: Set<string>;
  onToggleGroup: (khoroo: number, location: string) => void;
  onToggleSelectBin: (binId: number) => void;
  onToggleSelectGroup: (groupBins: any[]) => void;
  activeFilters: ActiveFilter[];
  sortConfig: SortConfig | undefined;
  onSort: (field: string) => void;
  onFilterChange: (filters: ActiveFilter[]) => void;
  /** Хайлт идэвхтэй эсэх — хоосон үеийн мессежийг сонгоно. */
  hasSearch: boolean;
}

/** Дүүрэг/хороогоор бүлэглэсэн савны хүснэгт — бүлэг дарахад дэлгэгдэнэ. */
export function BinsGroupedTable({
  groups,
  selectedBins,
  expandedGroups,
  onToggleGroup,
  onToggleSelectBin,
  onToggleSelectGroup,
  activeFilters,
  sortConfig,
  onSort,
  onFilterChange,
  hasSearch
}: BinsGroupedTableProps) {
  const router = useRouter();

  const isGroupExpanded = (khoroo: number, location: string) =>
    expandedGroups.has(`${khoroo}-${location}`);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('mn-MN');
  };

  return (
    <div className='overflow-x-auto rounded-md border'>
      <ScrollArea className='w-full'>
        <Table className='w-full'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px]'></TableHead>
              <TableHead className='w-[50px]'></TableHead>
              <TableHead className='w-[150px] text-center'>
                <TableHeaderFilter
                  field='district'
                  label='Хороо / Байршил'
                  type='text'
                  currentSort={sortConfig}
                  activeFilters={activeFilters}
                  onSort={onSort}
                  onFilterChange={onFilterChange}
                />
              </TableHead>
              <TableHead className='w-[120px] text-center'>
                <TableHeaderFilter
                  field='activeBinsCount'
                  label='Төлөв'
                  type='number'
                  currentSort={sortConfig}
                  activeFilters={activeFilters}
                  onSort={onSort}
                  onFilterChange={onFilterChange}
                />
              </TableHead>
              <TableHead className='w-[180px] text-center'>
                <TableHeaderFilter
                  field='avgStorageLevelPercent'
                  label='Дүүргэлт / Хэрэглээч'
                  type='number'
                  currentSort={sortConfig}
                  activeFilters={activeFilters}
                  onSort={onSort}
                  onFilterChange={onFilterChange}
                />
              </TableHead>
              <TableHead className='w-[120px] text-center'>
                <TableHeaderFilter
                  field='avgBatteryLevelPercent'
                  label='Батарей'
                  type='number'
                  currentSort={sortConfig}
                  activeFilters={activeFilters}
                  onSort={onSort}
                  onFilterChange={onFilterChange}
                />
              </TableHead>
              <TableHead className='w-[150px] text-center'>
                <TableHeaderFilter
                  field='lastEmptied'
                  label='Ачилт хийсэн огноо'
                  type='date'
                  currentSort={sortConfig}
                  activeFilters={activeFilters}
                  onSort={onSort}
                  onFilterChange={onFilterChange}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups && groups.length > 0 ? (
              groups.map((group) => {
                const isExpanded = isGroupExpanded(
                  group.khoroo,
                  group.location || ''
                );
                const groupKey = `${group.district}-${group.khoroo}-${group.location || ''}`;
                return (
                  <React.Fragment key={groupKey}>
                    {/* Group Row */}
                    <TableRow
                      className='hover:bg-muted/50 cursor-pointer font-medium'
                      onClick={() =>
                        onToggleGroup(group.khoroo, group.location || '')
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={group.bins.every((b: any) =>
                            selectedBins.has(b.id)
                          )}
                          onCheckedChange={() =>
                            onToggleSelectGroup(group.bins)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <IconChevronUp className='h-4 w-4' />
                        ) : (
                          <IconChevronDown className='h-4 w-4' />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-semibold'>
                            {group.khoroo} Хороо , {group.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center justify-center gap-2'>
                          <span className='font-semibold text-green-600'>
                            {group.activeBinsCount}
                          </span>
                          <span className='text-gray-400'>/</span>
                          <span className='text-gray-600'>
                            {group.bins.length - group.activeBinsCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center justify-center gap-2'>
                          <div className='flex items-center gap-2'>
                            <Progress
                              value={group.avgStorageLevelPercent}
                              className='h-2 w-16'
                            />
                            <span className='text-sm font-medium'>
                              {group.avgStorageLevelPercent.toFixed(0)}%
                            </span>
                          </div>
                          <span className='text-gray-400'>/</span>
                          <span className='text-sm font-medium'>
                            {group.totalPenetrationsSinceLastClear}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center justify-center gap-2'>
                          <Badge
                            variant={
                              group.avgBatteryLevelPercent > 50
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            <IconBattery className='mr-1 h-3 w-3' />
                            {group.avgBatteryLevelPercent.toFixed(0)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className='text-center'>
                        {formatDate(group.lastEmptied)}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Bins Rows */}
                    {isExpanded &&
                      group.bins.map((bin: any) => (
                        <TableRow
                          key={bin.id}
                          className='bg-muted/20 hover:bg-muted/30 cursor-pointer'
                          onClick={() =>
                            router.push(`/dashboard/bins/${bin.id}`)
                          }
                        >
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedBins.has(bin.id)}
                              onCheckedChange={() =>
                                onToggleSelectBin(bin.id)
                              }
                            />
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className='pl-8'>
                            <div
                              className='hover:bg-muted/30 inline-block cursor-pointer rounded px-2 py-1 transition-colors'
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  bin.binName || ''
                                );
                                toast.success('Савны нэр хуулагдлаа');
                              }}
                            >
                              {bin.binName}
                            </div>
                            <Badge
                              variant='outline'
                              className={cn(
                                'ml-2',
                                bin.isActive || bin.active
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-600'
                              )}
                            >
                              <IconWifi className='mr-1 h-3 w-3' />
                              {bin.isActive || bin.active
                                ? 'Идэвхтэй'
                                : 'Идэвхгүй'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-center'>
                            -
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center justify-center space-x-2'>
                              <Progress
                                value={bin.storageLevelPercent || 0}
                                className='h-2 w-16'
                              />
                              <span className='text-sm font-medium'>
                                {(bin.storageLevelPercent || 0).toFixed(
                                  0
                                )}
                                %
                              </span>
                              <span className='text-gray-400'>/</span>
                              <span className='text-sm'>
                                {bin.penetrationsSinceLastClear || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center justify-center'>
                              <span className='text-sm font-medium'>
                                {(bin.batteryLevelPercent || 0).toFixed(
                                  0
                                )}
                                %
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-center'>
                            {formatDate(bin.lastEmptied)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className='py-8 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <IconSearch className='text-muted-foreground h-8 w-8' />
                    <p className='text-muted-foreground'>
                      {activeFilters.length > 0 || hasSearch
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
