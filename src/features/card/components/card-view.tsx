'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconAlertTriangle, IconDownload, IconTrash } from '@tabler/icons-react';

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
import { useClients } from '@/hooks/use-api-data';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { PaginationParams } from '@/hooks/use-pagination';
import { buildFilterSearch } from '@/lib/table-filter-query';
import { downloadXlsx } from '@/lib/export-xlsx';

import { CardCreateDialog } from './card-create-dialog';
import { CardDeleteDialog } from './card-delete-dialog';
import { CardEditDialog } from './card-edit-dialog';
import { CardStatsCards } from './card-stats-cards';
import { CardRow, CardTable } from './card-table';

/**
 * Картын жагсаалтын хуудас — зохицуулалт л хийнэ.
 *
 * Цонх бүр (нэмэх / засах / устгах) өөрийн төлөв, илгээлтээ эзэмшинэ; хүснэгт,
 * хуудаслалт, нэгдсэн үзүүлэлт тус тусдаа component. Өмнө нь энэ бүхэн 1905
 * мөрийн нэг функц дотор байв.
 */
export function CardsView() {
  const { canPerformAction, isKhorooLeader } = useRolePermissions();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCard, setEditingCard] = useState<CardRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const {
    data: apiClients,
    loading,
    error,
    pagination,
    refetch
  } = useClients(true, paginationParams);

  // Шүүлтүүр эсвэл эрэмбэ солигдвол эхний хуудас руу.
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

  const rows: CardRow[] = useMemo(
    () =>
      apiClients.map((client) => ({
        id: `${String(client.id).padStart(3, '0')}`,
        name: client.name || `Хэрэглэгч ${client.id}`,
        cardId: client.cardId,
        cardIdDec: client.cardIdDec,
        cardIdConverted: client.cardIdConverted || false,
        email: client.email || '',
        phone: client.phone || '-',
        address: client.address || '',
        district: client.district || '',
        khoroo: client.khoroo ?? null,
        streetBuilding: client.streetBuilding || '',
        apartmentNumber: client.apartmentNumber ?? null,
        type: client.type || '',
        totalAccess: client.totalAccess || 0,
        cardUsedAt: client.cardUsedAt ? new Date(client.cardUsedAt) : null,
        createdAt: new Date(client.createdAt)
      })),
    [apiClients]
  );

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.size === rows.length
        ? new Set()
        : new Set(rows.map((row) => String(row.id)))
    );

  const exportToExcel = () => {
    const params = new URLSearchParams();
    const search = buildFilterSearch(activeFilters);
    if (search) params.append('search', search);
    if (sortConfig?.field) params.append('sortBy', sortConfig.field);
    if (sortConfig?.direction) {
      params.append('sortDirection', sortConfig.direction);
    }
    return downloadXlsx('/api/export/cards', params, 'cards_export');
  };

  if (loading && !apiClients) {
    return <CardsViewSkeleton />;
  }

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
      <div className='flex flex-1 flex-col space-y-5 h-full'>
        <div className='flex items-center justify-between pr-6'>
          <h1 className='text-3xl font-bold tracking-tight'>Картын жагсаалт</h1>
          <div className='flex items-center gap-2'>
            {selectedIds.size > 0 && canPerformAction('canDeleteClients') && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteDialog(true)}
              >
                <IconTrash className='mr-2 h-4 w-4' />
                Устгах ({selectedIds.size})
              </Button>
            )}
            <CardCreateDialog
              canCreate={canPerformAction('canCreateClients')}
              onCreated={refetch}
            />
            {/* Экспорт нь бүсээр шүүгддэггүй тул backend дээр /export/** нь
                хорооны даргад 403 буцаана — 403 өгөх товч үзүүлэхгүй. */}
            {!isKhorooLeader && (
              <Button onClick={exportToExcel} variant='outline' size='sm'>
                <IconDownload className='mr-2 h-4 w-4' />
                Excel татах
              </Button>
            )}
          </div>
        </div>

        <CardStatsCards />

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Картын жагсаалт</CardTitle>
                <CardDescription>
                  {pagination.totalElements} карт олдлоо •{' '}
                  {pagination?.statistics?.totalAccessedCount || 0} нэвтрэлттэй •
                  Хуудас {currentPage + 1}/{pagination.totalPages}
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

            <CardTable
              rows={rows}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              onEdit={setEditingCard}
              canEdit={canPerformAction('canEditClients')}
              hasActiveFilters={activeFilters.length > 0}
              activeFilters={activeFilters}
              sortConfig={sortConfig}
              onSort={handleSort}
              onFilterChange={setActiveFilters}
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

      <CardEditDialog
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onSaved={refetch}
      />

      <CardDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        clientIds={Array.from(selectedIds)}
        onDeleted={() => {
          setSelectedIds(new Set());
          refetch();
        }}
      />
    </PageContainer>
  );
}

function CardsViewSkeleton() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>Картын жагсаалт</h1>
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
