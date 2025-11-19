'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ResponsiveTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import PageContainer from '@/components/layout/page-container';
import { useGroupedBins } from '@/hooks/use-api-data';
import { PaginationParams } from '@/hooks/use-pagination';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { toast } from 'sonner';
import {
  IconBattery,
  IconWifi,
  IconSearch,
  IconDownload,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import {
  TableHeaderFilter,
  useTableFilters
} from '@/components/ui/table-header-filter';
import { ActiveFilters } from '@/components/ui/active-filters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { authUtils } from '@/lib/auth';
import { cn } from '@/lib/utils';

export function BinsViewGrouped() {
  const router = useRouter();
  useRolePermissions(); // Keep this for potential future use
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Enhanced filter system state
  const {
    activeFilters,
    sortConfig,
    removeFilter,
    clearAllFilters,
    handleSort,
    setActiveFilters
  } = useTableFilters();

  // Create pagination and filter params for the API
  const paginationParams: PaginationParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'district',
      sortDirection: sortConfig?.direction || 'asc'
    };

    // Build search query from advanced filters
    const searchParts: string[] = [];

    activeFilters.forEach((filter) => {
      let searchPart = '';

      switch (filter.operator) {
        case 'is':
          searchPart = `${filter.field}: {"is": "${filter.value}"}`;
          break;
        case 'is_not':
          searchPart = `${filter.field}: {"is_not": "${filter.value}"}`;
          break;
        case 'contains':
          searchPart = `${filter.field}: {"contains": "${filter.value}"}`;
          break;
        case 'greater_than':
          searchPart = `${filter.field}: {"greater_than": "${filter.value}"}`;
          break;
        case 'less_than':
          searchPart = `${filter.field}: {"less_than": "${filter.value}"}`;
          break;
        case 'between':
          if (
            filter.value &&
            typeof filter.value === 'object' &&
            'min' in filter.value &&
            'max' in filter.value
          ) {
            searchPart = `${filter.field}: {"between": {"min": "${filter.value.min}", "max": "${filter.value.max}"}}`;
          }
          break;
      }

      if (searchPart) {
        searchParts.push(searchPart);
      }
    });

    if (searchParts.length > 0) {
      const filterSearch = searchParts.join('; ');
      if (params.search) {
        params.search = `${params.search} ${filterSearch}`;
      } else {
        params.search = filterSearch;
      }
    }
    return params;
  }, [currentPage, itemsPerPage, activeFilters, sortConfig]);

  // Fetch grouped bins data
  const {
    data: groupedBins,
    loading,
    error,
    pagination
  } = useGroupedBins(true, paginationParams);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 0; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        pages.push(0);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(0);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleGroup = (khoroo: number, location: string) => {
    const key = `${khoroo}-${location}`;
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isGroupExpanded = (khoroo: number, location: string) => {
    const key = `${khoroo}-${location}`;
    return expandedGroups.has(key);
  };

  const exportToExcel = async () => {
    try {
      const queryParams = new URLSearchParams();

      if (activeFilters.length > 0) {
        const searchParts: string[] = [];

        activeFilters.forEach((filter) => {
          let searchPart = '';

          switch (filter.operator) {
            case 'is':
              searchPart = `${filter.field}: {"is": "${filter.value}"}`;
              break;
            case 'is_not':
              searchPart = `${filter.field}: {"is_not": "${filter.value}"}`;
              break;
            case 'contains':
              searchPart = `${filter.field}: {"contains": "${filter.value}"}`;
              break;
            case 'greater_than':
              searchPart = `${filter.field}: {"greater_than": "${filter.value}"}`;
              break;
            case 'less_than':
              searchPart = `${filter.field}: {"less_than": "${filter.value}"}`;
              break;
            case 'between':
              if (
                filter.value &&
                typeof filter.value === 'object' &&
                'min' in filter.value &&
                'max' in filter.value
              ) {
                searchPart = `${filter.field}: {"between": {"min": "${filter.value.min}", "max": "${filter.value.max}"}}`;
              }
              break;
          }

          if (searchPart) {
            searchParts.push(searchPart);
          }
        });

        if (searchParts.length > 0) {
          queryParams.append('search', searchParts.join('; '));
        }
      }

      if (sortConfig?.field) {
        queryParams.append('sortBy', sortConfig.field);
      }
      if (sortConfig?.direction) {
        queryParams.append('sortDirection', sortConfig.direction);
      }

      const url = `/api/export/bins?${queryParams.toString()}`;
      const authHeaders = authUtils.getAuthHeader();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...authHeaders,
          Accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `bins_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Excel файл татаж эхэллээ');
    } catch (error) {
      toast.error(
        'Экспорт хийхэд алдаа гарлаа: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  // Show loading state
  const isInitialLoad = loading && !groupedBins;
  if (isInitialLoad) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Хогийн савны жагсаалт
              </h1>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className='pb-3'>
                  <div className='bg-muted h-4 w-24 animate-pulse rounded' />
                </CardHeader>
                <CardContent>
                  <div className='bg-muted mb-2 h-8 w-16 animate-pulse rounded' />
                  <div className='bg-muted h-3 w-32 animate-pulse rounded' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col items-center justify-center space-y-4'>
          <IconAlertTriangle className='text-muted-foreground h-12 w-12' />
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>Алдаа гарлаа</h2>
            <p className='text-muted-foreground'>
              Мэдээлэл ачааллахад алдаа гарлаа: {error}
            </p>
            <Button onClick={() => window.location.reload()} className='mt-4'>
              Дахин оролдох
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const totalActiveBins = pagination.statistics?.totalActiveBins || 0;
  const overallAvgStorage =
    pagination.statistics?.overallAvgStorageLevelPercent || 0;
  const overallAvgBattery =
    pagination.statistics?.overallAvgBatteryLevelPercent || 0;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Хогийн савны жагсаалт
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <Button onClick={exportToExcel} variant='outline' size='sm'>
              <IconDownload className='mr-2 h-4 w-4' />
              Excel татах
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>Бүлэг</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {pagination.totalElements}
              </div>
              <p className='text-muted-foreground text-xs'>Дүүрэг & Хороо</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>
                Идэвхтэй сав
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalActiveBins}</div>
              <p className='text-muted-foreground text-xs'>Нийт идэвхтэй</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>
                Дундаж дүүргэлт
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {overallAvgStorage.toFixed(2)}%
              </div>
              <p className='text-muted-foreground text-xs'>Бүх савны дундаж</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>
                Дундаж батарей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {overallAvgBattery.toFixed(2)}%
              </div>
              <p className='text-muted-foreground text-xs'>Бүх савны дундаж</p>
            </CardContent>
          </Card>
        </div>

        {/* Bins Table */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>
                  Дүүрэг & Хороогоор ангилсан савны жагсаалт
                </CardTitle>
                <CardDescription>
                  {pagination.totalElements} бүлэг • {totalActiveBins} идэвхтэй
                  сав • Хуудас {currentPage + 1}/{pagination.totalPages}
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
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
                    <SelectItem value='5'>5</SelectItem>
                    <SelectItem value='10'>10</SelectItem>
                    <SelectItem value='20'>20</SelectItem>
                    <SelectItem value='50'>50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Active Filter Chips */}
            <ActiveFilters
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
            />

            <div className='overflow-x-auto rounded-md border'>
              <ScrollArea className='w-full'>
                <Table className='w-full'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[50px]'></TableHead>
                      <TableHead className='w-[150px] text-center'>
                        <TableHeaderFilter
                          field='district'
                          label='Хороо / Байршил'
                          type='text'
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className='w-[120px] text-center'>
                        <TableHeaderFilter
                          field='activeBinsCount'
                          label='Төлөв'
                          type='number'
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className='w-[180px] text-center'>
                        <TableHeaderFilter
                          field='avgStorageLevelPercent'
                          label='Дүүргэлт / Хэрэглээч'
                          type='number'
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className='w-[120px] text-center'>
                        <TableHeaderFilter
                          field='avgBatteryLevelPercent'
                          label='Батарей'
                          type='number'
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className='w-[150px] text-center'>
                        <TableHeaderFilter
                          field='lastEmptied'
                          label='Ачилт хийсэн огноо'
                          type='date'
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedBins && groupedBins.length > 0 ? (
                      groupedBins.map((group) => {
                        const isExpanded = isGroupExpanded(
                          group.khoroo,
                          group.location || ''
                        );
                        const groupKey = `${group.district}-${group.khoroo}`;
                        return (
                          <React.Fragment key={groupKey}>
                            {/* Group Row */}
                            <TableRow
                              className='hover:bg-muted/50 cursor-pointer font-medium'
                              onClick={() =>
                                toggleGroup(group.khoroo, group.location || '')
                              }
                            >
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
                              group.bins.map((bin) => (
                                <TableRow
                                  key={bin.id}
                                  className='bg-muted/20 hover:bg-muted/30 cursor-pointer'
                                  onClick={() =>
                                    router.push(`/dashboard/bins/${bin.id}`)
                                  }
                                >
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
                        <TableCell colSpan={6} className='py-8 text-center'>
                          <div className='flex flex-col items-center gap-2'>
                            <IconSearch className='text-muted-foreground h-8 w-8' />
                            <p className='text-muted-foreground'>
                              {activeFilters.length > 0
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex items-center justify-center space-x-2 py-4'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasPrevious)
                            setCurrentPage(currentPage - 1);
                        }}
                        className={
                          !pagination.hasPrevious
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href='#'
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page as number);
                            }}
                            isActive={currentPage === page}
                          >
                            {(page as number) + 1}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasNext)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          !pagination.hasNext
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
