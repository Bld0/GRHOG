'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconAlertTriangle, IconDownload } from '@tabler/icons-react';

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
import { ActiveFilters } from '@/components/ui/active-filters';
import { useTableFilters } from '@/components/ui/table-header-filter';
import { TablePagination } from '@/components/ui/table-pagination';
import PageContainer from '@/components/layout/page-container';
import { useBinUsages } from '@/hooks/use-api-data';
import { PaginationParams } from '@/hooks/use-pagination';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { buildFilterSearch } from '@/lib/table-filter-query';
import { downloadXlsx } from '@/lib/export-xlsx';

import { TransactionsStats } from './transactions-stats';
import { TransactionRow, TransactionsTable } from './transactions-table';

/**
 * Ашиглалтын түүхийн хуудас — зохицуулалт л хийнэ.
 *
 * Нэгдсэн үзүүлэлт ба хүснэгт тус тусдаа component. Өмнө нь энэ бүхэн 649
 * мөрийн нэг функц дотор байв.
 */
export function TransactionsView() {
  const { isKhorooLeader } = useRolePermissions();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const {
    activeFilters,
    sortConfig,
    removeFilter,
    clearAllFilters,
    handleSort,
    setActiveFilters
  } = useTableFilters();

  const paginationParams: PaginationParams = useMemo(() => {
    const search = buildFilterSearch(activeFilters);
    return {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'createdAt',
      sortDirection: sortConfig?.direction || 'desc',
      ...(search ? { search } : {})
    } as PaginationParams;
  }, [currentPage, itemsPerPage, activeFilters, sortConfig]);

  const { data: apiBinUsages, loading, error, pagination, refetch } =
    useBinUsages(true, paginationParams);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

  const rows: TransactionRow[] = useMemo(() => {
    if (!Array.isArray(apiBinUsages)) return [];
    return apiBinUsages.map((usage) => ({
      id: `TXN-${String(usage.id).padStart(4, '0')}`,
      date: new Date(usage.createdAt),
      residentId: usage.cardIdDec || '-',
      clientName: usage.clientName || '-',
      clientType: usage.clientType || '-',
      clientPhone: usage.clientPhone || '-',
      clientAddress: usage.clientAddress || '-',
      binId: usage.bin?.id?.toString() || '-',
      binName: usage.bin?.binName || '-',
      binLocation: usage.bin?.location || '-',
      storageLevel: usage.storageLevelPercent ?? 0,
      batteryLevel: usage.batteryLevelPercent ?? 0
    }));
  }, [apiBinUsages]);

  const exportToExcel = () => {
    const params = new URLSearchParams();
    const search = buildFilterSearch(activeFilters);
    if (search) params.append('search', search);
    if (sortConfig?.field) params.append('sortBy', sortConfig.field);
    if (sortConfig?.direction) {
      params.append('sortDirection', sortConfig.direction);
    }
    return downloadXlsx('/api/export/transactions', params, 'transactions_export');
  };

  if (loading && !apiBinUsages) return <TransactionsSkeleton />;

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
            <Button onClick={refetch} className='mt-4'>
              Дахин оролдох
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>Ашиглалтын түүх</h1>
          {/* Экспорт нь бүсээр шүүгддэггүй тул backend дээр /export/** нь
              хорооны даргад 403 буцаана — 403 өгөх товч үзүүлэхгүй. */}
          {!isKhorooLeader && (
            <Button onClick={exportToExcel} variant='outline' size='sm'>
              <IconDownload className='mr-2 h-4 w-4' />
              Excel татах
            </Button>
          )}
        </div>

        <TransactionsStats />

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Ашиглалтын түүх</CardTitle>
                <CardDescription>
                  {pagination.totalElements} ашиглалт олдлоо •{' '}
                  {pagination.statistics?.uniqueClientCount || 0} хэрэглэгч •{' '}
                  {pagination.statistics?.uniqueBinCount || 0} сав • Хуудас{' '}
                  {currentPage + 1}/{pagination.totalPages}
                </CardDescription>
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
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ActiveFilters
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
            />

            <TransactionsTable
              rows={rows}
              activeFilters={activeFilters}
              sortConfig={sortConfig}
              onSort={handleSort}
              onFilterChange={setActiveFilters}
              onClearFilters={() => {
                setCurrentPage(0);
                clearAllFilters();
              }}
            />

            <TablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              hasPrevious={pagination.hasPrevious}
              hasNext={pagination.hasNext}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function TransactionsSkeleton() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>Ашиглалтын түүх</h1>
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
